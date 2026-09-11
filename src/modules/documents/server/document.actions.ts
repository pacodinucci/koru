"use server";
import { DocumentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { prisma } from "@/lib/prisma";
import { destroyDocumentFromCloudinary } from "@/modules/documents/server/cloudinary-documents";
const path = "/dashboard/documentos";
function finish(message: string, type: "ok" | "error"): never { redirect(`${path}?${type}=${encodeURIComponent(message)}`); }
export async function setDocumentStatusAction(formData: FormData) {
  await requirePermission("documents.manage"); const id = String(formData.get("id") ?? ""); const status = formData.get("status");
  if (!id || (status !== "DRAFT" && status !== "PUBLISHED")) finish("No pudimos actualizar el documento.", "error");
  await prisma.document.update({ where: { id }, data: { status: status as DocumentStatus, publishedAt: status === "PUBLISHED" ? new Date() : null } }); revalidatePath(path); finish(status === "PUBLISHED" ? "Documento publicado." : "Documento pasado a borrador.", "ok");
}
export async function deleteDocumentAction(formData: FormData) {
  await requirePermission("documents.manage"); const id = String(formData.get("id") ?? ""); if (!id) finish("No pudimos eliminar el documento.", "error");
  const document = await prisma.document.findUnique({ where: { id }, select: { cloudinaryPublicId: true } }); if (!document) finish("El documento ya no existe.", "error");
  await prisma.document.delete({ where: { id } }); try { await destroyDocumentFromCloudinary(document.cloudinaryPublicId); } catch (error) { console.error("[documents] Failed to delete Cloudinary asset", error); }
  revalidatePath(path); finish("Documento eliminado.", "ok");
}
