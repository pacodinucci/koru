import { AgreementError } from "./agreement-validation";

export { AgreementError };

export function teacherAgreementId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    throw new AgreementError("Identificador inválido.");
  }
  return value;
}

export function parseTeacherAgreementForm(form: FormData, creating: boolean) {
  for (const key of ["title", "body", "file", ...(creating ? ["teacherId"] : [])]) {
    if (form.getAll(key).length > 1) throw new AgreementError("Revisá los datos del acuerdo.");
  }
  const rawTitle = form.get("title"), rawBody = form.get("body");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (title.length < 2 || title.length > 160) throw new AgreementError("Ingresá un título de entre 2 y 160 caracteres.");
  if (!body || body.length > 10000) throw new AgreementError("Escribí el acuerdo (máximo 10.000 caracteres).");
  const file = form.get("file");
  if (file !== null && !(file instanceof File)) throw new AgreementError("Revisá los datos del acuerdo.");
  return { title, body, file, teacherId: creating ? teacherAgreementId(form.get("teacherId")) : undefined };
}

// The shared signature helper intentionally keeps its historical MIME behavior.
// Tighten declared MIME here only, without changing student agreement uploads.
export function validTeacherAttachmentMime(file: File) {
  const mimeByExtension: Record<string, string> = {
    pdf: "application/pdf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  };
  const extension = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return !!extension && !!mimeByExtension[extension]
    && (!file.type || file.type === "application/octet-stream" || file.type === mimeByExtension[extension]);
}
