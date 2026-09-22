"use client";

import { useRef } from "react";

import { CmsPageEditableImage } from "@/modules/cms/components/cms-page-editable-image";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";
import { getLandingContentSlotValue } from "@/modules/landing/content-slots";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";
import {
  facilityCaptionSlotId,
  getQuienesSomosContentSlots,
} from "@/modules/quienes-somos/content-slots";

type FacilityImage = {
  src: string;
  alt: string;
  objectPosition?: string;
};

type FacilitiesCarouselProps = {
  images: FacilityImage[];
  textMap: LandingTextMap;
  imageMap?: CmsImageMap;
  previewMode?: boolean;
  selectedContentSlotId?: string | null;
  onSelectContentSlot?: (slotId: string) => void;
};

const captionSlots = new Map(
  getQuienesSomosContentSlots().map((slot) => [slot.id, slot]),
);

export function FacilitiesCarousel({
  images,
  textMap,
  imageMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: FacilitiesCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "previous" | "next") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction === "next" ? scroller.clientWidth * 0.82 : scroller.clientWidth * -0.82,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[7vw] pb-5 md:gap-7 md:px-[10vw] [&::-webkit-scrollbar]:hidden"
        aria-label="Carrusel de instalaciones"
      >
        {images.map((image, index) => {
          const imageSlotId = `about.image.facility.${index}`;
          const captionSlotId = facilityCaptionSlotId(index);
          const captionSlot = captionSlots.get(captionSlotId);
          const imageSrc = imageMap?.[imageSlotId]?.url || image.src;
          if (!imageSrc && !previewMode) return null;
          if (!captionSlot) return null;
          const caption = getLandingContentSlotValue(textMap, captionSlot);

          return (
            <figure
              key={imageSlotId}
              className="min-w-[84vw] snap-center md:min-w-[70vw] lg:min-w-[66vw]"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                {imageSrc ? (
                  <CmsPageEditableImage
                    slotId={imageSlotId}
                    defaultSrc={image.src}
                    alt={image.alt}
                    imageMap={imageMap}
                    previewMode={previewMode}
                    selectedContentSlotId={selectedContentSlotId}
                    onSelectContentSlot={onSelectContentSlot}
                    fill
                    sizes="(min-width: 1024px) 66vw, (min-width: 768px) 70vw, 84vw"
                    className="object-cover"
                    style={{ objectPosition: image.objectPosition }}
                  />
                ) : (
                  <button
                    type="button"
                    data-content-slot-id={imageSlotId}
                    onClick={() => onSelectContentSlot?.(imageSlotId)}
                    className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-emerald-500"
                    aria-label={`Editar imagen de Instalaciones ${index + 1}`}
                  >
                    Cargar imagen {index + 1}
                  </button>
                )}
              </div>
              {caption || previewMode ? (
                <figcaption className="mt-4 text-xs font-semibold text-black/55 md:text-sm">
                  <EditableContentSlot
                    as="span"
                    slot={captionSlot}
                    textMap={textMap}
                    previewMode={previewMode}
                    selected={selectedContentSlotId === captionSlotId}
                    onSelect={onSelectContentSlot}
                    renderInsertedBlocks={false}
                  >
                    {caption || "Agregar texto debajo de la imagen"}
                  </EditableContentSlot>
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>

      <div className="mx-auto flex w-full max-w-7xl justify-center gap-5 px-6 md:justify-end md:px-10 lg:px-14">
        <button
          type="button"
          onClick={() => scroll("previous")}
          className="text-3xl font-bold leading-none text-black transition hover:text-[#caa27d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          aria-label="Ver instalación anterior"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scroll("next")}
          className="text-3xl font-bold leading-none text-black transition hover:text-[#caa27d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          aria-label="Ver siguiente instalación"
        >
          →
        </button>
      </div>
    </div>
  );
}
