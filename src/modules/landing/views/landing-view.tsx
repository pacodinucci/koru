"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LandingNav } from "@/modules/landing/components/landing-nav";
import {
  getSectionGalleryAutoplaySecondsKey,
  getSectionGalleryItemImageKey,
  getSectionBackgroundColorKey,
  getSectionBackgroundGradientKey,
  ensureLandingDefaults,
  getSectionGalleryVariantKey,
  getSectionBackgroundImageKey,
  getSectionBackgroundPositionXKey,
  getSectionBackgroundPositionYKey,
  getSectionBackgroundModeKey,
  getSectionBackgroundZoomKey,
  getSectionFieldKey,
  getSectionExtraTextKey,
  parseSectionItemsOrder,
  parseSectionExtraElements,
  type SectionExtraElementType,
  parseLandingStructure,
  type LandingSectionInstance,
} from "@/modules/landing/config/landing-sections";
import {
  getLandingFieldColor,
  getLandingFieldFontSize,
  getLandingFieldMarginStyle,
  getLandingFieldPaddingStyle,
  type LandingPreviewBindings,
  type LandingTextMap,
} from "@/modules/landing/types/landing-text";

type LandingViewProps = {
  textMap: LandingTextMap;
  previewViewportHeight?: number;
} & LandingPreviewBindings;

function selectableClass(active: boolean, previewMode?: boolean) {
  return cn(
    previewMode && "cursor-pointer rounded-sm transition",
    active &&
      "outline-2 outline outline-[#22c55e] shadow-[0_0_0_4px_rgba(34,197,94,0.22)]",
  );
}

function textKey(sectionId: string, fieldKey: string) {
  return getSectionFieldKey(sectionId, fieldKey);
}

function renderField(
  section: LandingSectionInstance,
  fieldKey: string,
  fallback: string,
  fallbackSize: number,
  textMap: LandingTextMap,
) {
  const key = textKey(section.id, fieldKey);
  return {
    key,
    value: textMap[key] ?? fallback,
    fontSize: getLandingFieldFontSize(textMap, key, fallbackSize),
    color: getLandingFieldColor(textMap, key),
    marginStyle: getLandingFieldMarginStyle(textMap, key),
    paddingStyle: getLandingFieldPaddingStyle(textMap, key),
  };
}

function getFieldStyle(field: {
  fontSize: number;
  color: string | null;
  marginStyle: ReturnType<typeof getLandingFieldMarginStyle>;
  paddingStyle: ReturnType<typeof getLandingFieldPaddingStyle>;
}): CSSProperties {
  return {
    fontSize: `${field.fontSize}px`,
    ...field.marginStyle,
    ...field.paddingStyle,
    ...(field.color ? { color: field.color } : null),
  };
}

function getExtraDefault(type: SectionExtraElementType) {
  switch (type) {
    case "title":
      return { text: "Nuevo titulo", size: 34 };
    case "button":
      return { text: "Nuevo boton", size: 14 };
    case "text":
    default:
      return { text: "Nuevo texto", size: 18 };
  }
}

function getSectionOrderMap(textMap: LandingTextMap, sectionId: string) {
  return new Map(
    parseSectionItemsOrder(textMap, sectionId).map((id, index) => [id, index]),
  );
}

function getOrder(
  orderMap: Map<string, number>,
  itemId: string,
  fallback: number,
) {
  return orderMap.get(itemId) ?? fallback;
}

