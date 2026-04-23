"use client";

import { cn } from "@/lib/utils";
import { getSectionFieldKey } from "@/modules/landing/config/landing-sections";
import { getLandingFieldPaddingStyle } from "@/modules/landing/types/landing-text";
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

export function StorySection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  responsiveMode,
}: LandingSectionComponentProps) {
  const title = renderField(
    section,
    "title",
    "Una practica educativa",
    40,
    textMap,
    responsiveMode,
  );
  const body = renderField(
    section,
    "body",
    "Descripcion",
    18,
    textMap,
    responsiveMode,
  );
  const quote = renderField(
    section,
    "quote",
    "Koru es abrazo, tribu y transformacion.",
    26,
    textMap,
    responsiveMode,
  );
  const orderMap = getSectionOrderMap(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const sectionBorderStyle = getSectionBorderStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);
  const sectionStyle = hasImageLayer
    ? sectionBorderStyle
    : { ...sectionBackgroundStyle, ...sectionBorderStyle };

  return (
    <section
      className="relative isolate flex min-h-screen items-center overflow-hidden border-y border-black/10 bg-[#ece9df]"
      style={sectionStyle}
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
          responsiveMode={responsiveMode}
          orderMap={orderMap}
        />
      </div>
    </section>
  );
}
