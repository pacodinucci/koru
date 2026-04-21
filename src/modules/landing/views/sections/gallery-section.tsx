"use client";

import { cn } from "@/lib/utils";
import {
  getSectionFieldKey,
  getSectionGalleryAutoplaySecondsKey,
  getSectionGalleryCaptionContainerBackgroundKey,
  getSectionGalleryCaptionContainerOpacityKey,
  getSectionGalleryCaptionContainerPaddingXKey,
  getSectionGalleryCaptionContainerPaddingYKey,
  getSectionGalleryGridImageShapeKey,
  getSectionGalleryItemCaptionModeKey,
  getSectionGalleryItemImageKey,
  getSectionGalleryItemSubtitleKey,
  getSectionGalleryVariantKey,
} from "@/modules/landing/config/landing-sections";
import { getLandingFieldPaddingStyle, type LandingTextMap } from "@/modules/landing/types/landing-text";
import { SectionExtras } from "@/modules/landing/views/components/section-extras";
import { useGallerySlides } from "@/modules/landing/views/hooks/use-gallery-slides";
import type { LandingSectionComponentProps } from "@/modules/landing/views/sections/types";
import {
  getGalleryAutoplaySecondsValue,
  getGalleryCaptionContainerOpacityValue,
  getGalleryCaptionContainerPaddingValue,
  getGalleryCaptionModeValue,
  getGalleryGridImageShapeValue,
  getGalleryVariantValue,
} from "@/modules/landing/views/utils/gallery";
import { getFieldStyle, renderField, selectableClass } from "@/modules/landing/views/utils/field";
import {
  getOrder,
  getSectionBackgroundStyle,
  getSectionOrderMap,
  hasBackgroundImageLayer,
} from "@/modules/landing/views/utils/section-style";
import type { CSSProperties } from "react";

function getCaptionContainerClassName(
  captionContainerOpacity: number,
  basePositionClass: string,
) {
  return cn(
    basePositionClass,
    captionContainerOpacity > 0
      ? "rounded-md text-black/90 backdrop-blur-sm"
      : "text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.7)]",
  );
}

function getCaptionContainerStyle(
  captionContainerOpacity: number,
  captionContainerPaddingX: number,
  captionContainerPaddingY: number,
): CSSProperties {
  return {
    paddingLeft: `${captionContainerPaddingX}px`,
    paddingRight: `${captionContainerPaddingX}px`,
    paddingTop: `${captionContainerPaddingY}px`,
    paddingBottom: `${captionContainerPaddingY}px`,
    ...(captionContainerOpacity > 0
      ? {
          backgroundColor: `rgba(255, 255, 255, ${captionContainerOpacity / 100})`,
        }
      : null),
  };
}

function getGridCardShapeClassName(gridImageShape: string) {
  if (gridImageShape === "square") {
    return "aspect-square";
  }
  if (gridImageShape === "portrait") {
    return "aspect-[3/4]";
  }
  return "aspect-[16/9]";
}

function buildOrderedSlides(
  sectionId: string,
  textMap: LandingTextMap,
  orderedItems: ReturnType<typeof renderField>[],
  itemImages: string[],
) {
  return orderedItems.map((item) => {
    const suffix = item.key.split(".").pop() ?? "";
    const itemNumber = Number.parseInt(suffix.replace("item", ""), 10);
    const image =
      Number.isFinite(itemNumber) &&
      itemNumber >= 1 &&
      itemNumber <= itemImages.length
        ? itemImages[itemNumber - 1]
        : "";
    const captionMode =
      Number.isFinite(itemNumber) && itemNumber >= 1
        ? getGalleryCaptionModeValue(
            textMap[getSectionGalleryItemCaptionModeKey(sectionId, itemNumber)],
          )
        : "title";
    const subtitle =
      Number.isFinite(itemNumber) && itemNumber >= 1
        ? (textMap[getSectionGalleryItemSubtitleKey(sectionId, itemNumber)] ?? "")
        : "";
    return { item, image, captionMode, subtitle };
  });
}

