import { IMAGE_UPLOAD_MAX_DIMENSION, IMAGE_UPLOAD_MAX_SIZE_BYTES } from "@/modules/media/config/image-upload";

export async function optimizeImageForUpload(file: File) {
  const source = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_UPLOAD_MAX_DIMENSION / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext("2d");
  if (!context) { source.close(); throw new Error("No pudimos preparar la imagen."); }
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  for (const quality of [0.84, 0.72, 0.6, 0.5]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (blob && blob.size <= IMAGE_UPLOAD_MAX_SIZE_BYTES) {
      return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "imagen"}.webp`, { type: "image/webp" });
    }
  }
  throw new Error("No pudimos optimizar la imagen por debajo de 10 MB.");
}