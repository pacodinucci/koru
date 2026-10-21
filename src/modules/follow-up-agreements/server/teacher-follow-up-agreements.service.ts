import "server-only";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AgreementError, parseTeacherAgreementForm, teacherAgreementId, validTeacherAttachmentMime } from "@/modules/follow-up-agreements/lib/teacher-agreement-validation";
import { deleteAgreementFile, getAgreementFileUrl, readAgreementFile, uploadAgreementFile } from "@/modules/follow-up-agreements/server/agreement-files";
import { ownTeacherAgreementScope, requireTeacherAgreementActor } from "./teacher-follow-up-agreements.repository";

const conflict = () => new AgreementError("El acuerdo cambió. Volvé a intentarlo.", 409);
const unavailable = () => new AgreementError("Acuerdo no disponible.", 404);
const privateHeaders = { "Cache-Control": "private, no-store" };

export async function teacherAgreementResponse(action: () => Promise<Response>, fallback: string) {
  try { return await action(); }
  catch (error) {
    if (!(error instanceof AgreementError)) console.error("[teacher-follow-up-agreements] Operación fallida", error);
    return NextResponse.json({ error: error instanceof AgreementError ? error.message : fallback }, {
      status: error instanceof AgreementError ? error.status : 500, headers: privateHeaders,
    });
  }
}

function ok(status = 200) {
  return NextResponse.json({ ok: true }, { status, headers: privateHeaders });
}

async function cleanFile(publicId: string | null) {
  if (!publicId) return;
  try { await deleteAgreementFile(publicId); }
  catch (error) { console.error("[teacher-follow-up-agreements] No se pudo limpiar el adjunto", error); }
}

async function findAgreement(id: string) {
  const row = await prisma.teacherFollowUpAgreement.findFirst({ where: { id } });
  if (!row) throw unavailable();
  return row;
}

export async function saveTeacherAgreement(request: Request, rawId?: string) {
  const user = await requireTeacherAgreementActor(true);
  const id = rawId === undefined ? undefined : teacherAgreementId(rawId);
  const previous = id ? await findAgreement(id) : null;
  if (previous?.status === "PUBLISHED") throw conflict();
  let form: FormData;
  try { form = await request.formData(); }
  catch { throw new AgreementError("Revisá los datos del acuerdo."); }
  const input = parseTeacherAgreementForm(form, !id);
  const teacherId = previous?.teacherId ?? input.teacherId!;
  if (!await prisma.teacherProfile.findUnique({ where: { id: teacherId }, select: { id: true } })) {
    throw new AgreementError("Docente no disponible.", 404);
  }
  const file = input.file && validTeacherAttachmentMime(input.file) ? await readAgreementFile(input.file) : null;
  if (input.file && !file) throw new AgreementError("Adjuntá un PDF, DOC, DOCX, JPG, PNG o WEBP válido de hasta 10 MB.");
  let uploaded: string | null = null;
  try {
    if (file) uploaded = await uploadAgreementFile(file);
    const currentUser = await requireTeacherAgreementActor(true);
    if (currentUser.id !== user.id) throw new AgreementError("No autorizado.", 403);
    const data = {
      title: input.title, body: input.body,
      ...(file ? { attachmentPublicId: uploaded, attachmentFileName: file.fileName, attachmentMimeType: file.mimeType } : {}),
    };
    if (id && previous) {
      // Revision CAS also serializes competing attachment replacements/deletes.
      const result = await prisma.teacherFollowUpAgreement.updateMany({
        where: { id, status: "DRAFT", revision: previous.revision },
        data: { ...data, revision: { increment: 1 } },
      });
      if (result.count !== 1) throw conflict();
    } else {
      await prisma.teacherFollowUpAgreement.create({ data: { ...data, teacherId, authorId: user.id } });
    }
  } catch (error) {
    await cleanFile(uploaded);
    throw error;
  }
  // Do not delete the old file until the conditional persistence succeeded.
  if (file && previous) await cleanFile(previous.attachmentPublicId);
  return ok(id ? 200 : 201);
}

export async function publishTeacherAgreement(rawId: string) {
  await requireTeacherAgreementActor(true);
  const id = teacherAgreementId(rawId);
  const previous = await findAgreement(id);
  if (previous.status !== "DRAFT") throw conflict();
  const result = await prisma.teacherFollowUpAgreement.updateMany({
    where: { id, status: "DRAFT", revision: previous.revision },
    data: { status: "PUBLISHED", publishedAt: new Date(), revision: { increment: 1 } },
  });
  if (result.count !== 1) throw conflict();
  return ok();
}

export async function deleteTeacherAgreement(rawId: string) {
  await requireTeacherAgreementActor(true);
  const id = teacherAgreementId(rawId), previous = await findAgreement(id);
  const result = await prisma.teacherFollowUpAgreement.deleteMany({ where: { id, revision: previous.revision } });
  if (result.count !== 1) throw conflict();
  await cleanFile(previous.attachmentPublicId);
  return ok();
}

export async function consentTeacherAgreement(rawId: string) {
  const user = await requireTeacherAgreementActor();
  if (user.role === "SUPERADMIN") throw new AgreementError("No autorizado.", 403);
  const where = { id: teacherAgreementId(rawId), ...ownTeacherAgreementScope(user.id) };
  // Ownership is in the database predicate, never a client teacher/actor field.
  const agreement = await prisma.teacherFollowUpAgreement.findFirst({ where, select: { id: true, acceptedAt: true } });
  if (!agreement) throw unavailable();
  if (!agreement.acceptedAt) {
    const result = await prisma.teacherFollowUpAgreement.updateMany({
      where: { ...where, acceptedAt: null },
      data: { acceptedAt: new Date(), acceptedById: user.id, revision: { increment: 1 } },
    });
    if (result.count !== 1) {
      const current = await prisma.teacherFollowUpAgreement.findFirst({ where, select: { acceptedAt: true } });
      if (!current?.acceptedAt) throw unavailable();
    }
  }
  return ok();
}

export async function teacherAgreementAttachment(rawId: string) {
  const user = await requireTeacherAgreementActor();
  const id = teacherAgreementId(rawId);
  const agreement = await prisma.teacherFollowUpAgreement.findFirst({
    where: { id, ...(user.role === "SUPERADMIN" ? {} : ownTeacherAgreementScope(user.id)) },
    select: { attachmentPublicId: true, attachmentFileName: true, attachmentMimeType: true },
  });
  if (!agreement?.attachmentPublicId || !agreement.attachmentMimeType) throw unavailable();
  try {
    const url = getAgreementFileUrl(agreement.attachmentPublicId, agreement.attachmentMimeType);
    const upstream = await fetch(url, { cache: "no-store", redirect: "error" });
    if (!upstream.ok || !upstream.body) throw new Error("agreement_download_failed");
    const inline = agreement.attachmentMimeType.startsWith("image/") || agreement.attachmentMimeType === "application/pdf";
    return new Response(upstream.body, { headers: {
      ...privateHeaders, "Content-Type": agreement.attachmentMimeType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(agreement.attachmentFileName || "adjunto")}`,
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    throw new AgreementError("No pudimos abrir el adjunto.", 503);
  }
}
