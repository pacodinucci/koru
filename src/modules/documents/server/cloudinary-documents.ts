import "server-only";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

export type DocumentCloudinaryResourceType = "pdf" | "video";

function configureCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new Error("cloudinary_documents_not_configured");
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
}

export async function uploadDocumentToCloudinary(buffer: Buffer, slug: string, resourceType: DocumentCloudinaryResourceType) {
  configureCloudinary();
  const isVideo = resourceType === "video";
  const options = {
    resource_type: isVideo ? "video" as const : "raw" as const,
    type: "upload" as const,
    folder: "koru/documentos",
    public_id: isVideo ? `${slug}-${randomUUID()}` : `${slug}-${randomUUID()}.pdf`,
  };

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const onUpload = (error: Error | undefined, result: { secure_url?: string; public_id?: string; done?: boolean } | undefined) => {
      if (error) { reject(error); return; }
      if (result?.done === false) return;
      if (!result?.secure_url || !result.public_id) { reject(new Error("document_upload_failed")); return; }
      resolve({ url: result.secure_url, publicId: result.public_id });
    };

    const upload = isVideo
      ? cloudinary.uploader.upload_chunked_stream({ ...options, chunk_size: 20_000_000 }, onUpload)
      : cloudinary.uploader.upload_stream(options, onUpload);
    Readable.from(buffer).pipe(upload);
  });
}

export function getDocumentDownloadUrl(publicId: string) {
  configureCloudinary();
  return cloudinary.utils.private_download_url(publicId, "pdf", { resource_type: "raw", type: "upload", attachment: true, expires_at: Math.floor(Date.now() / 1000) + 15 * 60 });
}

export async function destroyDocumentFromCloudinary(publicId: string, resourceType: DocumentCloudinaryResourceType = "pdf") {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType === "video" ? "video" : "raw", type: "upload" });
}
