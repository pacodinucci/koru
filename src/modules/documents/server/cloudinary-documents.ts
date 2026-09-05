import "server-only";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

function configureCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new Error("cloudinary_documents_not_configured");
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
}
export async function uploadDocumentToCloudinary(buffer: Buffer, slug: string) {
  configureCloudinary();
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => cloudinary.uploader.upload_stream({ resource_type: "raw", type: "upload", folder: "koru/documentos", public_id: `${slug}-${randomUUID()}.pdf` }, (error, result) => {
    if (error || !result?.secure_url || !result.public_id) return reject(error ?? new Error("document_upload_failed"));
    resolve({ url: result.secure_url, publicId: result.public_id });
  }).end(buffer));
}
export function getDocumentDownloadUrl(publicId: string) {
  configureCloudinary();
  return cloudinary.utils.private_download_url(publicId, "pdf", { resource_type: "raw", type: "upload", attachment: true, expires_at: Math.floor(Date.now() / 1000) + 15 * 60, });
}
export async function destroyDocumentFromCloudinary(publicId: string) {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw", type: "upload" });
}
