"use client";

import {
  getSectionFieldKey,
  getSectionFooterHeightKey,
  getSectionFooterMinHeightKey,
} from "@/modules/landing/config/landing-sections";
import { getLandingFieldPaddingStyle } from "@/modules/landing/types/landing-text";
import { SectionExtras } from "@/modules/landing/views/components/section-extras";
import {
  getSectionBackgroundStyle,
  getSectionBorderStyle,
  getSectionOrderMap,
  hasBackgroundImageLayer,
} from "@/modules/landing/views/utils/section-style";
import type { LandingSectionComponentProps } from "@/modules/landing/views/sections/types";

export function FooterSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  onMoveSectionExtraPosition,
}: LandingSectionComponentProps) {
  const orderMap = getSectionOrderMap(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const footerHeightRaw = Number.parseInt(
    textMap[getSectionFooterHeightKey(section.id)] ??
      textMap[getSectionFooterMinHeightKey(section.id)] ??
      "",
    10,
  );
  const footerHeight = Number.isFinite(footerHeightRaw)
    ? Math.min(1200, Math.max(180, footerHeightRaw))
    : 320;
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const sectionBorderStyle = getSectionBorderStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);
  const sectionStyle = hasImageLayer
    ? { ...sectionBorderStyle, height: `${footerHeight}px` }
    : {
        ...sectionBackgroundStyle,
        ...sectionBorderStyle,
        height: `${footerHeight}px`,
      };

  return (
    <footer
      className="relative isolate overflow-hidden border-t border-[#d8d3a8] bg-[#d8cfb6]"
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
        className="flex h-full w-full flex-col justify-center px-3 py-14 md:px-5 lg:px-7"
        style={sectionPaddingStyle}
      >
        <SectionExtras
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
          orderMap={orderMap}
        />
      </div>
    </footer>
  );
}
