import "server-only";

import { NextResponse } from "next/server";

import {
  getSafeStudentReportFileName, isStudentReportFileType, isValidStudentReportFile,
} from "@/modules/teachers/lib/student-report-file";
import { normalizeStudentReportBody } from "@/modules/teachers/lib/student-report-rich-text";
import {
  deleteStudentReportFile, getStudentReportDownloadUrl, uploadStudentReportFile,
} from "@/modules/teachers/server/student-report-cloudinary";
import {
  createTeacherReportRecord, deleteTeacherReportRecord, findTeacherReportFile,
  requireReportTeacher, requireTeacherReportsSuperadmin, setTeacherReportVisibility,
  TeacherReportError, teacherReportMimeTypes, validateTeacherReportId,
} from "@/modules/teachers/server/teacher-reports.repository";

type ReportContext = { params: Promise<{ id: string }> };
type TeacherContext = { params: Promise<{ teacherId: string }> };
const privateHeaders = { "Cache-Control": "private, no-store" };
const fileMessage = "Adjuntá un PDF, DOC o DOCX de hasta 10 MB.";
const maxFileBytes = 10 * 1024 * 1024;

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}

function failure(error: unknown, message: string) {
  if (error instanceof TeacherReportError) return json({ error: error.message }, error.status);
  // Do not expose database, storage identifiers or signed URLs in error responses.
  console.error("[teacher-reports] Operation failed");
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "P2021" || code === "P2022") {
    return json({ error: "Los reportes todavía no están habilitados. Falta actualizar la base de datos." }, 503);
  }
  return json({ error: message }, 500);
}

async function cleanupFile(publicId: string) {
  try { await deleteStudentReportFile(publicId); }
  catch { console.error("[teacher-reports] File cleanup failed"); }
}

export async function createTeacherReport(request: Request, { params }: TeacherContext) {
  let uploadedId: string | null = null;
  try {
    const user = await requireTeacherReportsSuperadmin();
    const { teacherId } = await params;
    validateTeacherReportId(teacherId);
    await requireReportTeacher(teacherId);
    const form = await request.formData().catch(() => null);
    if (!form || ["title", "content", "reportFile"].some((key) => form.getAll(key).length > 1)) {
      throw new TeacherReportError("Revisá los datos del reporte.", 400);
    }
    const rawTitle = form.get("title");
    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
    if (title.length < 2 || title.length > 160) {
      throw new TeacherReportError("Ingresá un título válido (entre 2 y 160 caracteres).", 400);
    }
    const rawContent = form.get("content");
    if (rawContent !== null && typeof rawContent !== "string") {
      throw new TeacherReportError("Revisá los datos del reporte.", 400);
    }
    const content = (rawContent ?? "").trim();
    const file = form.get("reportFile");
    // Browsers may submit an empty file input; it is not an attachment.
    const hasFile = file instanceof File && (file.name.length > 0 || file.size > 0);
    if (file !== null && !(file instanceof File)) throw new TeacherReportError(fileMessage, 400);
    if (hasFile && content) {
      throw new TeacherReportError("Adjuntá un archivo o escribí el reporte, pero no ambos.", 400);
    }
    if (!hasFile) {
      const normalized = normalizeStudentReportBody(content);
      if (!normalized) throw new TeacherReportError("Escribí el reporte (máximo 10.000 caracteres).", 400);
      await createTeacherReportRecord({ teacherId, authorId: user.id, type: "TEXT", title, content: normalized });
      return json({ ok: true }, 201);
    }

    const type = file.name.split(".").pop()?.toUpperCase();
    if (!isStudentReportFileType(type) || file.size === 0 || file.size > maxFileBytes) {
      throw new TeacherReportError(fileMessage, 400);
    }
    const fileName = getSafeStudentReportFileName(file.name, type);
    if (!fileName || (file.type && file.type !== "application/octet-stream" && file.type !== teacherReportMimeTypes[type])) {
      throw new TeacherReportError(fileMessage, 400);
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length === 0 || bytes.length > maxFileBytes) throw new TeacherReportError(fileMessage, 400);
    if (!isValidStudentReportFile(bytes, type)) throw new TeacherReportError(`El archivo no es un ${type} válido.`, 400);
    // Reuse the existing authenticated/raw upload helper, never a public asset upload.
    uploadedId = await uploadStudentReportFile(bytes, type);
    const currentUser = await requireTeacherReportsSuperadmin();
    if (currentUser.id !== user.id) throw new TeacherReportError("No autorizado.", 403);
    await requireReportTeacher(teacherId);
    await createTeacherReportRecord({ teacherId, authorId: user.id, type, title, fileName, cloudinaryPublicId: uploadedId });
    return json({ ok: true }, 201);
  } catch (error) {
    if (uploadedId) await cleanupFile(uploadedId);
    return failure(error, "No pudimos guardar el reporte. Intentá nuevamente.");
  }
}

