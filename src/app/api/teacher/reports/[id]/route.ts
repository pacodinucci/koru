import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { deleteStudentReportFile } from "@/modules/teachers/server/student-report-cloudinary";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN_TEACHER") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const teacher = await prisma.teacherProfile.findFirst({
      where: { userId: user.id, isActive: true },
      select: { id: true },
    });
    if (!teacher) return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });

    const report = await prisma.studentReport.findFirst({
      where: {
        id,
        teacherId: teacher.id,
        student: {
          status: "ACTIVE",
          group: {
            isActive: true,
            teacherResponsibilities: { some: { teacherId: teacher.id } },
          },
        },
      },
      select: { cloudinaryPublicId: true },
    });
    if (!report) return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });

    const deleted = await prisma.studentReport.deleteMany({
      where: {
        id,
        teacherId: teacher.id,
        student: {
          status: "ACTIVE",
          group: {
            isActive: true,
            teacherResponsibilities: { some: { teacherId: teacher.id } },
          },
        },
      },
    });
    if (deleted.count !== 1) return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });
    if (report.cloudinaryPublicId) {
      try { await deleteStudentReportFile(report.cloudinaryPublicId); }
      catch (error) { console.error("[student-reports] No se pudo borrar el archivo del reporte", error); }
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[student-reports] No se pudo eliminar el reporte", error);
    return NextResponse.json({ error: "No pudimos eliminar el reporte. Intentá nuevamente." }, { status: 500 });
  }
}
