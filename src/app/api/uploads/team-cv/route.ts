import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

function isCloudinaryConfigured() {
  return (
    Boolean(env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(env.CLOUDINARY_API_KEY) &&
    Boolean(env.CLOUDINARY_API_SECRET)
  );
}

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function uploadCvToCloudinary(buffer: Buffer, fileName: string) {
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "koru/team-cv",
          resource_type: "raw",
          use_filename: true,
          unique_filename: true,
          filename_override: fileName,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(error ?? new Error("Upload failed"));
            return;
          }

          resolve(result.secure_url);
        },
      )
      .end(buffer);
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Archivo inválido" }, { status: 400 });
  }

  const extension = getFileExtension(file.name);

  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { ok: false, error: "Solo se aceptan archivos PDF, DOC o DOCX" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { ok: false, error: "El CV supera el límite de 10MB" },
      { status: 400 },
    );
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Cloudinary no está configurado" },
      { status: 500 },
    );
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const url = await uploadCvToCloudinary(buffer, file.name);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No pudimos subir el CV a Cloudinary" },
      { status: 500 },
    );
  }
}
