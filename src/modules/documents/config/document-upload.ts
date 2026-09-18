export const DOCUMENT_PDF_MAX_SIZE_MB = 20;
export const DOCUMENT_VIDEO_MAX_SIZE_MB = 150;
export const DOCUMENT_UPLOAD_ACCEPTED_TYPES = [
  "application/pdf",
  "video/mp4",
] as const;

export type DocumentUploadType = (typeof DOCUMENT_UPLOAD_ACCEPTED_TYPES)[number];

export function getDocumentUploadMaxSizeBytes(type: DocumentUploadType) {
  const maxSizeMb = type === "video/mp4"
    ? DOCUMENT_VIDEO_MAX_SIZE_MB
    : DOCUMENT_PDF_MAX_SIZE_MB;

  return maxSizeMb * 1024 * 1024;
}

export function getDocumentUploadMaxSizeMb(type: DocumentUploadType) {
  return type === "video/mp4"
    ? DOCUMENT_VIDEO_MAX_SIZE_MB
    : DOCUMENT_PDF_MAX_SIZE_MB;
}
