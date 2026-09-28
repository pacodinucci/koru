import "server-only";

import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";
import { isValidStudentReportFile } from "@/modules/teachers/lib/student-report-file";

const formats = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type AgreementFile = { buffer: Buffer; fileName: string; mimeType: string; extension: string };

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

export async function readAgreementFile(file: File): Promise<AgreementFile | null> {
  const fileName = file.name.split(/[\\/]/).pop()?.replace(/[\x00-\x1f\x7f]/g, "").trim();
  const extension = fileName?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (!fileName || fileName.length > 255 || !extension || !(extension in formats)
    || file.size === 0 || file.size > 10 * 1024 * 1024) return null;
  const mimeType = formats[extension as keyof typeof formats];
  const buffer = Buffer.from(await file.arrayBuffer());
  const valid = extension === "pdf" || extension === "doc" || extension === "docx"
    ? isValidStudentReportFile(buffer, extension.toUpperCase() as "PDF" | "DOC" | "DOCX")
    : mimeType === "image/jpeg" ? buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
      : mimeType === "image/png" ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return valid ? { buffer, fileName, mimeType, extension } : null;
}

export async function uploadAgreementFile(file: AgreementFile) {
  configureCloudinary();
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: "raw",
      type: "authenticated",
      folder: "koru/acuerdos-seguimiento",
      public_id: `${randomUUID()}.${file.extension}`,
    }, (error, result) => {
      if (error || !result?.public_id) reject(error ?? new Error("agreement_upload_failed"));
      else resolve(result.public_id);
    });
    stream.end(file.buffer);
  });
}

export function getAgreementFileUrl(publicId: string, mimeType: string) {
  configureCloudinary();
  const extension = (Object.keys(formats) as (keyof typeof formats)[])
    .find((key) => formats[key] === mimeType && (publicId.toLowerCase().endsWith(`.${key}`)));
  if (!extension) throw new Error("agreement_file_type_invalid");
  return cloudinary.utils.private_download_url(publicId, extension, {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
  });
}

export async function deleteAgreementFile(publicId: string) {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw", type: "authenticated" });
}