export async function changeTeacherReportVisibility(request: Request, { params }: ReportContext) {
  try {
    await requireTeacherReportsSuperadmin();
    const { id } = await params;
    validateTeacherReportId(id);
    const payload: unknown = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)
      || typeof (payload as { visibleToTeacher?: unknown }).visibleToTeacher !== "boolean") {
      throw new TeacherReportError("Indicá si el reporte será visible para el docente.", 400);
    }
    const { visibleToTeacher } = payload as { visibleToTeacher: boolean };
    const result = await setTeacherReportVisibility(id, visibleToTeacher);
    if (result.count !== 1) throw new TeacherReportError("Reporte no disponible.", 404);
    return json({ ok: true, visibleToTeacher });
  } catch (error) {
    return failure(error, "No pudimos cambiar la visibilidad. Intentá nuevamente.");
  }
}

export async function removeTeacherReport(_request: Request, { params }: ReportContext) {
  try {
    await requireTeacherReportsSuperadmin();
    const { id } = await params;
    validateTeacherReportId(id);
    const report = await findTeacherReportFile(id);
    if (!report) throw new TeacherReportError("Reporte no disponible.", 404);
    // Delete the row first: a failed DB mutation must not destroy a referenced file.
    const result = await deleteTeacherReportRecord(id);
    if (result.count !== 1) throw new TeacherReportError("Reporte no disponible.", 404);
    if (report.cloudinaryPublicId) await cleanupFile(report.cloudinaryPublicId);
    return json({ ok: true });
  } catch (error) {
    return failure(error, "No pudimos eliminar el reporte. Intentá nuevamente.");
  }
}

export async function downloadTeacherReport(_request: Request, { params }: ReportContext) {
  try {
    await requireTeacherReportsSuperadmin();
    const { id } = await params;
    validateTeacherReportId(id);
    const report = await findTeacherReportFile(id);
    if (!report?.cloudinaryPublicId || !isStudentReportFileType(report.type)) {
      throw new TeacherReportError("Reporte no disponible.", 404);
    }
    try {
      const url = getStudentReportDownloadUrl(report.cloudinaryPublicId, report.type);
      const upstream = await fetch(url, { cache: "no-store" });
      if (!upstream.ok || !upstream.body) throw new Error("teacher_report_download_failed");
      const name = getSafeStudentReportFileName(report.fileName ?? "", report.type) ?? `reporte.${report.type.toLowerCase()}`;
      return new Response(upstream.body, { headers: {
        ...privateHeaders,
        "Content-Type": teacherReportMimeTypes[report.type],
        "Content-Disposition": `${report.type === "PDF" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
        "X-Content-Type-Options": "nosniff",
      } });
    } catch {
      return json({ error: "No pudimos abrir el documento." }, 503);
    }
  } catch (error) {
    return failure(error, "No pudimos abrir el documento.");
  }
}
