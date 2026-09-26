import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import {
  deleteStudentReportPdf,
  uploadStudentReportPdf,
} from "@/modules/teachers/server/student-report-cloudinary";
import {
  getAssignedTeacherStudent,
  getTeacherStudentRecord,
  listTeacherStudentReports,
} from "@/modules/teachers/server/student-reports.repository";

function isMissingReportSchema(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && (error.code === "P2021" || error.code === "P2022");
}

function reportErrorResponse(error: unknown) {
  console.error("[student-reports] Error al consultar reportes", error);
  const migrationPending = isMissingReportSchema(error);
  return NextResponse.json({
    error: migrationPending
      ? "Los reportes todavía no están habilitados. Falta actualizar la base de datos."
      : "No pudimos cargar los reportes. Intentá nuevamente.",
  }, { status: migrationPending ? 503 : 500 });
}

const maxPdfBytes = 10 * 1024 * 1024;

type Context = { params: Promise<{ id: string }> };

async function getAssignment(studentId: string) {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return getAssignedTeacherStudent(user.id, studentId);
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const assignment = await getAssignment(id);
    if (!assignment) return NextResponse.json({ error: "Alumno no disponible." }, { status: 404 });
    const record = await getTeacherStudentRecord(id, assignment.teacherId);
    if (!record) return NextResponse.json({ error: "Alumno no disponible." }, { status: 404 });

    try {
      const reports = await listTeacherStudentReports(id);
      return NextResponse.json({
        student: { ...record, reports, reportsAvailable: true, reportsError: null },
      }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
      console.error("[student-reports] No se pudieron consultar los reportes", error);
      return NextResponse.json({
        student: {
          ...record,
          reports: [],
          reportsAvailable: false,
          reportsError: isMissingReportSchema(error)
            ? "Los reportes todavía no están habilitados. Falta actualizar la base de datos."
            : "Los reportes no están disponibles en este momento.",
        },
      }, { headers: { "Cache-Control": "private, no-store" } });
    }
  } catch (error) {
    console.error("[student-reports] No se pudo cargar el expediente", error);
    return NextResponse.json({ error: "No pudimos cargar el expediente. Intentá nuevamente." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const assignment = await getAssignment(id);
  if (!assignment) return NextResponse.json({ error: "Alumno no disponible." }, { status: 404 });

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const type = formData.get("type");
  const body = String(formData.get("body") ?? "").trim();
  const file = formData.get("file");

  if (title.length < 2 || title.length > 160 || (type !== "TEXT" && type !== "PDF")) {
    return NextResponse.json({ error: "Ingresá un título válido y elegí el tipo de reporte." }, { status: 400 });
  }

  if (type === "TEXT") {
    if (!body || body.length > 10000) {
      return NextResponse.json({ error: "Escribí el reporte (máximo 10.000 caracteres)." }, { status: 400 });
    }
    try {
      await prisma.studentReport.create({
        data: { studentId: id, teacherId: assignment.teacherId, type, title, body },
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
      return reportErrorResponse(error);
    }
  }

  if (!(file instanceof File) || file.type !== "application/pdf" || file.size === 0 || file.size > maxPdfBytes) {
    return NextResponse.json({ error: "Adjuntá un PDF de hasta 10 MB." }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    return NextResponse.json({ error: "El archivo no es un PDF válido." }, { status: 400 });
  }

  let publicId: string | null = null;
  try {
    publicId = await uploadStudentReportPdf(buffer);
    const stillAssigned = await getAssignment(id);
    if (!stillAssigned || stillAssigned.teacherId !== assignment.teacherId) {
      throw new Error("teacher_assignment_changed");
    }
    await prisma.studentReport.create({
      data: {
        studentId: id,
        teacherId: assignment.teacherId,
        type,
        title,
        cloudinaryPublicId: publicId,
        fileName: file.name.slice(0, 255),
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (publicId) {
      try { await deleteStudentReportPdf(publicId); } catch (cleanupError) {
        console.error("[student-reports] No se pudo limpiar el PDF huérfano", cleanupError);
      }
    }
    console.error("[student-reports] No se pudo guardar el reporte", error);
    return reportErrorResponse(error);
  }
}

