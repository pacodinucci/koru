import { v2 as cloudinary } from "cloudinary";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isCloudinaryConfigured() {
  return (
    Boolean(env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(env.CLOUDINARY_API_KEY) &&
    Boolean(env.CLOUDINARY_API_SECRET)
  );
}

function uploadToCloudinary(buffer: Buffer) {
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "koru/blog",
          resource_type: "image",
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Archivo invalido" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Solo imagenes" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { ok: false, error: "La imagen supera el limite de 10MB" },
      { status: 400 },
    );
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Cloudinary no esta configurado" },
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
  let secureUrl: string;

  try {
    secureUrl = await uploadToCloudinary(buffer);
  } catch {
    return NextResponse.json(
      { ok: false, error: "No pudimos subir la imagen a Cloudinary" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    url: secureUrl,
  });
}
