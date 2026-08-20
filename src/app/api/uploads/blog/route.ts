import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

import { getAdminUser } from "@/modules/auth/server/auth-guards";
import {
  BLOG_IMAGE_MAX_SIZE_BYTES,
  BLOG_IMAGE_MAX_SIZE_MB,
} from "@/modules/blog/config/blog-upload";
import { env } from "@/lib/env";

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
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Archivo invalido" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Solo imagenes" }, { status: 400 });
  }

  if (file.size > BLOG_IMAGE_MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `La imagen supera el limite de ${BLOG_IMAGE_MAX_SIZE_MB} MB`,
      },
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
