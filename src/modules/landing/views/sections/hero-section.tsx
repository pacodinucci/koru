"use client";

import { cn } from "@/lib/utils";
import { getSectionFieldKey } from "@/modules/landing/config/landing-sections";
import {
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

export function HeroSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  responsiveMode,
}: LandingSectionComponentProps) {
  const kicker = renderField(
    section,
    "kicker",
    "BIENVENID@S A KORU OSA",
    12,
    textMap,
    responsiveMode,
  );
  const title = renderField(
    section,
    "title",
    "En Koru, entendemos la educacion como un organismo vivo.",
    56,
    textMap,
    responsiveMode,
  );
  const body = renderField(
    section,
    "body",
    "Nuestro cuerpo escolar no es un molde rigido, sino una forma cambiante.",
    20,
    textMap,
    responsiveMode,
  );
  const cta = renderField(
    section,
    "cta",
    "Haz una donación",
    14,
    textMap,
    responsiveMode,
  );
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
  const sectionStyle = hasImageLayer
    ? sectionBorderStyle
    : { ...sectionBackgroundStyle, ...sectionBorderStyle, ...sectionMarginStyle };
  const bodyPaddingStyle = {
    paddingLeft: "var(--landing-body-padding-x, 24px)",
    paddingRight: "var(--landing-body-padding-x, 24px)",
    ...sectionPaddingStyle,
  };

  return (
    <section
      className="relative isolate flex min-h-screen items-center overflow-hidden border-b border-black/10 bg-[#f4efe5]"
      style={hasImageLayer ? { ...sectionStyle, ...sectionMarginStyle } : sectionStyle}
    >
      {hasImageLayer ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={sectionBackgroundStyle}
        />
      ) : null}
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#d5e8d4]/60 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-[#c8d8f0]/70 blur-3xl" />
      <div
        className="relative mx-auto grid w-full max-w-[92rem] gap-8 py-20 lg:grid-cols-[1.2fr_0.8fr]"
        style={bodyPaddingStyle}
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
            responsiveMode={responsiveMode}
            orderMap={orderMap}
          />
        </div>
      </div>
    </section>
  );
}
