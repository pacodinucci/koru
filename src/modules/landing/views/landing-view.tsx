"use client";

import type { CSSProperties } from "react";
import { LandingNav } from "@/modules/landing/components/landing-nav";
import {
  ensureLandingDefaults,
  parseLandingStructure,
  type LandingSectionInstance,
} from "@/modules/landing/config/landing-sections";
import type {
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
import { CardsSection } from "@/modules/landing/views/sections/cards-section";
import { FooterSection } from "@/modules/landing/views/sections/footer-section";
import { GallerySection } from "@/modules/landing/views/sections/gallery-section";
import { HeroSection } from "@/modules/landing/views/sections/hero-section";
import { ImageGridSection } from "@/modules/landing/views/sections/image-grid-section";
import { StorySection } from "@/modules/landing/views/sections/story-section";
import { VideoSection } from "@/modules/landing/views/sections/video-section";

type LandingViewProps = {
  textMap: LandingTextMap;
  previewViewportHeight?: number;
} & LandingPreviewBindings;

type SectionRendererProps = {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings;

function SectionRenderer({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  onMoveSectionExtraPosition,
}: SectionRendererProps) {
  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "cards":
      return (
        <CardsSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "story":
      return (
        <StorySection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "gallery":
      return (
        <GallerySection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "image-grid":
      return (
        <ImageGridSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "video":
      return (
        <VideoSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "footer":
      return (
        <FooterSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    default:
      return null;
  }
}

export function LandingView({
  textMap,
  previewViewportHeight,
  previewMode,
  selectedFieldId,
  onSelectField,
  onMoveSectionExtraPosition,
}: LandingViewProps) {
  const completeMap = ensureLandingDefaults(textMap);
  const structure = parseLandingStructure(completeMap);
  const previewRootStyle: CSSProperties | undefined =
    previewMode && previewViewportHeight
      ? ({
          ["--landing-preview-vh" as string]: `${previewViewportHeight}px`,
        } as CSSProperties)
      : undefined;

  return (
    <div
      className="min-h-screen bg-[#f4efe5] text-black"
      data-landing-preview={previewMode ? "true" : undefined}
      style={previewRootStyle}
    >
      <LandingNav />
      {structure.map((section) => (
        <div key={section.id} data-preview-section-id={section.id}>
          <SectionRenderer
            section={section}
            textMap={completeMap}
            previewMode={previewMode}
            selectedFieldId={selectedFieldId}
            onSelectField={onSelectField}
            onMoveSectionExtraPosition={onMoveSectionExtraPosition}
          />
        </div>
      ))}
    </div>
  );
}
