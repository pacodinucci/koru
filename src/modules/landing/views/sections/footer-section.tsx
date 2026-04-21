"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSectionFieldKey } from "@/modules/landing/config/landing-sections";
import { getLandingFieldPaddingStyle } from "@/modules/landing/types/landing-text";
import { SectionExtras } from "@/modules/landing/views/components/section-extras";
import { getFieldStyle, renderField, selectableClass } from "@/modules/landing/views/utils/field";
import { getSectionBackgroundStyle, hasBackgroundImageLayer } from "@/modules/landing/views/utils/section-style";
import type { LandingSectionComponentProps } from "@/modules/landing/views/sections/types";

export function FooterSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingSectionComponentProps) {
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
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={sectionBackgroundStyle}
        />
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

