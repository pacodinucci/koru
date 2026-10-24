"use server";

import { GET, POST } from "@/modules/psychopedagogy/server/psychopedagogy-profile.handlers";

type Failure = { ok: false; error: string };
type ReadResult = { ok: true; description: string } | Failure;
type SaveResult = { ok: true } | Failure;

function validStudentId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200;
}

export async function readLearningReportAction(studentId: string): Promise<ReadResult> {
  if (!validStudentId(studentId)) return { ok: false, error: "Alumno no disponible." };
  // Reuse the same session, role and student guards; no browser API request is needed.
  const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: studentId }) });
  const result = await response.json();
  if (!response.ok) return { ok: false, error: result.error ?? "No pudimos cargar el reporte." };
  return { ok: true, description: result.profile.learningStyleAndTemperament };
}

export async function saveLearningReportAction(studentId: string, description: unknown): Promise<SaveResult> {
  if (!validStudentId(studentId)) return { ok: false, error: "Alumno no disponible." };
  // The section is fixed here. Callers cannot turn this action into an append command.
  const response = await POST(new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section: "learning", description }),
  }), { params: Promise.resolve({ id: studentId }) });
  const result = await response.json();
  if (!response.ok || !result.ok) return { ok: false, error: result.error ?? "No pudimos guardar el reporte." };
  return { ok: true };
}
