import { invoiceFileError } from "@/modules/operations/components/inventory-invoice-review";

export const INVOICE_FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.csv";
const MAX_UPLOAD = 4 * 1024 * 1024;
const MAX_RAW_PHOTO = 20 * 1024 * 1024;

export function canvasJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob?.type === "image/jpeg") resolve(blob);
    else reject(new Error("No se pudo preparar la foto. Elegí una imagen JPEG o PNG."));
  }, "image/jpeg", quality));
}

/** Reencode photos before the final upload guard, including native HEIC only if decodable. */
export async function prepareInvoiceFile(file: File): Promise<File> {
  const photo = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type.toLowerCase())
    || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
  if (!photo) {
    const error = invoiceFileError(file);
    if (error) throw new Error(error);
    return file;
  }
  if (!file.size || file.size > MAX_RAW_PHOTO) throw new Error("La foto original debe tener contenido y pesar como máximo 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("El navegador no puede leer esta foto (HEIC requiere compatibilidad). Usá la cámara o elegí JPEG o PNG."));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("La foto no tiene dimensiones válidas. Elegí JPEG o PNG.");
    const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la foto. Elegí JPEG o PNG.");
    // White background keeps transparent scans readable when converted to JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.92, 0.8, 0.65, 0.5, 0.35]) {
      const blob = await canvasJpeg(canvas, quality);
      if (blob.size > 0 && blob.size <= MAX_UPLOAD) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, { type: "image/jpeg" });
      }
    }
    throw new Error("No se pudo reducir la foto a 4 MB conservando su lectura. Tomá una foto más cercana de los artículos o elegí otro archivo.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
