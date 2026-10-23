import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { getAssignedTeacherStudent } from "@/modules/teachers/server/student-reports.repository";
import {
  createPsychopedagogyEntry,
  listStudentPsychopedagogyEntries,
  getPsychopedagogyStudentForSuperadmin,
  listStudentPsychopedagogyEntriesForSuperadmin,
} from "@/modules/psychopedagogy/server/psychopedagogy.repository";

type Context = { params: Promise<{ id: string }> };

async function getAssignment(studentId: string) {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN_TEACHER")) return null;
  return getAssignedTeacherStudent(user.id, studentId);
}

function unavailable(error: unknown) {
  console.error("[psychopedagogy] No se pudo acceder a las bitácoras", error);
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  const pendingMigration = code === "P2021" || code === "P2022";
  return NextResponse.json({
    error: pendingMigration
      ? "Las bitácoras todavía no están habilitadas. Falta actualizar la base de datos."
      : "No pudimos acceder a las bitácoras. Intentá nuevamente.",
  }, { status: pendingMigration ? 503 : 500 });
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (user?.role === "SUPERADMIN") {
      const student = await getPsychopedagogyStudentForSuperadmin(id);
      if (!student) return NextResponse.json({ error: "Alumno no disponible." }, { status: 404 });
      const entries = await listStudentPsychopedagogyEntriesForSuperadmin(id);
      return NextResponse.json({ entries }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const assignment = user && (user.role === "TEACHER" || user.role === "ADMIN_TEACHER")
      ? await getAssignedTeacherStudent(user.id, id) : null;
    if (!assignment) return NextResponse.json({ error: "Alumno no disponible." }, { status: 404 });
    const entries = await listStudentPsychopedagogyEntries(id, assignment.teacherId);
    return NextResponse.json({ entries }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const assignment = await getAssignment(id);
    if (!assignment) return NextResponse.json({ error: "Alumno no disponible." }, { status: 404 });
    const input: unknown = await request.json().catch(() => null);
    const data = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const body = typeof data.body === "string" ? data.body.trim() : "";
    const date = typeof data.date === "string" ? data.date : "";
    const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00.000Z`) : null;
    if (!entryDate || !Number.isFinite(entryDate.getTime()) || entryDate.toISOString().slice(0, 10) !== date
      || !title || title.length > 160 || !body || body.length > 10000) {
      return NextResponse.json({ error: "Ingresá una fecha válida, un título (máximo 160 caracteres) y un texto (máximo 10.000 caracteres)." }, { status: 400 });
    }
    await createPsychopedagogyEntry({ studentId: id, teacherId: assignment.teacherId, entryDate, title, body });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return unavailable(error);
  }
}