function getSectionBackgroundStyle(
  textMap: LandingTextMap,
  sectionId: string,
): CSSProperties {
  const mode = textMap[getSectionBackgroundModeKey(sectionId)]?.trim();
  if (!mode) {
    return {};
  }

  if (mode === "image") {
    const image = textMap[getSectionBackgroundImageKey(sectionId)]?.trim();
    if (!image) {
      return {};
    }

    const rawZoom = Number.parseFloat(
      textMap[getSectionBackgroundZoomKey(sectionId)] ?? "",
    );
    const zoom = Number.isFinite(rawZoom)
      ? Math.min(3, Math.max(1, rawZoom))
      : 1;
    const rawPositionX = Number.parseFloat(
      textMap[getSectionBackgroundPositionXKey(sectionId)] ?? "",
    );
    const positionX = Number.isFinite(rawPositionX)
      ? Math.min(100, Math.max(0, rawPositionX))
      : 50;
    const rawPositionY = Number.parseFloat(
      textMap[getSectionBackgroundPositionYKey(sectionId)] ?? "",
    );
    const positionY = Number.isFinite(rawPositionY)
      ? Math.min(100, Math.max(0, rawPositionY))
      : 50;

    return {
      backgroundImage: `url("${image}")`,
      backgroundSize: "cover",
      backgroundPosition: `${positionX}% ${positionY}%`,
      backgroundRepeat: "no-repeat",
      transform: zoom === 1 ? undefined : `scale(${zoom})`,
      transformOrigin: `${positionX}% ${positionY}%`,
    };
  }

  if (mode === "color") {
    const color = textMap[getSectionBackgroundColorKey(sectionId)]?.trim();
    if (!color) {
      return {};
    }

    return {
      backgroundColor: color,
    };
  }

  if (mode === "gradient") {
    const gradient = textMap[getSectionBackgroundGradientKey(sectionId)]?.trim();
    if (!gradient) {
      return {};
    }

    return {
      backgroundImage: gradient,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  // Unknown or "default" mode
  return {};
}

function hasBackgroundImageLayer(style: CSSProperties) {
  return typeof style.backgroundImage === "string" && style.backgroundImage.length > 0;
}

function getGalleryVariantValue(raw: string | undefined) {
  if (raw === "carousel" || raw === "stacked") {
    return raw;
  }
  return "grid";
}

function getGalleryAutoplaySecondsValue(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.min(10, Math.max(0, parsed));
}

function SectionExtras({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  orderMap,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
  orderMap?: Map<string, number>;
} & LandingPreviewBindings) {
  const extras = parseSectionExtraElements(textMap, section.id);

  if (extras.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      {extras
        .slice()
        .sort(
          (a, b) =>
            getOrder(orderMap ?? new Map(), `extra:${a.id}`, Number.MAX_SAFE_INTEGER) -
            getOrder(orderMap ?? new Map(), `extra:${b.id}`, Number.MAX_SAFE_INTEGER),
        )
        .map((extra) => {
        const key = getSectionExtraTextKey(section.id, extra.id);
        const defaults = getExtraDefault(extra.type);
        const order = getOrder(orderMap ?? new Map(), `extra:${extra.id}`, 999);
        const field = {
          key,
          value: textMap[key] ?? defaults.text,
          fontSize: getLandingFieldFontSize(textMap, key, defaults.size),
          color: getLandingFieldColor(textMap, key),
          marginStyle: getLandingFieldMarginStyle(textMap, key),
          paddingStyle: getLandingFieldPaddingStyle(textMap, key),
        };

        if (extra.type === "title") {
          return (
            <h3
              key={extra.id}
              className={cn(
                "font-semibold tracking-tight",
                selectableClass(selectedFieldId === field.key, previewMode),
              )}
              onClick={() => onSelectField?.(field.key)}
              style={{ ...getFieldStyle(field), order }}
            >
              {field.value}
            </h3>
          );
        }

        if (extra.type === "button") {
          return (
            <a
              key={extra.id}
              href="#"
              className="inline-flex h-10 items-center rounded-full border border-black/20 bg-white/70 px-5 transition hover:bg-white"
              style={{ order }}
              onClick={(event) => {
                if (previewMode) {
                  event.preventDefault();
                  onSelectField?.(field.key);
                }
              }}
            >
              <span
                className={selectableClass(
                  selectedFieldId === field.key,
                  previewMode,
                )}
                style={getFieldStyle(field)}
              >
                {field.value}
              </span>
            </a>
          );
        }

        return (
          <p
            key={extra.id}
            className={cn(
              "leading-7 text-black/75",
              selectableClass(selectedFieldId === field.key, previewMode),
            )}
            onClick={() => onSelectField?.(field.key)}
            style={{ ...getFieldStyle(field), order }}
          >
            {field.value}
          </p>
        );
      })}
    </div>
  );
}

function HeroSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const kicker = renderField(
    section,
    "kicker",
    "BIENVENID@S A KORU OSA",
    12,
    textMap,
  );
  const title = renderField(
    section,
    "title",
    "En Koru, entendemos la educacion como un organismo vivo.",
    56,
    textMap,
  );
  const body = renderField(
    section,
    "body",
    "Nuestro cuerpo escolar no es un molde rigido, sino una forma cambiante.",
    20,
    textMap,
  );
  const cta = renderField(section, "cta", "Make a donation", 14, textMap);
  const orderMap = getSectionOrderMap(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);

  return (
    <section
      className="relative isolate flex min-h-screen items-center overflow-hidden border-b border-black/10 bg-[#f4efe5]"
      style={hasImageLayer ? undefined : sectionBackgroundStyle}
    >
      {hasImageLayer ? (
        <div aria-hidden className="absolute inset-0 -z-10" style={sectionBackgroundStyle} />
      ) : null}
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#d5e8d4]/60 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-[#c8d8f0]/70 blur-3xl" />
      <div
        className="relative mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12"
        style={sectionPaddingStyle}
      >
        <div className="flex flex-col items-start">
          <p
            className={selectableClass(
              selectedFieldId === kicker.key,
              previewMode,
            )}
            onClick={() => onSelectField?.(kicker.key)}
            style={{
              ...getFieldStyle(kicker),
              order: getOrder(orderMap, "base:kicker", 0),
            }}
          >
            {kicker.value}
          </p>
          <h1
            className={cn(
              "mt-4 max-w-3xl leading-tight font-semibold tracking-tight text-black",
              selectableClass(selectedFieldId === title.key, previewMode),
            )}
            onClick={() => onSelectField?.(title.key)}
            style={{
              ...getFieldStyle(title),
              order: getOrder(orderMap, "base:title", 1),
            }}
          >
            {title.value}
          </h1>
          <p
            className={cn(
              "mt-6 max-w-2xl leading-7 text-black/70",
              selectableClass(selectedFieldId === body.key, previewMode),
            )}
            onClick={() => onSelectField?.(body.key)}
            style={{
              ...getFieldStyle(body),
              order: getOrder(orderMap, "base:body", 2),
            }}
          >
            {body.value}
          </p>
          <a
            href="#tour"
            onClick={(event) => {
              if (previewMode) {
                event.preventDefault();
                onSelectField?.(cta.key);
              }
            }}
            className="mt-8 inline-flex h-11 items-center rounded-full bg-black px-6 font-medium text-white transition hover:opacity-85"
            style={{ order: getOrder(orderMap, "base:cta", 3) }}
          >
            <span
              className={selectableClass(
                selectedFieldId === cta.key,
                previewMode,
              )}
              style={getFieldStyle(cta)}
            >
              {cta.value}
            </span>
          </a>
          <SectionExtras
            section={section}
            textMap={textMap}
            previewMode={previewMode}
            selectedFieldId={selectedFieldId}
            onSelectField={onSelectField}
            orderMap={orderMap}
          />
        </div>
      </div>
    </section>
  );
}

function CardsSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const kicker = renderField(section, "kicker", "NUESTRA MIRADA", 12, textMap);
  const title = renderField(
    section,
    "title",
    "Pedagogias alternativas",
    40,
    textMap,
  );
  const body = renderField(
    section,
    "body",
    "Comunidad y transformacion.",
    18,
    textMap,
  );
  const cards = [1, 2, 3].map((index) => ({
    title: renderField(
      section,
      `card${index}_title`,
      `Card ${index}`,
      30,
      textMap,
    ),
    body: renderField(section, `card${index}_body`, "Descripcion", 18, textMap),
  }));
  const orderMap = getSectionOrderMap(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);
  const orderedCards = cards
    .slice()
    .sort(
      (a, b) =>
        getOrder(
          orderMap,
          `base:${a.title.key.split(".").pop() ?? ""}`,
          Number.MAX_SAFE_INTEGER,
        ) -
        getOrder(
          orderMap,
          `base:${b.title.key.split(".").pop() ?? ""}`,
          Number.MAX_SAFE_INTEGER,
        ),
    );

  return (
    <section
      className="relative isolate flex min-h-screen items-center overflow-hidden"
      style={hasImageLayer ? undefined : sectionBackgroundStyle}
    >
      {hasImageLayer ? (
        <div aria-hidden className="absolute inset-0 -z-10" style={sectionBackgroundStyle} />
      ) : null}
      <div
        className="mx-auto flex w-full max-w-[92rem] flex-col px-5 py-20 md:px-8 lg:px-12"
        style={sectionPaddingStyle}
      >
        <p
          className={cn(
            "text-black/55",
            selectableClass(selectedFieldId === kicker.key, previewMode),
          )}
          onClick={() => onSelectField?.(kicker.key)}
          style={{
            ...getFieldStyle(kicker),
            order: getOrder(orderMap, "base:kicker", 0),
          }}
        >
          {kicker.value}
        </p>
        <h2
          className={cn(
            "mt-3 max-w-4xl leading-tight font-semibold tracking-tight",
            selectableClass(selectedFieldId === title.key, previewMode),
          )}
          onClick={() => onSelectField?.(title.key)}
          style={{
            ...getFieldStyle(title),
            order: getOrder(orderMap, "base:title", 1),
          }}
        >
          {title.value}
        </h2>
        <p
          className={cn(
            "mt-4 max-w-3xl leading-7 text-black/75",
            selectableClass(selectedFieldId === body.key, previewMode),
          )}
          onClick={() => onSelectField?.(body.key)}
          style={{
            ...getFieldStyle(body),
            order: getOrder(orderMap, "base:body", 2),
          }}
        >
          {body.value}
        </p>

        <div
          className="mt-10 grid gap-4 md:grid-cols-3"
          style={{ order: getOrder(orderMap, "base:cards", 3) }}
        >
          {orderedCards.map((card, index) => (
            <article
              key={index}
              className="rounded-3xl border border-black/10 bg-white p-6"
            >
              <h3
                className={cn(
                  "font-semibold tracking-tight",
                  selectableClass(
                    selectedFieldId === card.title.key,
                    previewMode,
                  ),
                )}
                onClick={() => onSelectField?.(card.title.key)}
                style={getFieldStyle(card.title)}
              >
                {card.title.value}
              </h3>
              <p
                className={cn(
                  "mt-3 leading-7 text-black/75",
                  selectableClass(
                    selectedFieldId === card.body.key,
                    previewMode,
                  ),
                )}
                onClick={() => onSelectField?.(card.body.key)}
                style={getFieldStyle(card.body)}
              >
                {card.body.value}
              </p>
            </article>
          ))}
        </div>
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

function StorySection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const title = renderField(
    section,
    "title",
    "Una practica educativa",
    40,
    textMap,
  );
  const body = renderField(section, "body", "Descripcion", 18, textMap);
  const quote = renderField(
    section,
    "quote",
    "Koru es abrazo, tribu y transformacion.",
    26,
    textMap,
  );
  const orderMap = getSectionOrderMap(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);

  return (
    <section
      className="relative isolate flex min-h-screen items-center overflow-hidden border-y border-black/10 bg-[#ece9df]"
      style={hasImageLayer ? undefined : sectionBackgroundStyle}
    >
      {hasImageLayer ? (
        <div aria-hidden className="absolute inset-0 -z-10" style={sectionBackgroundStyle} />
      ) : null}
      <div
        className="mx-auto flex w-full max-w-[92rem] flex-col px-5 py-20 md:px-8 lg:px-12"
        style={sectionPaddingStyle}
      >
        <h2
          className={cn(
            "max-w-4xl leading-tight font-semibold tracking-tight",
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
            "mt-5 max-w-3xl leading-7 text-black/75",
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
        <p
          className={cn(
            "mt-8 font-medium text-black/85",
            selectableClass(selectedFieldId === quote.key, previewMode),
          )}
          onClick={() => onSelectField?.(quote.key)}
          style={{
            ...getFieldStyle(quote),
            order: getOrder(orderMap, "base:quote", 2),
          }}
        >
          {quote.value}
        </p>
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

function GallerySection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
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
    (index) => textMap[getSectionGalleryItemImageKey(section.id, index)]?.trim() ?? "",
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
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const orderedSlides = orderedItems.map((item) => {
    const suffix = item.key.split(".").pop() ?? "";
    const itemNumber = Number.parseInt(
      suffix.replace("item", ""),
      10,
    );
    const image =
      Number.isFinite(itemNumber) && itemNumber >= 1 && itemNumber <= itemImages.length
        ? itemImages[itemNumber - 1]
        : "";
    return { item, image };
  });

  useEffect(() => {
    if (galleryVariant !== "carousel" && galleryVariant !== "stacked") {
      return;
    }
    if (autoplaySeconds <= 0 || orderedSlides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlideIndex((previous) => (previous + 1) % orderedSlides.length);
    }, autoplaySeconds * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [autoplaySeconds, galleryVariant, orderedSlides.length]);

  const normalizedSlideIndex =
    orderedSlides.length > 0
      ? ((activeSlideIndex % orderedSlides.length) + orderedSlides.length) %
        orderedSlides.length
      : 0;

  function goToSlide(nextIndex: number) {
    if (orderedSlides.length === 0) {
      return;
    }
    const normalized = (nextIndex + orderedSlides.length) % orderedSlides.length;
    setActiveSlideIndex(normalized);
  }

  function getRelativeSlideOffset(index: number) {
    if (orderedSlides.length <= 1) {
      return 0;
    }
    const total = orderedSlides.length;
    const rawDelta = index - normalizedSlideIndex;
    const normalizedDelta = ((rawDelta % total) + total) % total;
    return normalizedDelta > total / 2 ? normalizedDelta - total : normalizedDelta;
  }

  return (
    <section
      className="relative isolate flex min-h-screen items-center overflow-hidden"
      style={hasImageLayer ? undefined : sectionBackgroundStyle}
    >
      {hasImageLayer ? (
        <div aria-hidden className="absolute inset-0 -z-10" style={sectionBackgroundStyle} />
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
                style={{ transform: `translateX(-${normalizedSlideIndex * 100}%)` }}
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
                    <p
                      className={cn(
                        "absolute bottom-5 left-5 rounded-md bg-white/80 px-3 py-2 font-medium text-black/90 backdrop-blur-sm",
                        selectableClass(selectedFieldId === slide.item.key, previewMode),
                      )}
                      onClick={() => onSelectField?.(slide.item.key)}
                      style={getFieldStyle(slide.item)}
                    >
                      {slide.item.value}
                    </p>
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
                const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.88 : 0.75;
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
                    <p
                      className={cn(
                        "absolute bottom-4 left-4 rounded-md bg-white/80 px-3 py-2 font-medium text-black/90 backdrop-blur-sm",
                        selectableClass(selectedFieldId === slide.item.key, previewMode),
                      )}
                      onClick={() => onSelectField?.(slide.item.key)}
                      style={getFieldStyle(slide.item)}
                    >
                      {slide.item.value}
                    </p>
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
        ) : (
          <div
            className="mt-10 grid gap-4 md:grid-cols-2"
            style={{ order: getOrder(orderMap, "base:items", 2) }}
          >
            {orderedItems.map((item, index) => (
              <article
                key={index}
                className="flex h-52 items-end rounded-3xl border border-black/10 bg-gradient-to-br from-[#d9e8d4] via-[#f4efe5] to-[#d8cfb6] p-5"
              >
                <p
                  className={cn(
                    "font-medium text-black/90",
                    selectableClass(selectedFieldId === item.key, previewMode),
                  )}
                  onClick={() => onSelectField?.(item.key)}
                  style={getFieldStyle(item)}
                >
                  {item.value}
                </p>
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

function VideoSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const title = renderField(
    section,
    "title",
    "Conoce nuestra propuesta",
    40,
    textMap,
  );
  const body = renderField(section, "body", "Una mirada breve", 18, textMap);
  const url = renderField(
    section,
    "url",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    14,
    textMap,
  );
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);

  return (
    <section
      className="relative isolate flex min-h-screen items-center overflow-hidden border-y border-black/10 bg-[#f8f7f2]"
      style={hasImageLayer ? undefined : sectionBackgroundStyle}
    >
      {hasImageLayer ? (
        <div aria-hidden className="absolute inset-0 -z-10" style={sectionBackgroundStyle} />
      ) : null}
      <div
        className="mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1fr] lg:px-12"
        style={sectionPaddingStyle}
      >
        <div>
          <h2
            className={cn(
              "leading-tight font-semibold tracking-tight",
              selectableClass(selectedFieldId === title.key, previewMode),
            )}
            onClick={() => onSelectField?.(title.key)}
            style={getFieldStyle(title)}
          >
            {title.value}
          </h2>
          <p
            className={cn(
              "mt-4 text-black/75",
              selectableClass(selectedFieldId === body.key, previewMode),
            )}
            onClick={() => onSelectField?.(body.key)}
            style={getFieldStyle(body)}
          >
            {body.value}
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-black">
          <iframe
            src={url.value}
            title="Koru video"
            className="h-[320px] w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <p
            className={cn(
              "px-4 py-3 text-white/65",
              selectableClass(selectedFieldId === url.key, previewMode),
            )}
            onClick={() => onSelectField?.(url.key)}
            style={getFieldStyle(url)}
          >
            {url.value}
          </p>
        </div>
        <SectionExtras
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      </div>
    </section>
  );
}

function FooterSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const brand = renderField(section, "brand", "Koru", 38, textMap);
  const campus = renderField(section, "campus", "Campus Koru", 38, textMap);
  const mail = renderField(section, "mail", "hola@koru.academy", 24, textMap);
  const legal = renderField(
    section,
    "legal",
    "(c) 2026 Koru - Organismo Social de Aprendizaje",
    20,
    textMap,
  );
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);

  return (
    <footer
      className="relative isolate overflow-hidden border-t border-[#d8d3a8] bg-[#d8cfb6]"
      style={hasImageLayer ? undefined : sectionBackgroundStyle}
    >
      {hasImageLayer ? (
        <div aria-hidden className="absolute inset-0 -z-10" style={sectionBackgroundStyle} />
      ) : null}
      <div
        className="grid w-full gap-10 px-3 py-14 md:grid-cols-2 md:px-5 lg:grid-cols-4 lg:gap-8 lg:px-7"
        style={sectionPaddingStyle}
      >
        <section>
          <h3
            className={selectableClass(
              selectedFieldId === brand.key,
              previewMode,
            )}
            onClick={() => onSelectField?.(brand.key)}
            style={getFieldStyle(brand)}
          >
            {brand.value}
          </h3>
        </section>

        <section>
          <h4
            className={selectableClass(
              selectedFieldId === campus.key,
              previewMode,
            )}
            onClick={() => onSelectField?.(campus.key)}
            style={getFieldStyle(campus)}
          >
            {campus.value}
          </h4>
        </section>

        <section>
          <p
            className={selectableClass(
              selectedFieldId === mail.key,
              previewMode,
            )}
            onClick={() => onSelectField?.(mail.key)}
            style={getFieldStyle(mail)}
          >
            {mail.value}
          </p>
          <p
            className={cn(
              "mt-6",
              selectableClass(selectedFieldId === legal.key, previewMode),
            )}
            onClick={() => onSelectField?.(legal.key)}
            style={getFieldStyle(legal)}
          >
            {legal.value}
          </p>
        </section>

        <section className="text-right text-black/60">
          <Link href="#">Instagram</Link>
        </section>
      </div>
      <div className="px-3 pb-10 md:px-5 lg:px-7">
        <SectionExtras
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      </div>
    </footer>
  );
}

function SectionRenderer({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      );
    case "cards":
      return (
        <CardsSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      );
    case "story":
      return (
        <StorySection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      );
    case "gallery":
      return (
        <GallerySection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      );
    case "video":
      return (
        <VideoSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      );
    case "footer":
      return (
        <FooterSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      );
    default:
      return null;
  }
}

export function LandingView({
  textMap,
  previewViewportHeight,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingViewProps) {
  const completeMap = ensureLandingDefaults(textMap);
  const structure = parseLandingStructure(completeMap);
  const previewRootStyle: CSSProperties | undefined =
    previewMode && previewViewportHeight
      ? ({ ["--landing-preview-vh" as string]: `${previewViewportHeight}px` } as CSSProperties)
      : undefined;

  return (
    <div
      className="min-h-screen bg-[#f4efe5] text-black"
      data-landing-preview={previewMode ? "true" : undefined}
      style={previewRootStyle}
    >
      <LandingNav />
      {structure.map((section) => (
        <div key={section.id} data-preview-section-id={section.id}>
          <SectionRenderer
            section={section}
            textMap={completeMap}
            previewMode={previewMode}
            selectedFieldId={selectedFieldId}
            onSelectField={onSelectField}
          />
        </div>
      ))}
    </div>
  );
}
