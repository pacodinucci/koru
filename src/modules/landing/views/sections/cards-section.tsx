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

export function CardsSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingSectionComponentProps) {
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
  const sectionBorderStyle = getSectionBorderStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);
  const sectionStyle = hasImageLayer
    ? sectionBorderStyle
    : { ...sectionBackgroundStyle, ...sectionBorderStyle };
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
