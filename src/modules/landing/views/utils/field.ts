import { cn } from "@/lib/utils";
import { getSectionFieldKey, type LandingSectionInstance } from "@/modules/landing/config/landing-sections";
import {
  getLandingFieldColor,
  getLandingFieldFontFamily,
  getLandingFieldFontSize,
  getLandingFieldFontWeight,
  getLandingFieldMarginStyle,
  getLandingFieldPaddingStyle,
  type LandingFontFamily,
  type LandingResponsiveMode,
  type LandingTextMap,
} from "@/modules/landing/types/landing-text";
import type { CSSProperties } from "react";

export type LandingRenderableField = {
  key: string;
  value: string;
  fontSize: number;
  color: string | null;
  fontFamily: LandingFontFamily | null;
  fontWeight: number | null;
  marginStyle: ReturnType<typeof getLandingFieldMarginStyle>;
  paddingStyle: ReturnType<typeof getLandingFieldPaddingStyle>;
};

export function selectableClass(active: boolean, previewMode?: boolean) {
  return cn(
    previewMode && "cursor-pointer rounded-sm transition",
    active &&
      "outline-2 outline outline-[#22c55e] shadow-[0_0_0_4px_rgba(34,197,94,0.22)]",
  );
}

export function renderField(
  section: LandingSectionInstance,
  fieldKey: string,
  fallback: string,
  fallbackSize: number,
  textMap: LandingTextMap,
  responsiveMode?: LandingResponsiveMode,
): LandingRenderableField {
  const key = getSectionFieldKey(section.id, fieldKey);
  return {
    key,
    value: textMap[key] ?? fallback,
    fontSize: getLandingFieldFontSize(textMap, key, fallbackSize, responsiveMode),
    color: getLandingFieldColor(textMap, key),
    fontFamily: getLandingFieldFontFamily(textMap, key),
    fontWeight: getLandingFieldFontWeight(textMap, key),
    marginStyle: getLandingFieldMarginStyle(textMap, key),
    paddingStyle: getLandingFieldPaddingStyle(textMap, key),
  };
}

function getFontFamilyStyleValue(fontFamily: LandingFontFamily) {
  if (fontFamily === "montserrat") {
    return 'var(--font-montserrat), "Segoe UI", sans-serif';
  }
  if (fontFamily === "nunito") {
    return 'var(--font-nunito), "Segoe UI", sans-serif';
  }
  return '"Fira Sans", "Segoe UI", sans-serif';
}

export function getFieldStyle(field: LandingRenderableField): CSSProperties {
  return {
    fontSize: `${field.fontSize}px`,
    ...(field.fontFamily
      ? { fontFamily: getFontFamilyStyleValue(field.fontFamily) }
      : null),
    ...(field.fontWeight ? { fontWeight: field.fontWeight } : null),
    ...field.marginStyle,
    ...field.paddingStyle,
    ...(field.color ? { color: field.color } : null),
  };
}
