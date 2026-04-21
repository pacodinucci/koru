"use client";

import { cn } from "@/lib/utils";
import {
  getSectionExtraTextKey,
  parseSectionExtraElements,
  type SectionExtraElementType,
} from "@/modules/landing/config/landing-sections";
import {
  getLandingFieldColor,
  getLandingFieldFontFamily,
  getLandingFieldFontSize,
  getLandingFieldFontWeight,
  getLandingFieldMarginStyle,
  getLandingFieldPaddingStyle,
  type LandingPreviewBindings,
  type LandingTextMap,
} from "@/modules/landing/types/landing-text";
import { getFieldStyle, selectableClass } from "@/modules/landing/views/utils/field";
import { getOrder } from "@/modules/landing/views/utils/section-style";
import type { LandingSectionInstance } from "@/modules/landing/config/landing-sections";

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

type SectionExtrasProps = {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
  orderMap?: Map<string, number>;
} & LandingPreviewBindings;

export function SectionExtras({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  orderMap,
}: SectionExtrasProps) {
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
            getOrder(
              orderMap ?? new Map(),
              `extra:${a.id}`,
              Number.MAX_SAFE_INTEGER,
            ) -
            getOrder(
              orderMap ?? new Map(),
              `extra:${b.id}`,
              Number.MAX_SAFE_INTEGER,
            ),
        )
        .map((extra) => {
          const key = getSectionExtraTextKey(section.id, extra.id);
          const defaults = getExtraDefault(extra.type);
          const order = getOrder(
            orderMap ?? new Map(),
            `extra:${extra.id}`,
            999,
          );
          const field = {
            key,
            value: textMap[key] ?? defaults.text,
            fontSize: getLandingFieldFontSize(textMap, key, defaults.size),
            color: getLandingFieldColor(textMap, key),
            fontFamily: getLandingFieldFontFamily(textMap, key),
            fontWeight: getLandingFieldFontWeight(textMap, key),
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

