"use client";

import { cn } from "@/lib/utils";
import { SporeShape } from "@/components/spore-shape";
import { getSectionFieldKey } from "@/modules/landing/config/landing-sections";
import { getLandingFieldPaddingStyle } from "@/modules/landing/types/landing-text";
import { selectableClass } from "@/modules/landing/views/utils/field";
import {
  getSectionBackgroundStyle,
  getSectionBorderStyle,
  hasBackgroundImageLayer,
} from "@/modules/landing/views/utils/section-style";
import type { LandingSectionComponentProps } from "@/modules/landing/views/sections/types";

export function SporeFeatureStackSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingSectionComponentProps) {
  const sectionSelectionFieldKey = getSectionFieldKey(section.id, "spore1_x");
  const getValue = (fieldKey: string, fallback: string) =>
    textMap[getSectionFieldKey(section.id, fieldKey)] ?? fallback;
  const getNumber = (
    fieldKey: string,
    fallback: number,
    min?: number,
    max?: number,
  ) => {
    const parsed = Number.parseFloat(getValue(fieldKey, String(fallback)));
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const lowerBound = min ?? Number.NEGATIVE_INFINITY;
    const upperBound = max ?? Number.POSITIVE_INFINITY;
    return Math.min(upperBound, Math.max(lowerBound, parsed));
  };
  const getBool = (fieldKey: string, fallback = false) => {
    const raw = getValue(fieldKey, fallback ? "1" : "0").trim().toLowerCase();
    if (raw === "1" || raw === "true" || raw === "yes") {
      return true;
    }
    if (raw === "0" || raw === "false" || raw === "no") {
      return false;
    }
    return fallback;
  };

  const spores = [
    {
      x: getNumber("spore1_x", 6, -50, 150),
      y: getNumber("spore1_y", 6, -50, 150),
      size: getNumber("spore1_size", 6, 1),
      rotate: getNumber("spore1_rotate", -16),
      opacity: getNumber("spore1_opacity", 10, 0, 100) / 100,
      color: getValue("spore1_color", "var(--brand-600)"),
      flipX: getBool("spore1_flip_x"),
      flipY: getBool("spore1_flip_y"),
    },
    {
      x: getNumber("spore2_x", 86, -50, 150),
      y: getNumber("spore2_y", 22, -50, 150),
      size: getNumber("spore2_size", 21, 1),
      rotate: getNumber("spore2_rotate", 21),
      opacity: getNumber("spore2_opacity", 30, 0, 100) / 100,
      color: getValue("spore2_color", "var(--complement-800)"),
      flipX: getBool("spore2_flip_x", true),
      flipY: getBool("spore2_flip_y"),
    },
    {
      x: getNumber("spore3_x", 8, -50, 150),
      y: getNumber("spore3_y", 55, -50, 150),
      size: getNumber("spore3_size", 25, 1),
      rotate: getNumber("spore3_rotate", -28),
      opacity: getNumber("spore3_opacity", 30, 0, 100) / 100,
      color: getValue("spore3_color", "var(--brand-500)"),
      flipX: getBool("spore3_flip_x"),
      flipY: getBool("spore3_flip_y", true),
    },
    {
      x: getNumber("spore4_x", 72, -50, 150),
      y: getNumber("spore4_y", 84, -50, 150),
      size: getNumber("spore4_size", 7, 1),
      rotate: getNumber("spore4_rotate", 14),
      opacity: getNumber("spore4_opacity", 10, 0, 100) / 100,
      color: getValue("spore4_color", "var(--complement-700)"),
      flipX: getBool("spore4_flip_x", true),
      flipY: getBool("spore4_flip_y", true),
    },
  ];

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
      className="relative isolate min-h-[200vh] overflow-hidden bg-white"
      style={sectionStyle}
    >
      {hasImageLayer ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={sectionBackgroundStyle}
        />
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {spores.map((spore, index) => (
          <SporeShape
            key={index}
            className="absolute mix-blend-multiply"
            style={{ left: `${spore.x}%`, top: `${spore.y}%` }}
            size={spore.size}
            color={spore.color}
            opacity={spore.opacity}
            rotate={spore.rotate}
            flipX={spore.flipX}
            flipY={spore.flipY}
          />
        ))}
      </div>
      {previewMode ? (
        <button
          type="button"
          className={cn(
            "absolute inset-0 z-20 h-full w-full cursor-pointer bg-transparent text-transparent",
            selectableClass(selectedFieldId === sectionSelectionFieldKey, previewMode),
          )}
          aria-label="Seleccionar seccion de esporas"
          onClick={() => onSelectField?.(sectionSelectionFieldKey)}
        >
          Seleccionar seccion de esporas
        </button>
      ) : null}
      <div className="relative z-10 min-h-[200vh]" style={sectionPaddingStyle} />
    </section>
  );
}
