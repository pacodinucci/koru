import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";

const RECEIPT_LINK_TTL_SECONDS = 7 * 24 * 60 * 60;

function configureCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("cloudinary_receipts_not_configured");
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function createReceiptDownloadUrl(publicId: string, expiresAt = new Date(Date.now() + RECEIPT_LINK_TTL_SECONDS * 1000)) {
  configureCloudinary();

  return cloudinary.utils.private_download_url(publicId, "pdf", {
    resource_type: "raw",
    type: "private",
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    attachment: true,
  });
}