export function GallerySection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingSectionComponentProps) {
  const title = renderField(
    section,
    "title",
    "Galeria de experiencias",
    40,
    textMap,
  );
  const body = renderField(
    section,
    "body",
    "Momentos de aprendizaje",
    18,
    textMap,
  );
  const items = [1, 2, 3, 4].map((index) =>
    renderField(section, `item${index}`, `Item ${index}`, 18, textMap),
  );
  const itemImages = [1, 2, 3, 4].map(
    (index) =>
      textMap[getSectionGalleryItemImageKey(section.id, index)]?.trim() ?? "",
  );
  const orderMap = getSectionOrderMap(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);
  const galleryVariant = getGalleryVariantValue(
    textMap[getSectionGalleryVariantKey(section.id)],
  );
  const autoplaySeconds = getGalleryAutoplaySecondsValue(
    textMap[getSectionGalleryAutoplaySecondsKey(section.id)],
  );
  const captionContainerOpacity = getGalleryCaptionContainerOpacityValue(
    textMap[getSectionGalleryCaptionContainerOpacityKey(section.id)],
    textMap[getSectionGalleryCaptionContainerBackgroundKey(section.id)],
  );
  const captionContainerPaddingX = getGalleryCaptionContainerPaddingValue(
    textMap[getSectionGalleryCaptionContainerPaddingXKey(section.id)],
    12,
  );
  const captionContainerPaddingY = getGalleryCaptionContainerPaddingValue(
    textMap[getSectionGalleryCaptionContainerPaddingYKey(section.id)],
    8,
  );
  const gridImageShape = getGalleryGridImageShapeValue(
    textMap[getSectionGalleryGridImageShapeKey(section.id)],
  );
  const orderedItems = items
    .slice()
    .sort(
      (a, b) =>
        getOrder(
          orderMap,
          `base:${a.key.split(".").pop() ?? ""}`,
          Number.MAX_SAFE_INTEGER,
        ) -
        getOrder(
          orderMap,
          `base:${b.key.split(".").pop() ?? ""}`,
          Number.MAX_SAFE_INTEGER,
        ),
    );
  const orderedSlides = buildOrderedSlides(
    section.id,
    textMap,
    orderedItems,
    itemImages,
  );
  const { normalizedSlideIndex, goToSlide, getRelativeSlideOffset } =
    useGallerySlides(galleryVariant, autoplaySeconds, orderedSlides.length);
  const captionStyle = getCaptionContainerStyle(
    captionContainerOpacity,
    captionContainerPaddingX,
    captionContainerPaddingY,
  );

  return (
    <section
      className="relative isolate flex min-h-screen items-center overflow-hidden"
      style={hasImageLayer ? undefined : sectionBackgroundStyle}
    >
      {hasImageLayer ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={sectionBackgroundStyle}
        />
      ) : null}
      <div
        className="mx-auto flex w-full max-w-[92rem] flex-col px-5 py-20 md:px-8 lg:px-12"
        style={sectionPaddingStyle}
      >
        <h2
          className={cn(
            "leading-tight font-semibold tracking-tight",
            selectableClass(selectedFieldId === title.key, previewMode),
          )}
          onClick={() => onSelectField?.(title.key)}
          style={{
            ...getFieldStyle(title),
            order: getOrder(orderMap, "base:title", 0),
          }}
        >
          {title.value}
        </h2>
        <p
          className={cn(
            "mt-4 text-black/75",
            selectableClass(selectedFieldId === body.key, previewMode),
          )}
          onClick={() => onSelectField?.(body.key)}
          style={{
            ...getFieldStyle(body),
            order: getOrder(orderMap, "base:body", 1),
          }}
        >
          {body.value}
        </p>

        {galleryVariant === "carousel" ? (
          <div
            className="mt-10"
            style={{ order: getOrder(orderMap, "base:items", 2) }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-black/10">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${normalizedSlideIndex * 100}%)`,
                }}
              >
                {orderedSlides.map((slide, index) => (
                  <article
                    key={index}
                    className="relative h-64 min-w-full md:h-[360px]"
                  >
                    {slide.image ? (
                      <div
                        className="h-full w-full bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url("${slide.image}")` }}
                        aria-label={slide.item.value}
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#d9e8d4] via-[#f4efe5] to-[#d8cfb6]" />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                    {slide.captionMode !== "none" ? (
                      <div
                        className={getCaptionContainerClassName(
                          captionContainerOpacity,
                          "absolute bottom-5 left-5",
                        )}
                        style={captionStyle}
                      >
                        <p
                          className={cn(
                            "font-medium",
                            selectableClass(
                              selectedFieldId === slide.item.key,
                              previewMode,
                            ),
                          )}
                          onClick={() => onSelectField?.(slide.item.key)}
                          style={getFieldStyle(slide.item)}
                        >
                          {slide.item.value}
                        </p>
                        {slide.captionMode === "title-subtitle" &&
                        slide.subtitle ? (
                          <p
                            className={cn(
                              "mt-1 text-sm",
                              captionContainerOpacity > 0
                                ? "text-black/70"
                                : "text-white/90",
                            )}
                          >
                            {slide.subtitle}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full border border-black/15 bg-white/95 p-2 text-black shadow-sm transition hover:bg-white"
                onClick={() => goToSlide(normalizedSlideIndex - 1)}
                aria-label="Slide anterior"
              >
                <span className="block h-5 w-5 text-lg leading-5">&lt;</span>
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-black/15 bg-white/95 p-2 text-black shadow-sm transition hover:bg-white"
                onClick={() => goToSlide(normalizedSlideIndex + 1)}
                aria-label="Siguiente slide"
              >
                <span className="block h-5 w-5 text-lg leading-5">&gt;</span>
              </button>
            </div>
          </div>
        ) : galleryVariant === "stacked" ? (
          <div
            className="mt-10"
            style={{ order: getOrder(orderMap, "base:items", 2) }}
          >
            <div className="relative h-[240px] overflow-hidden md:h-[360px]">
              {orderedSlides.map((slide, index) => {
                const offset = getRelativeSlideOffset(index);
                const absOffset = Math.abs(offset);
                const visible = absOffset <= 2;
                const scale =
                  absOffset === 0 ? 1 : absOffset === 1 ? 0.88 : 0.75;
                const opacity = visible
                  ? absOffset === 0
                    ? 1
                    : absOffset === 1
                      ? 0.65
                      : 0.35
                  : 0;

                return (
                  <article
                    key={index}
                    className="absolute top-1/2 left-1/2 h-[210px] w-[72%] overflow-hidden rounded-3xl border border-black/10 shadow-lg transition-all duration-500 ease-out md:h-[320px] md:w-[62%]"
                    style={{
                      transform: `translate(-50%, -50%) translateX(${offset * 220}px) scale(${scale})`,
                      opacity,
                      zIndex: 20 - absOffset,
                      pointerEvents: visible ? "auto" : "none",
                    }}
                  >
                    {slide.image ? (
                      <div
                        className="h-full w-full bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url("${slide.image}")` }}
                        aria-label={slide.item.value}
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#d9e8d4] via-[#f4efe5] to-[#d8cfb6]" />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                    {slide.captionMode !== "none" ? (
                      <div
                        className={getCaptionContainerClassName(
                          captionContainerOpacity,
                          "absolute bottom-4 left-4",
                        )}
                        style={captionStyle}
                      >
                        <p
                          className={cn(
                            "font-medium",
                            selectableClass(
                              selectedFieldId === slide.item.key,
                              previewMode,
                            ),
                          )}
                          onClick={() => onSelectField?.(slide.item.key)}
                          style={getFieldStyle(slide.item)}
                        >
                          {slide.item.value}
                        </p>
                        {slide.captionMode === "title-subtitle" &&
                        slide.subtitle ? (
                          <p
                            className={cn(
                              "mt-1 text-sm",
                              captionContainerOpacity > 0
                                ? "text-black/70"
                                : "text-white/90",
                            )}
                          >
                            {slide.subtitle}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-3 text-black/60">
              <button
                type="button"
                className="rounded-full p-1.5 transition hover:bg-black/5 hover:text-black"
                onClick={() => goToSlide(normalizedSlideIndex - 1)}
                aria-label="Slide anterior"
              >
                &lt;
              </button>
              <div className="flex items-center gap-1.5">
                {orderedSlides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition",
                      index === normalizedSlideIndex
                        ? "bg-[#6d6af8]"
                        : "bg-black/20 hover:bg-black/35",
                    )}
                    onClick={() => goToSlide(index)}
                    aria-label={`Ir al slide ${index + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 transition hover:bg-black/5 hover:text-black"
                onClick={() => goToSlide(normalizedSlideIndex + 1)}
                aria-label="Siguiente slide"
              >
                &gt;
              </button>
            </div>
          </div>
        ) : galleryVariant === "editorial" ? (
          <div
            className="mt-10 rounded-3xl bg-[#f0f0f2] p-5 md:p-8"
            style={{ order: getOrder(orderMap, "base:items", 2) }}
          >
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin] md:gap-4">
              {orderedSlides.map((slide, index) => (
                <article
                  key={index}
                  className="group relative h-[340px] min-w-[210px] overflow-hidden rounded-2xl border border-black/10 md:h-[430px] md:min-w-[280px]"
                >
                  {slide.image ? (
                    <div
                      className="h-full w-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url("${slide.image}")` }}
                      aria-label={slide.item.value}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#d9e8d4] via-[#f4efe5] to-[#d8cfb6]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  {slide.captionMode !== "none" ? (
                    <div
                      className={getCaptionContainerClassName(
                        captionContainerOpacity,
                        "absolute top-3 left-3 right-3",
                      )}
                      style={captionStyle}
                    >
                      <p
                        className={cn(
                          "font-medium",
                          selectableClass(
                            selectedFieldId === slide.item.key,
                            previewMode,
                          ),
                        )}
                        onClick={() => onSelectField?.(slide.item.key)}
                        style={getFieldStyle(slide.item)}
                      >
                        {slide.item.value}
                      </p>
                      {slide.captionMode === "title-subtitle" &&
                      slide.subtitle ? (
                        <p
                          className={cn(
                            "mt-1 text-sm",
                            captionContainerOpacity > 0
                              ? "text-black/70"
                              : "text-white/90",
                          )}
                        >
                          {slide.subtitle}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="mt-10 grid gap-4 md:grid-cols-2"
            style={{ order: getOrder(orderMap, "base:items", 2) }}
          >
            {orderedSlides.map((slide, index) => (
              <article
                key={index}
                className={cn(
                  "relative flex items-end overflow-hidden rounded-3xl border border-black/10 p-5",
                  getGridCardShapeClassName(gridImageShape),
                )}
              >
                {slide.image ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${slide.image}")` }}
                    aria-label={slide.item.value}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d9e8d4] via-[#f4efe5] to-[#d8cfb6]" />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />
                {slide.captionMode !== "none" ? (
                  <div
                    className={cn(
                      "relative z-10",
                      getCaptionContainerClassName(captionContainerOpacity, ""),
                    )}
                    style={captionStyle}
                  >
                    <p
                      className={cn(
                        "font-medium",
                        selectableClass(
                          selectedFieldId === slide.item.key,
                          previewMode,
                        ),
                      )}
                      onClick={() => onSelectField?.(slide.item.key)}
                      style={getFieldStyle(slide.item)}
                    >
                      {slide.item.value}
                    </p>
                    {slide.captionMode === "title-subtitle" &&
                    slide.subtitle ? (
                      <p
                        className={cn(
                          "mt-1 text-sm",
                          captionContainerOpacity > 0
                            ? "text-black/70"
                            : "text-white/90",
                        )}
                      >
                        {slide.subtitle}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
        <SectionExtras
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          orderMap={orderMap}
        />
      </div>
    </section>
  );
}
