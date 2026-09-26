import "server-only";

import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";

function configureCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("cloudinary_not_configured");
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadStudentReportPdf(buffer: Buffer) {
  configureCloudinary();
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: "raw",
      type: "authenticated",
      folder: "koru/reportes-alumnos",
      public_id: `${randomUUID()}.pdf`,
    }, (error, result) => {
      if (error || !result?.public_id) {
        reject(error ?? new Error("student_report_upload_failed"));
      } else {
        resolve(result.public_id);
      }
    });
    stream.end(buffer);
  });
}

export function getStudentReportDownloadUrl(publicId: string) {
  configureCloudinary();
  return cloudinary.utils.private_download_url(publicId, "pdf", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
  });
}

export async function deleteStudentReportPdf(publicId: string) {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw", type: "authenticated" });
}

