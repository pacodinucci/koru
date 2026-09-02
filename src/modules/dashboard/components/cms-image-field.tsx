"use client";

import { Images, Loader2, Move, RotateCcw, Upload } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CmsImageSlot } from "@/modules/cms/content-page-config";
import type { CmsImageValue } from "@/modules/cms/server/cms-image.repository";
import { optimizeImageForUpload } from "@/modules/media/client/optimize-image";

type LibraryImage = Pick<CmsImageValue, "url" | "publicId"> & {
  width: number | null;
  height: number | null;
  createdAt: string | null;
};

type LibraryResponse = {
  ok?: boolean;
  images?: LibraryImage[];
  nextCursor?: string | null;
  error?: string;
  cloudinaryDiagnostic?: {
    cloudName?: string;
    apiKeyConfigured: boolean;
    apiSecretConfigured: boolean;
  };
};

export function CmsImageField({
  slot,
  value,
  isAdjusting,
  onAdjustingChange,
  onChange,
}: {
  slot: CmsImageSlot;
  value?: CmsImageValue;
  isAdjusting: boolean;
  onAdjustingChange: (adjusting: boolean) => void;
  onChange: (value: CmsImageValue) => Promise<void>;
}) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setIsUploading(true);
    setError("");

    try {
      const optimized = await optimizeImageForUpload(file);
      const formData = new FormData();
      formData.set("file", optimized);
      formData.set("purpose", "CMS");

      const response = await fetch("/api/uploads/images", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        url?: string;
        publicId?: string;
        error?: string;
      };

      if (!response.ok || !payload.url || !payload.publicId) {
        throw new Error(payload.error ?? "No pudimos cargar la imagen.");
      }

      onAdjustingChange(false);
      await onChange({
        url: payload.url,
        publicId: payload.publicId,
        cropX: 50,
        cropY: 50,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos preparar la imagen.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function loadLibrary(cursor?: string) {
    setIsLoadingLibrary(true);
    setError("");

    try {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const response = await fetch(`/api/dashboard/media/images${query}`);
      const payload = (await response.json()) as LibraryResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error ?? "No pudimos cargar la biblioteca de imágenes.",
        );
      }

      console.log(
        "[cloudinary] CLOUDINARY_CLOUD_NAME:",
        payload.cloudinaryDiagnostic?.cloudName,
      );
      console.log(
        "[cloudinary] CLOUDINARY_API_KEY configured:",
        payload.cloudinaryDiagnostic?.apiKeyConfigured,
      );
      console.log(
        "[cloudinary] CLOUDINARY_API_SECRET configured:",
        payload.cloudinaryDiagnostic?.apiSecretConfigured,
      );

      setLibrary((previous) =>
        cursor
          ? [...previous, ...(payload.images ?? [])]
          : (payload.images ?? []),
      );
      setNextCursor(payload.nextCursor ?? null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos cargar la biblioteca de imágenes.",
      );
    } finally {
      setIsLoadingLibrary(false);
    }
  }

  async function openLibrary() {
    setShowLibrary(true);
    if (!library.length) {
      await loadLibrary();
    }
  }

  async function selectLibraryImage(image: LibraryImage) {
    onAdjustingChange(false);
    await onChange({ ...image, cropX: 50, cropY: 50 });
  }

  async function centerImage() {
    if (!value) {
      return;
    }
    await onChange({ ...value, cropX: 50, cropY: 50 });
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="border-b px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Imagen seleccionada
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-900">
          {slot.label}
        </h2>
      </div>

      <div className="space-y-4 p-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-slate-100">
          <Image
            src={value?.url || slot.defaultSrc}
            alt={slot.alt}
            fill
            className="object-cover"
            style={{
              objectPosition: `${value?.cropX ?? 50}% ${value?.cropY ?? 50}%`,
            }}
            sizes="360px"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={isAdjusting ? "default" : "outline"}
            disabled={!value}
            onClick={() => onAdjustingChange(!isAdjusting)}
          >
            <Move className="mr-2 h-4 w-4" />
            {isAdjusting ? "Finalizar" : "Ajustar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!value}
            onClick={() => void centerImage()}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Centrar
          </Button>
        </div>

        {isAdjusting ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
            Arrastrá la imagen directamente en la vista previa. La posición se
            guarda al soltar.
          </p>
        ) : !value ? (
          <p className="text-xs leading-relaxed text-slate-500">
            Subí o elegí una imagen para poder ajustar su encuadre.
          </p>
        ) : null}

        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              void upload(file);
            }
          }}
        />

        <div className="grid gap-2">
          <label
            htmlFor={inputId}
            aria-disabled={isUploading}
            className={cn(
              buttonVariants(),
              "cursor-pointer",
              isUploading && "pointer-events-none opacity-50",
            )}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Optimizando y subiendo..." : "Subir nueva imagen"}
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => void openLibrary()}
          >
            <Images className="mr-2 h-4 w-4" />
            Elegir de Cloudinary
          </Button>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Las imágenes nuevas se convierten a WebP, se ajustan a un máximo de
          2400 px y se comprimen antes de subir.
        </p>

        {error ? <p className="text-xs text-rose-700">{error}</p> : null}

        {showLibrary ? (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Biblioteca
              </p>
              <button
                type="button"
                className="text-xs text-slate-500 underline"
                onClick={() => setShowLibrary(false)}
              >
                Cerrar
              </button>
            </div>

            {isLoadingLibrary && !library.length ? (
              <div className="flex items-center gap-2 py-6 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando imágenes...
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              {library.map((image) => (
                <button
                  key={image.publicId}
                  type="button"
                  className="relative aspect-square overflow-hidden rounded-lg border bg-slate-100 transition hover:ring-2 hover:ring-emerald-500"
                  onClick={() => void selectLibraryImage(image)}
                  title={image.publicId}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </button>
              ))}
            </div>

            {nextCursor ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoadingLibrary}
                onClick={() => void loadLibrary(nextCursor)}
              >
                {isLoadingLibrary ? "Cargando..." : "Cargar más"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
