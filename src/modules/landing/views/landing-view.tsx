"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { SporeShape } from "@/components/spore-shape";
import {
  ensureLandingDefaults,
  parseLandingBackgroundScopes,
  parseLandingStructure,
  type LandingBackgroundScope,
  type LandingSectionInstance,
} from "@/modules/landing/config/landing-sections";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";
import {
  createResponsiveScopedTextMap,
  getResponsiveModeFromWidth,
  type LandingResponsiveMode,
} from "@/modules/landing/types/landing-text";
import { CardsSection } from "@/modules/landing/views/sections/cards-section";
import { FooterSection } from "@/modules/landing/views/sections/footer-section";
import { GallerySection } from "@/modules/landing/views/sections/gallery-section";
import { HeroSection } from "@/modules/landing/views/sections/hero-section";
import { ImageGridSection } from "@/modules/landing/views/sections/image-grid-section";
import { SporeFeatureStackSection } from "@/modules/landing/views/sections/spore-feature-stack-section";
import { StorySection } from "@/modules/landing/views/sections/story-section";
import { VideoSection } from "@/modules/landing/views/sections/video-section";

type LandingViewProps = {
  textMap: LandingTextMap;
} & LandingPreviewBindings;

type SectionRendererProps = {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings;

type ScopedSectionGroup = {
  scopeId: string;
  sections: LandingSectionInstance[];
};

function groupSectionsByScope(
  sections: LandingSectionInstance[],
  scopeIdsInOrder: string[],
): ScopedSectionGroup[] {
  const groups = scopeIdsInOrder.map((scopeId) => ({
    scopeId,
    sections: [] as LandingSectionInstance[],
  }));
  const groupMap = new Map(groups.map((group) => [group.scopeId, group]));
  const fallbackScopeId = scopeIdsInOrder[0] ?? "scope-default";

  for (const section of sections) {
    const resolvedScopeId =
      section.scopeId && groupMap.has(section.scopeId)
        ? section.scopeId
        : fallbackScopeId;
    groupMap.get(resolvedScopeId)?.sections.push(section);
  }

  return groups;
}

function ScopeBackground({
  scope,
  children,
}: {
  scope: LandingBackgroundScope;
  children: React.ReactNode;
}) {
  const scopeHeight = `calc(var(--landing-vh, 100dvh) * ${scope.heightVh} / 100)`;
  const backgroundStyle: CSSProperties =
    scope.visualMode === "gradient"
      ? { backgroundImage: scope.gradient, minHeight: scopeHeight }
      : { backgroundColor: scope.color, minHeight: scopeHeight };

  if (scope.type !== "spore") {
    return (
      <div className="relative isolate overflow-hidden" style={backgroundStyle}>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden" style={backgroundStyle}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <SporeShape
          className="absolute -left-[9vw] top-[3vh] mix-blend-multiply"
          size={6}
          color="var(--brand-600)"
          opacity={0.1}
          rotate={-16}
        />
        <SporeShape
          className="absolute right-[-8vw] top-[22vh] mix-blend-multiply"
          size={21}
          color="var(--complement-800)"
          opacity={0.3}
          rotate={21}
          flipX
        />
        <SporeShape
          className="absolute left-[8vw] top-[55%] mix-blend-multiply"
          size={25}
          color="var(--brand-500)"
          opacity={0.3}
          rotate={-28}
          flipY
        />
        <SporeShape
          className="absolute right-[6vw] bottom-[8%] mix-blend-multiply"
          size={7}
          color="var(--complement-700)"
          opacity={0.1}
          rotate={14}
          flipX
          flipY
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

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
    case "spore-stack":
      return (
        <SporeFeatureStackSection
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
  previewMode,
  selectedFieldId,
  onSelectField,
  responsiveMode,
  onMoveSectionExtraPosition,
}: LandingViewProps) {
  const completeMap = ensureLandingDefaults(textMap);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [measuredMode, setMeasuredMode] = useState<LandingResponsiveMode>("large");

  useEffect(() => {
    if (responsiveMode) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const updateMode = () => {
      const nextWidth = root.clientWidth;
      if (nextWidth > 0) {
        setMeasuredMode(getResponsiveModeFromWidth(nextWidth));
      }
    };

    updateMode();
    const observer = new ResizeObserver(updateMode);
    observer.observe(root);
    window.addEventListener("resize", updateMode);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMode);
    };
  }, [responsiveMode]);

  const effectiveResponsiveMode = responsiveMode ?? measuredMode;
  const responsiveMap = createResponsiveScopedTextMap(
    completeMap,
    effectiveResponsiveMode,
  );
  const scopes = parseLandingBackgroundScopes(completeMap);
  const scopeMap = new Map(scopes.map((scope) => [scope.id, scope]));
  const structure = parseLandingStructure(completeMap).filter(
    (section) => section.type !== "footer",
  );
  const groupedSections = useMemo(
    () =>
      groupSectionsByScope(
        structure,
        scopes.map((scope) => scope.id),
      ),
    [structure, scopes],
  );

  return (
    <div ref={rootRef}>
      {groupedSections.map((group, groupIndex) => {
        const scope =
          scopeMap.get(group.scopeId) ??
          ({
            id: group.scopeId,
            name: "Fondo base",
            type: "none",
            visualMode: "color",
            color: "#ffffff",
            gradient: "linear-gradient(180deg,#ffffff 0%,#f8f8f8 100%)",
            heightVh: 1000,
          } as const);

        return (
          <ScopeBackground key={`${group.scopeId}-${groupIndex}`} scope={scope}>
            {group.sections.map((section) => (
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
          </ScopeBackground>
        );
      })}
    </div>
  );
}
