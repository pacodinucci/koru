import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";
export type MediaPurpose = "BLOG" | "CALENDAR";
const folders: Record<MediaPurpose, string> = { BLOG: "koru/blog", CALENDAR: "koru/calendar" };
function configure() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new Error("cloudinary_not_configured");
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
}
export async function uploadImageToCloudinary(buffer: Buffer, purpose: MediaPurpose) {
  configure();
  return new Promise<{url:string;publicId:string}>((resolve,reject) => cloudinary.uploader.upload_stream({ folder: folders[purpose], resource_type: "image", allowed_formats: ["jpg","jpeg","png","webp","avif"] }, (error,result) => {
    if (error || !result?.secure_url || !result.public_id) return reject(error ?? new Error("upload_failed"));
    resolve({url:result.secure_url, publicId:result.public_id});
  }).end(buffer));
}
export async function destroyCloudinaryImages(publicIds: string[]) {
  if (!publicIds.length) return;
  try { configure(); await cloudinary.api.delete_resources(publicIds, {resource_type:"image"}); } catch (error) { console.error("[media] Failed to delete Cloudinary images", error); }
}