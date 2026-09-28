export class AgreementError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function readIds(value: FormDataEntryValue | null): string[] {
  try {
    const ids: unknown = JSON.parse(String(value ?? ""));
    if (!Array.isArray(ids) || ids.length > 50 || !ids.every((id) => typeof id === "string" && id.length > 0)) throw new Error();
    return [...new Set(ids)];
  } catch { throw new AgreementError("Seleccioná alumnos válidos."); }
}

export function parseAgreementForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (title.length < 2 || title.length > 160) throw new AgreementError("Ingresá un título de entre 2 y 160 caracteres.");
  if (!body || body.length > 10000) throw new AgreementError("Escribí el acuerdo (máximo 10.000 caracteres).");
  const studentIds = readIds(formData.get("studentIds"));
  if (studentIds.length < 1) throw new AgreementError("Elegí al menos un alumno.");
  return { title, body, studentIds, removeAttachment: formData.get("removeAttachment") === "true" };
}

export function validateAgreementParticipants(
  students: readonly { id: string; familyId: string | null }[],
  studentIds: readonly string[],
): string[] {
  const allowedStudents = new Map(students.map((student) => [student.id, student.familyId]));
  if (studentIds.length < 1 || studentIds.some((id) => !allowedStudents.get(id))) {
    throw new AgreementError("Sólo podés incluir alumnos con familia activa de tus grupos.", 403);
  }
  return [...new Set(studentIds.map((id) => allowedStudents.get(id)!))];
}
