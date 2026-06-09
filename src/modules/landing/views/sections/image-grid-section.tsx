"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { cloudinaryImageUrl } from "@/lib/cloudinary";
import { ScrollReveal } from "@/modules/landing/views/components/scroll-reveal";
import { isCodeFirstLandingMode } from "@/modules/landing/config/landing-mode";
import {
  getSectionFieldKey,
  getSectionImageGridColumnsKey,
  getSectionImageGridImageSizeKey,
  getSectionImageGridItemsCountKey,
  getSectionImageGridUseBodyPaddingKey,
} from "@/modules/landing/config/landing-sections";
import {
  getLandingFieldColor,
  getLandingFieldFontFamily,
  getLandingFieldFontSize,
  getLandingFieldFontWeight,
  getLandingFieldLetterSpacing,
  getLandingFieldLineHeight,
  getLandingFieldMarginStyle,
  getLandingFieldPaddingStyle,
} from "@/modules/landing/types/landing-text";
import { SectionExtras } from "@/modules/landing/views/components/section-extras";
import { getFieldStyle, renderField, selectableClass } from "@/modules/landing/views/utils/field";
import {
  getOrder,
  getSectionBackgroundStyle,
  getSectionBorderStyle,
  getSectionOrderMap,
  hasBackgroundImageLayer,
} from "@/modules/landing/views/utils/section-style";
import type { LandingSectionComponentProps } from "@/modules/landing/views/sections/types";

