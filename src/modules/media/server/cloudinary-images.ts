import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";

export type MediaPurpose = "BLOG" | "CALENDAR" | "CMS";

const folders: Record<MediaPurpose, string> = {
  BLOG: "koru/blog",
  CALENDAR: "koru/calendar",
  CMS: "koru/cms",
};

function configure() {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("cloudinary_not_configured");
  }


  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  purpose: MediaPurpose,
  options?: { publicId?: string },
) {
  configure();

  return new Promise<{ url: string; publicId: string }>((resolve, reject) =>
    cloudinary.uploader
      .upload_stream(
        {
          folder: folders[purpose],
          public_id: options?.publicId?.replace(`${folders[purpose]}/`, ""),
          overwrite: Boolean(options?.publicId),
          invalidate: Boolean(options?.publicId),
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        },
        (error, result) => {
          if (error || !result?.secure_url || !result.public_id) {
            reject(error ?? new Error("upload_failed"));
            return;
          }

          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .end(buffer),
  );
}

export type CloudinaryLibraryImage = {
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  createdAt: string | null;
};

export async function listCloudinaryImages({
  cursor,
  limit = 24,
}: {
  cursor?: string;
  limit?: number;
}) {
  configure();

  const result = await cloudinary.api.resources({
    type: "upload",
    resource_type: "image",
    prefix: "koru/",
    max_results: Math.min(Math.max(limit, 1), 50),
    next_cursor: cursor,
    direction: "desc",
  });

  const images: CloudinaryLibraryImage[] = (
    result.resources as Array<{
      secure_url?: string;
      public_id?: string;
      width?: number;
      height?: number;
      created_at?: string;
    }>
  ).flatMap((resource) =>
    resource.secure_url && resource.public_id
      ? [
          {
            url: resource.secure_url,
            publicId: resource.public_id,
            width: resource.width ?? null,
            height: resource.height ?? null,
            createdAt: resource.created_at ?? null,
          },
        ]
      : [],
  );

  return {
    images,
    nextCursor:
      typeof result.next_cursor === "string" ? result.next_cursor : null,
  };
}

export async function destroyCloudinaryImages(publicIds: string[]) {
  if (!publicIds.length) {
    return;
  }

  try {
    configure();
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: "image",
    });
  } catch (error) {
    console.error("[media] Failed to delete Cloudinary images", error);
  }
}
