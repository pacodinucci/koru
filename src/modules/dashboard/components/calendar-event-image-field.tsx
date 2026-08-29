"use client";

import { useId, useState } from "react";

import { optimizeImageForUpload } from "@/modules/media/client/optimize-image";

export function CalendarEventImageField({ defaultValue = "" }: { defaultValue?: string | null }) {
  const inputId = useId();
  const [imageUrl, setImageUrl] = useState(defaultValue ?? "");
  const [imagePublicId, setImagePublicId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setIsUploading(true);
    setError("");
    let optimized: File;
    try {
      optimized = await optimizeImageForUpload(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos optimizar la imagen.");
      setIsUploading(false);
      return;
    }
    const formData = new FormData();
    formData.set("file", optimized);
    formData.set("purpose", "CALENDAR");
    const response = await fetch("/api/uploads/images", { method: "POST", body: formData });
    const payload = (await response.json()) as { ok?: boolean; url?: string; publicId?: string; error?: string };
    if (!response.ok || !payload.url) {
      setError(payload.error ?? "No pudimos cargar la imagen.");
      setIsUploading(false);
      return;
    }
    setImageUrl(payload.url);
    setImagePublicId(payload.publicId ?? "");
    setIsUploading(false);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="imagePublicId" value={imagePublicId} />
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