export function ImageGridSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  responsiveMode,
}: LandingSectionComponentProps) {
  const isCodeFirst = isCodeFirstLandingMode();
  const sharedTextStyleKey = getSectionFieldKey(section.id, "__cards_text_style");
  const sharedTextStyleField = {
    key: sharedTextStyleKey,
    value: "",
    fontSize: getLandingFieldFontSize(
      textMap,
      sharedTextStyleKey,
      22,
      responsiveMode,
    ),
    color: getLandingFieldColor(textMap, sharedTextStyleKey),
    fontFamily: getLandingFieldFontFamily(textMap, sharedTextStyleKey),
    fontWeight: getLandingFieldFontWeight(textMap, sharedTextStyleKey),
    lineHeight: getLandingFieldLineHeight(textMap, sharedTextStyleKey),
    letterSpacing: getLandingFieldLetterSpacing(textMap, sharedTextStyleKey),
    marginStyle: getLandingFieldMarginStyle(textMap, sharedTextStyleKey),
    paddingStyle: getLandingFieldPaddingStyle(textMap, sharedTextStyleKey),
  };
  const imageGridItemsCount = Math.min(
    12,
    Math.max(
      1,
      Number.parseInt(
        textMap[getSectionImageGridItemsCountKey(section.id)] ?? "12",
        10,
      ) || 12,
    ),
  );
  const imageGridColumns = Math.min(
    6,
    Math.max(
      1,
      Number.parseInt(
        textMap[getSectionImageGridColumnsKey(section.id)] ?? "4",
        10,
      ) || 4,
    ),
  );
  const imageGridUseBodyPadding =
    (textMap[getSectionImageGridUseBodyPaddingKey(section.id)] ?? "1") !== "0";
  const imageGridImageSize = Math.min(
    520,
    Math.max(
      120,
      Number.parseInt(
        textMap[getSectionImageGridImageSizeKey(section.id)] ?? "260",
        10,
      ) || 260,
    ),
  );
  const cards = Array.from({ length: imageGridItemsCount }, (_, index) =>
    renderField(
      section,
      `item${index + 1}`,
      `Card ${index + 1}`,
      22,
      textMap,
      responsiveMode,
    ),
  );
  const fixedHoverLabels = ["Aprendizaje", "Cultura", "Instalaciones", "Equipo"];
  const topCards = cards.slice(0, Math.min(4, cards.length));
  const remainingCards = cards.slice(Math.min(4, cards.length));
  const imageUrls = [
    {
      primary: cloudinaryImageUrl("koru/landing/DSC01345", "/assets/images/DSC01345.png"),
      fallback: "/assets/images/DSC01345.png",
    },
    {
      primary: cloudinaryImageUrl("koru/landing/DSC01338", "/assets/images/DSC01338.png"),
      fallback: "/assets/images/DSC01338.png",
    },
    {
      primary: cloudinaryImageUrl("koru/landing/DSC01402", "/assets/images/DSC01402.png"),
      fallback: "/assets/images/DSC01402.png",
    },
    {
      primary: cloudinaryImageUrl("koru/landing/DSC02336", "/assets/images/DSC02336.png"),
      fallback: "/assets/images/DSC02336.png",
    },
    { primary: "/assets/img5.jpg", fallback: "/assets/img5.jpg" },
    { primary: "/assets/img6.jpg", fallback: "/assets/img6.jpg" },
    { primary: "/assets/img7.jpg", fallback: "/assets/img7.jpg" },
    { primary: "/assets/img8.jpg", fallback: "/assets/img8.jpg" },
    { primary: "/assets/img9.jpg", fallback: "/assets/img9.jpg" },
    { primary: "/assets/img1.jpg", fallback: "/assets/img1.jpg" },
    { primary: "/assets/img2.jpg", fallback: "/assets/img2.jpg" },
    { primary: "/assets/img3.jpg", fallback: "/assets/img3.jpg" },
  ];
  const orderMap = getSectionOrderMap(textMap, section.id);
  const sectionPaddingStyle = isCodeFirst
    ? {}
    : getLandingFieldPaddingStyle(
        textMap,
        getSectionFieldKey(section.id, "__section_padding"),
      );
  const sectionMarginStyle = isCodeFirst
    ? {}
    : getLandingFieldMarginStyle(
        textMap,
        getSectionFieldKey(section.id, "__section_padding"),
      );
  const sectionBackgroundStyle = isCodeFirst
    ? {}
    : getSectionBackgroundStyle(textMap, section.id);
  const sectionBorderStyle = isCodeFirst
    ? {}
    : getSectionBorderStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);
  const sectionStyle: CSSProperties = hasImageLayer
    ? sectionBorderStyle
    : {
        backgroundColor: "#caa27d",
        ...sectionBackgroundStyle,
        ...sectionBorderStyle,
        ...sectionMarginStyle,
      };
  const bodyPaddingStyle = {
    ...sectionPaddingStyle,
    paddingLeft: imageGridUseBodyPadding
      ? "var(--landing-body-padding-x, 24px)"
      : "0px",
    paddingRight: imageGridUseBodyPadding
      ? "var(--landing-body-padding-x, 24px)"
      : "0px",
  };
  return (
    <section
      className="relative isolate overflow-hidden border-y border-black/10"
      style={hasImageLayer ? { ...sectionBorderStyle, ...sectionMarginStyle } : sectionStyle}
    >
      {hasImageLayer ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={sectionBackgroundStyle}
        />
      ) : null}
      <ScrollReveal
        direction="none"
        className="mx-auto w-full max-w-[110rem] py-20"
        style={bodyPaddingStyle}
      >
        <div className="flex justify-center">
          <div
            className="grid w-full grid-cols-2 md:grid-cols-4"
            style={{
              order: getOrder(orderMap, "base:grid", 0),
              maxWidth: "80rem",
              gap: "0px",
            }}
          >
            {topCards.map((card, index) => (
              <article
                key={card.key}
                tabIndex={0}
                className="group relative aspect-[4/5] w-full cursor-pointer overflow-hidden bg-black outline-none transition-transform duration-300 ease-out hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:scale-110"
              >
                <Image
                  src={imageUrls[index]?.primary}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  quality={70}
                  className={`h-full w-full object-cover opacity-65 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0 ${
                    index < 3
                      ? "rotate-90 scale-[1.55] group-hover:scale-[1.45] group-focus-visible:scale-[1.45]"
                      : "scale-110 group-hover:scale-100 group-focus-visible:scale-100"
                  }`}
                  alt={fixedHoverLabels[index] ?? `Imagen ${index + 1}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <p
                    className={cn(
                      previewMode
                        ? "text-white"
                        : "landing-curtain-rtl text-white",
                      selectableClass(selectedFieldId === card.key, previewMode),
                    )}
                    onClick={() => onSelectField?.(card.key)}
                    style={getFieldStyle({
                      ...card,
                      fontSize: sharedTextStyleField.fontSize,
                      color: sharedTextStyleField.color,
                      fontFamily: sharedTextStyleField.fontFamily,
                      fontWeight: sharedTextStyleField.fontWeight,
                      lineHeight: sharedTextStyleField.lineHeight,
                      letterSpacing: sharedTextStyleField.letterSpacing,
                      marginStyle: sharedTextStyleField.marginStyle,
                      paddingStyle: sharedTextStyleField.paddingStyle,
                    })}
                  >
                    {fixedHoverLabels[index] ?? card.value}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {remainingCards.length > 0 ? (
          <div
            className="hidden md:grid"
            style={{
              gridTemplateColumns: `repeat(${imageGridColumns}, ${imageGridImageSize}px)`,
              justifyContent: "center",
            }}
          >
            {remainingCards.map((card, idx) => {
              const imageIndex = idx + 4;
              return (
                <article
                  key={card.key}
                  tabIndex={0}
                  className="group relative cursor-pointer overflow-hidden bg-black outline-none transition-transform duration-300 ease-out hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:scale-110"
                  style={{
                    width: `${imageGridImageSize}px`,
                    height: `${imageGridImageSize}px`,
                  }}
                >
                  <Image
                    src={imageUrls[imageIndex]?.primary}
                    fill
                    sizes={`${imageGridImageSize}px`}
                    quality={70}
                    className={`h-full w-full object-cover opacity-65 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0 ${
                      imageIndex < 3
                        ? "rotate-90 scale-[1.55] group-hover:scale-[1.45] group-focus-visible:scale-[1.45]"
                        : "scale-110 group-hover:scale-100 group-focus-visible:scale-100"
                    }`}
                    alt={`Imagen ${imageIndex + 1}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    <p
                      className={cn(
                        previewMode
                          ? "text-white"
                          : "landing-curtain-rtl text-white",
                        selectableClass(selectedFieldId === card.key, previewMode),
                      )}
                      onClick={() => onSelectField?.(card.key)}
                      style={getFieldStyle({
                        ...card,
                        fontSize: sharedTextStyleField.fontSize,
                        color: sharedTextStyleField.color,
                        fontFamily: sharedTextStyleField.fontFamily,
                        fontWeight: sharedTextStyleField.fontWeight,
                        lineHeight: sharedTextStyleField.lineHeight,
                        letterSpacing: sharedTextStyleField.letterSpacing,
                        marginStyle: sharedTextStyleField.marginStyle,
                        paddingStyle: sharedTextStyleField.paddingStyle,
                      })}
                    >
                      {card.value}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        <SectionExtras
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          orderMap={orderMap}
        />
      </ScrollReveal>
    </section>
  );
}

