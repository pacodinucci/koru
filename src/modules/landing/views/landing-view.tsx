"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LandingNav } from "@/modules/landing/components/landing-nav";
import {
  ensureLandingDefaults,
  parseLandingStructure,
  type LandingSectionInstance,
} from "@/modules/landing/config/landing-sections";
import type {
  LandingResponsiveMode,
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
import {
  createResponsiveScopedTextMap,
  getResponsiveModeFromWidth,
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
  responsiveMode,
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
          responsiveMode={responsiveMode}
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
          responsiveMode={responsiveMode}
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
          responsiveMode={responsiveMode}
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
          responsiveMode={responsiveMode}
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
          responsiveMode={responsiveMode}
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
          responsiveMode={responsiveMode}
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
          responsiveMode={responsiveMode}
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
  responsiveMode,
  onMoveSectionExtraPosition,
}: LandingViewProps) {
  const completeMap = ensureLandingDefaults(textMap);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [rootWidth, setRootWidth] = useState(0);
  const effectiveResponsiveMode: LandingResponsiveMode =
    responsiveMode ??
    getResponsiveModeFromWidth(
      rootWidth > 0
        ? rootWidth
        : typeof window !== "undefined"
          ? window.innerWidth
          : 1400,
    );

  const responsiveMap = createResponsiveScopedTextMap(
    completeMap,
    effectiveResponsiveMode,
  );
  const structure = parseLandingStructure(completeMap);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const update = () => setRootWidth(root.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  const previewRootStyle: CSSProperties | undefined =
    previewMode && previewViewportHeight
      ? ({
          ["--landing-preview-vh" as string]: `${previewViewportHeight}px`,
        } as CSSProperties)
      : undefined;

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-[#f4efe5] text-black"
      data-landing-preview={previewMode ? "true" : undefined}
      style={previewRootStyle}
    >
      <LandingNav />
      {structure.map((section) => (
        <div key={section.id} data-preview-section-id={section.id}>
          <SectionRenderer
            section={section}
            textMap={responsiveMap}
            previewMode={previewMode}
            selectedFieldId={selectedFieldId}
            onSelectField={onSelectField}
            responsiveMode={effectiveResponsiveMode}
            onMoveSectionExtraPosition={onMoveSectionExtraPosition}
          />
        </div>
      ))}
    </div>
  );
}
