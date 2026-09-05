"use client";

import { CircleDashed, Images, Loader2, Move, RotateCcw, RotateCw, SquareDashed, Upload, ZoomIn, ZoomOut } from "lucide-react";
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

const frameShapes = [
  { id: "RECTANGLE_HORIZONTAL", label: "Rectángulo horizontal", previewClassName: "aspect-[4/3] rounded-none" },
  { id: "RECTANGLE_VERTICAL", label: "Rectángulo vertical", previewClassName: "aspect-[4/5] rounded-none" },
  { id: "SQUARE", label: "Cuadrado", previewClassName: "aspect-square rounded-none" },
  { id: "OVAL", label: "Ovalado", previewClassName: "aspect-[4/5] rounded-[50%]" },
  { id: "CIRCLE", label: "Circular", previewClassName: "aspect-square rounded-full" },
  { id: "IRREGULAR", label: "Forma orgánica de Koru", previewClassName: "aspect-[4/5] rounded-[44%_56%_47%_53%/53%_45%_55%_47%]" },
] as const;

function getFrameShapePreviewStyle(shape: CmsImageValue["frameShape"] | undefined) {
  if (shape === "RECTANGLE_HORIZONTAL") return { aspectRatio: "4 / 3", borderRadius: 0 };
  if (shape === "RECTANGLE_VERTICAL") return { aspectRatio: "4 / 5", borderRadius: 0 };
  if (shape === "SQUARE") return { aspectRatio: "1 / 1", borderRadius: 0 };
  if (shape === "OVAL") return { aspectRatio: "4 / 5", borderRadius: "50%" };
  if (shape === "CIRCLE") return { aspectRatio: "1 / 1", borderRadius: "50%" };
  if (shape === "IRREGULAR") return { aspectRatio: "4 / 5", borderRadius: "44% 56% 47% 53% / 53% 45% 55% 47%" };
  return undefined;
}

export function CmsImageField({
  slot,
  value,
  isAdjusting,
  onAdjustingChange,
  onChange,
  onCommit,
}: {
  slot: CmsImageSlot;
  value?: CmsImageValue;
  isAdjusting: boolean;
  onAdjustingChange: (adjusting: boolean) => void;
  onChange: (value: CmsImageValue) => void;
  onCommit: (value: CmsImageValue) => Promise<void>;
}) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function commitImage(value: CmsImageValue) {
    onChange(value);
    await onCommit(value);
  }

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
      await commitImage({
        url: payload.url,
        publicId: payload.publicId,
        cropX: 50,
        cropY: 50,
        zoom: 1,
        fitMode: "COVER",
        frameSize: "NORMAL",
        frameShape: "RECTANGULAR",
        frameScale: 1,
        rotation: 0,
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
    await commitImage({ ...image, cropX: 50, cropY: 50, zoom: 1, fitMode: "COVER", frameSize: "NORMAL", frameShape: "RECTANGULAR", frameScale: 1, rotation: 0 });
  }

  async function centerImage() {
    if (!value) {
      return;
    }
    await commitImage({ ...value, cropX: 50, cropY: 50, zoom: 1, fitMode: "COVER", frameSize: "NORMAL" });
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
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-slate-100" style={getFrameShapePreviewStyle(value?.frameShape)}>
          {value?.url || slot.defaultSrc ? (
            <Image
              src={value?.url || slot.defaultSrc}
              alt={slot.alt}
              fill
              className={value?.fitMode === "CONTAIN" ? "object-contain" : "object-cover"}
              style={{
                objectPosition: `${value?.cropX ?? 50}% ${value?.cropY ?? 50}%`,
                transform: `scale(${value?.zoom ?? 1})`,
              }}
              sizes="360px"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
              Todavía no hay una imagen cargada.
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600"><span>Zoom</span><span>{(value?.zoom ?? 1).toFixed(1)}×</span></div>
          <div className="flex items-center gap-2"><ZoomOut className="h-4 w-4 text-slate-500" /><input type="range" min="1" max="3" step="0.1" value={value?.zoom ?? 1} disabled={!value} onChange={(event) => value && onChange({ ...value, zoom: Number(event.target.value) })} onPointerUp={(event) => value && void onCommit({ ...value, zoom: Number(event.currentTarget.value) })} onBlur={(event) => value && void onCommit({ ...value, zoom: Number(event.currentTarget.value) })} className="w-full" /><ZoomIn className="h-4 w-4 text-slate-500" /></div>          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Forma del contenedor de imagen"
          >
            {frameShapes.map((shape) => {
              const selected = (value?.frameShape ?? "RECTANGULAR") === shape.id;

              return (
                <button
                  key={shape.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={shape.label}
                  title={shape.label}
                  disabled={!value}
                  onClick={() => value && void commitImage({ ...value, frameShape: shape.id })}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl p-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-45",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block w-6 bg-current/55",
                      shape.previewClassName,
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Bordes</p>
            <div className="flex gap-2">
              <Button type="button" size="icon" variant="ghost" aria-label="Bordes redondeados" title="Bordes redondeados" className={cn("size-10 rounded-xl", value?.frameRounded === true ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-slate-50 text-slate-600 hover:bg-slate-100")} disabled={!value} onClick={() => value && void commitImage({ ...value, frameRounded: true })}><CircleDashed className="size-5" /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Bordes rectos" title="Bordes rectos" className={cn("size-10 rounded-xl", value?.frameRounded === false ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-slate-50 text-slate-600 hover:bg-slate-100")} disabled={!value} onClick={() => value && void commitImage({ ...value, frameRounded: false })}><SquareDashed className="size-5" /></Button>
            </div>
          </div>

        <div className="grid grid-cols-2 gap-2"><Button type="button" size="sm" variant={(value?.fitMode ?? "COVER") === "COVER" ? "default" : "outline"} disabled={!value} onClick={() => value && void commitImage({ ...value, fitMode: "COVER" })}>Recortar</Button><Button type="button" size="sm" variant={value?.fitMode === "CONTAIN" ? "default" : "outline"} disabled={!value} onClick={() => value && void commitImage({ ...value, fitMode: "CONTAIN", zoom: 1 })}>Completa</Button></div>
          <div className="space-y-1"><div className="flex justify-between text-xs font-semibold text-slate-600"><span>Tamaño</span><span>{slot.frameLocked ? "Fijo en esta grilla" : "100%"}</span></div><input type="range" min="0.5" max="2.5" step="0.05" value={value?.frameScale ?? 1} disabled={!value || slot.frameLocked} onChange={(event) => value && onChange({ ...value, frameScale: Number(event.target.value) })} onPointerUp={(event) => value && void commitImage({ ...value, frameScale: Number(event.currentTarget.value) })} onBlur={(event) => value && void commitImage({ ...value, frameScale: Number(event.currentTarget.value) })} className="w-full" /></div><Button type="button" size="sm" variant="outline" className="w-full" disabled={!value} onClick={() => value && void commitImage({ ...value, rotation: ((value.rotation ?? 0) + 90) % 360 })}><RotateCw className="mr-2 h-4 w-4" />Girar 90°</Button>
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
            Elegir de Koru
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
