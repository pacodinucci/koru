"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  getSectionFieldKey,
  getSectionImageGridColumnsKey,
  getSectionImageGridItemsCountKey,
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
  const imageUrls = [
    "/assets/img1.jpg",
    "/assets/img2.jpg",
    "/assets/img3.jpg",
    "/assets/img4.jpg",
    "/assets/img5.jpg",
    "/assets/img6.jpg",
    "/assets/img7.jpg",
    "/assets/img8.jpg",
    "/assets/img9.jpg",
    "/assets/img1.jpg",
    "/assets/img2.jpg",
    "/assets/img3.jpg",
  ];
  const orderMap = getSectionOrderMap(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionMarginStyle = getLandingFieldMarginStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const sectionBorderStyle = getSectionBorderStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);
  const sectionStyle: CSSProperties = hasImageLayer
    ? sectionBorderStyle
    : {
        backgroundColor: "#eef0dd",
        ...sectionBackgroundStyle,
        ...sectionBorderStyle,
        ...sectionMarginStyle,
      };
  const bodyPaddingStyle = {
    paddingLeft: "var(--landing-body-padding-x, 24px)",
    paddingRight: "var(--landing-body-padding-x, 24px)",
    ...sectionPaddingStyle,
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
      <div
        className="mx-auto w-full max-w-[110rem] py-14"
        style={bodyPaddingStyle}
      >
        <div
          className="grid gap-3 md:gap-4"
          style={{
            order: getOrder(orderMap, "base:grid", 0),
            gridTemplateColumns: `repeat(${imageGridColumns}, minmax(0, 1fr))`,
          }}
        >
          {cards.map((card, index) => (
            <article
              key={card.key}
              className="group relative aspect-square overflow-hidden"
            >
              <div
                className="h-full w-full scale-[1.08] bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-100"
                style={{ backgroundImage: `url("${imageUrls[index]}")` }}
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/35" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p
                  className={cn(
                    previewMode
                      ? "text-center text-white -translate-y-3"
                      : "landing-curtain-rtl text-center text-white -translate-y-3",
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
          ))}
        </div>

        <SectionExtras
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          orderMap={orderMap}
        />
      </div>
    </section>
  );
}

