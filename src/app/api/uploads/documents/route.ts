import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/modules/auth/server/auth-guards";
import {
  DOCUMENT_UPLOAD_ACCEPTED_TYPES,
  getDocumentUploadMaxSizeBytes,
  getDocumentUploadMaxSizeMb,
  type DocumentUploadType,
} from "@/modules/documents/config/document-upload";
import { destroyDocumentFromCloudinary, uploadDocumentToCloudinary } from "@/modules/documents/server/cloudinary-documents";
import { DocumentStatus } from "@prisma/client";

function slugify(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const data = await request.formData();
  const file = data.get("file");
  const title = String(data.get("title") ?? "").trim();
  const slug = slugify(String(data.get("slug") ?? "") || title);
  const status = data.get("status") === "PUBLISHED" ? DocumentStatus.PUBLISHED : DocumentStatus.DRAFT;
  if (!(file instanceof File) || !title || !slug || title.length > 160 || slug.length > 120) return NextResponse.json({ ok: false, error: "Completá título y clave del documento." }, { status: 400 });
  if (!DOCUMENT_UPLOAD_ACCEPTED_TYPES.includes(file.type as DocumentUploadType)) return NextResponse.json({ ok: false, error: "Sólo se permiten archivos PDF o videos MP4." }, { status: 400 });

  const fileType = file.type as DocumentUploadType;
  if (file.size > getDocumentUploadMaxSizeBytes(fileType)) return NextResponse.json({ ok: false, error: `El archivo supera el límite de ${getDocumentUploadMaxSizeMb(fileType)} MB.` }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const isPdf = fileType === "application/pdf";
  const isValidFile = isPdf ? buffer.subarray(0, 5).equals(Buffer.from("%PDF-")) : buffer.subarray(4, 8).equals(Buffer.from("ftyp"));
  if (!isValidFile) return NextResponse.json({ ok: false, error: isPdf ? "El archivo no es un PDF válido." : "El archivo no es un MP4 válido." }, { status: 400 });

  try {
    const resourceType = isPdf ? "pdf" : "video" as const;
    const uploaded = await uploadDocumentToCloudinary(buffer, slug, resourceType);
    const previous = await prisma.document.findUnique({ where: { slug }, select: { cloudinaryPublicId: true, mimeType: true } });
    const document = await prisma.document.upsert({ where: { slug }, create: { title, slug, originalFileName: file.name, mimeType: file.type, sizeBytes: file.size, cloudinaryUrl: uploaded.url, cloudinaryPublicId: uploaded.publicId, status, publishedAt: status === DocumentStatus.PUBLISHED ? new Date() : null, uploadedById: user.id }, update: { title, originalFileName: file.name, mimeType: file.type, sizeBytes: file.size, cloudinaryUrl: uploaded.url, cloudinaryPublicId: uploaded.publicId, status, publishedAt: status === DocumentStatus.PUBLISHED ? new Date() : null, uploadedById: user.id }, select: { id: true, slug: true, status: true } });
    if (previous?.cloudinaryPublicId) try { await destroyDocumentFromCloudinary(previous.cloudinaryPublicId, previous.mimeType === "video/mp4" ? "video" : "pdf"); } catch (error) { console.error("[documents] Failed to clean up replaced Cloudinary asset", error); }
    return NextResponse.json({ ok: true, document });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[documents] Upload failed", { message, error });
    return NextResponse.json({
      ok: false,
      error: process.env.NODE_ENV === "development"
        ? `No pudimos subir el archivo: ${message}`
        : "No pudimos subir el archivo.",
    }, { status: 500 });
  }
}
