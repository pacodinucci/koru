import { DocumentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/modules/auth/server/auth-guards";
import { DOCUMENT_UPLOAD_ACCEPTED_TYPES, DOCUMENT_UPLOAD_MAX_SIZE_BYTES, DOCUMENT_UPLOAD_MAX_SIZE_MB } from "@/modules/documents/config/document-upload";
import { destroyDocumentFromCloudinary, uploadDocumentToCloudinary } from "@/modules/documents/server/cloudinary-documents";
function slugify(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
export async function POST(request: Request) {
  const user = await getAdminUser(); if (!user) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  const data = await request.formData(); const file = data.get("file"); const title = String(data.get("title") ?? "").trim(); const slug = slugify(String(data.get("slug") ?? "") || title); const status = data.get("status") === "PUBLISHED" ? DocumentStatus.PUBLISHED : DocumentStatus.DRAFT;
  if (!(file instanceof File) || !title || !slug || title.length > 160 || slug.length > 120) return NextResponse.json({ ok: false, error: "Completá título y clave del documento." }, { status: 400 });
  if (!DOCUMENT_UPLOAD_ACCEPTED_TYPES.includes(file.type as "application/pdf")) return NextResponse.json({ ok: false, error: "Sólo se permiten archivos PDF." }, { status: 400 });
  if (file.size > DOCUMENT_UPLOAD_MAX_SIZE_BYTES) return NextResponse.json({ ok: false, error: `El PDF supera el límite de ${DOCUMENT_UPLOAD_MAX_SIZE_MB} MB.` }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer()); if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) return NextResponse.json({ ok: false, error: "El archivo no es un PDF válido." }, { status: 400 });
  try {
    const uploaded = await uploadDocumentToCloudinary(buffer, slug); const previous = await prisma.document.findUnique({ where: { slug }, select: { cloudinaryPublicId: true } });
    const document = await prisma.document.upsert({ where: { slug }, create: { title, slug, originalFileName: file.name, mimeType: file.type, sizeBytes: file.size, cloudinaryUrl: uploaded.url, cloudinaryPublicId: uploaded.publicId, status, publishedAt: status === DocumentStatus.PUBLISHED ? new Date() : null, uploadedById: user.id }, update: { title, originalFileName: file.name, mimeType: file.type, sizeBytes: file.size, cloudinaryUrl: uploaded.url, cloudinaryPublicId: uploaded.publicId, status, publishedAt: status === DocumentStatus.PUBLISHED ? new Date() : null, uploadedById: user.id }, select: { id: true, slug: true, status: true } });
    if (previous?.cloudinaryPublicId) try { await destroyDocumentFromCloudinary(previous.cloudinaryPublicId); } catch (error) { console.error("[documents] Failed to clean up replaced Cloudinary asset", error); }
    return NextResponse.json({ ok: true, document });
  } catch (error) { console.error("[documents] Upload failed", error); return NextResponse.json({ ok: false, error: "No pudimos subir el documento." }, { status: 500 }); }
}
