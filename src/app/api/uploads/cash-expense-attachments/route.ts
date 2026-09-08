import { randomUUID } from "node:crypto";

import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";

const maxSize = 10 * 1024 * 1024;
const acceptedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function configureCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new Error("cloudinary_not_configured");
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!teacher) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  const formData = await request.formData();
  const reportId = String(formData.get("reportId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || !reportId || file.size > maxSize || !acceptedMimeTypes.has(file.type)) return NextResponse.json({ ok: false, error: "Adjuntá un PDF o imagen de hasta 10 MB." }, { status: 400 });
  const report = await prisma.cashExpenseReport.findFirst({ where: { id: reportId, teacherId: teacher.id, status: "PENDING" }, select: { id: true } });
  if (!report) return NextResponse.json({ ok: false, error: "La rendición ya no admite adjuntos." }, { status: 409 });
  try {
    configureCloudinary();
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await new Promise<{ url: string }>((resolve, reject) => cloudinary.uploader.upload_stream({ resource_type: "auto", folder: "koru/rendiciones", public_id: `${report.id}-${randomUUID()}` }, (error, result) => error || !result?.secure_url ? reject(error ?? new Error("upload_failed")) : resolve({ url: result.secure_url })).end(buffer));
    const attachment = await prisma.cashExpenseAttachment.create({ data: { reportId: report.id, url: uploaded.url, fileName: file.name, mimeType: file.type } });
    return NextResponse.json({ ok: true, attachment: { id: attachment.id, url: attachment.url, fileName: attachment.fileName } });
  } catch { return NextResponse.json({ ok: false, error: "No pudimos subir el adjunto." }, { status: 500 }); }
}