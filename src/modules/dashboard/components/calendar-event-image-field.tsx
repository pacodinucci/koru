"use client";

import { useId, useState } from "react";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

async function optimizeImage(file: File) {
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();

  for (const quality of [0.84, 0.72, 0.6, 0.5]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
    }
  }
  throw new Error("No pudimos optimizar la imagen por debajo de 10 MB.");
}
export function CalendarEventImageField({ defaultValue = "" }: { defaultValue?: string | null }) {
  const inputId = useId();
  const [imageUrl, setImageUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setIsUploading(true);
    setError("");
    let optimized: File;
    try {
      optimized = await optimizeImage(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos optimizar la imagen.");
      setIsUploading(false);
      return;
    }
    const formData = new FormData();
    formData.set("file", optimized);
    const response = await fetch("/api/uploads/blog", { method: "POST", body: formData });
    const payload = (await response.json()) as { ok?: boolean; url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setError(payload.error ?? "No pudimos cargar la imagen.");
      setIsUploading(false);
      return;
    }
    setImageUrl(payload.url);
    setIsUploading(false);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="imageUrl" value={imageUrl} />
      {imageUrl ? <img src={imageUrl} alt="" className="h-32 w-full rounded-lg object-cover" /> : null}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        disabled={isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className="inline-flex w-fit cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {isUploading ? "Cargando imagen..." : "Seleccionar imagen"}
      </label>
      <p className="text-xs text-slate-500">{isUploading ? "Cargando imagen..." : "Seleccioná una imagen de portada."}</p>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
