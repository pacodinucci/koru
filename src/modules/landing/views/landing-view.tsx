"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { SporeShape } from "@/components/spore-shape";
import { LandingNav } from "@/modules/landing/components/landing-nav";
import {
  parseLandingBackgroundScopes,
  ensureLandingDefaults,
  parseLandingStructure,
  LANDING_LAYOUT_PADDING_X_KEY,
  LANDING_LAYOUT_FOOTER_BG_KEY,
  LANDING_LAYOUT_FOOTER_HEIGHT_KEY,
  LANDING_LAYOUT_FOOTER_TEXT_KEY,
  LANDING_LAYOUT_NAV_BG_KEY,
  LANDING_LAYOUT_NAV_HEIGHT_KEY,
  LANDING_LAYOUT_NAV_LOGO_ALT_KEY,
  LANDING_LAYOUT_NAV_LOGO_SRC_KEY,
  LANDING_LAYOUT_NAV_TEXT_KEY,
  parseLandingLayoutNavLinks,
  type LandingBackgroundScope,
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
import { SporeFeatureStackSection } from "@/modules/landing/views/sections/spore-feature-stack-section";
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

type ScopedSectionGroup = {
  scopeId: string;
  sections: LandingSectionInstance[];
};

function getLayoutPaddingX(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 24;
  }
  return Math.min(400, Math.max(0, parsed));
}

function getLayoutNavHeight(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 96;
  }
  return Math.min(180, Math.max(64, parsed));
}

function getLayoutFooterHeight(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 220;
  }
  return Math.min(600, Math.max(120, parsed));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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
  previewViewportHeight,
  previewMode,
  selectedFieldId,
  onSelectField,
  selectedLayoutSectionId,
  onSelectLayoutSection,
  onLayoutBodyPaddingXChange,
  onLayoutBodyPaddingXDragStateChange,
  responsiveMode,
  onMoveSectionExtraPosition,
}: LandingViewProps) {
  const completeMap = ensureLandingDefaults(textMap);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [rootWidth, setRootWidth] = useState(0);
  const effectiveResponsiveMode: LandingResponsiveMode =
    responsiveMode ??
    getResponsiveModeFromWidth(rootWidth > 0 ? rootWidth : 1440);

  const responsiveMap = createResponsiveScopedTextMap(
    completeMap,
    effectiveResponsiveMode,
  );
  const layoutPaddingX = getLayoutPaddingX(
    responsiveMap[LANDING_LAYOUT_PADDING_X_KEY],
  );
  const scopes = parseLandingBackgroundScopes(completeMap);
  const scopeMap = new Map(scopes.map((scope) => [scope.id, scope]));
  const structure = parseLandingStructure(completeMap).filter(
    (section) => section.type !== "footer",
  );
  const groupedSections = groupSectionsByScope(
    structure,
    scopes.map((scope) => scope.id),
  );
  const navBackgroundColor =
    completeMap[LANDING_LAYOUT_NAV_BG_KEY] ?? "#ffffff";
  const navTextColor = completeMap[LANDING_LAYOUT_NAV_TEXT_KEY] ?? "#111111";
  const navHeight = getLayoutNavHeight(
    completeMap[LANDING_LAYOUT_NAV_HEIGHT_KEY],
  );
  const navLogoSrc =
    completeMap[LANDING_LAYOUT_NAV_LOGO_SRC_KEY] ?? "/branding/koru-logo.png";
  const navLogoAlt = completeMap[LANDING_LAYOUT_NAV_LOGO_ALT_KEY] ?? "Koru";
  const navLinks = parseLandingLayoutNavLinks(completeMap).map((item) => ({
    label: item.label,
    href: item.href,
  }));
  const footerBackgroundColor =
    completeMap[LANDING_LAYOUT_FOOTER_BG_KEY] ?? "#d8cfb6";
  const footerText = completeMap[LANDING_LAYOUT_FOOTER_TEXT_KEY] ?? "Koru OSA";
  const footerHeight = getLayoutFooterHeight(
    completeMap[LANDING_LAYOUT_FOOTER_HEIGHT_KEY],
  );
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

  const handlePaddingGuidePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (!previewMode || !onLayoutBodyPaddingXChange) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    event.preventDefault();
    onSelectLayoutSection?.("layout-body");
    onLayoutBodyPaddingXDragStateChange?.(true);

    const updateFromPointer = (clientX: number) => {
      const rect = root.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }

      const normalizedX = clamp((clientX - rect.left) / rect.width, 0, 1);
      const measuredWidth = rootWidth > 0 ? rootWidth : rect.width;
      const nextPadding = Math.round(
        clamp(
          Math.min(
            normalizedX * measuredWidth,
            (1 - normalizedX) * measuredWidth,
          ),
          0,
          400,
        ),
      );

      onLayoutBodyPaddingXChange(nextPadding);
    };
    updateFromPointer(event.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateFromPointer(moveEvent.clientX);
    };

    const stopDragging = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      onLayoutBodyPaddingXDragStateChange?.(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging, { once: true });
    window.addEventListener("pointercancel", stopDragging, { once: true });
  };
  const previewRootStyle: CSSProperties = {
    ["--landing-body-padding-x" as string]: `${layoutPaddingX}px`,
    ...(previewMode && previewViewportHeight
      ? ({
          ["--landing-preview-vh" as string]: `${previewViewportHeight}px`,
        } as CSSProperties)
      : {}),
  };

  return (
    <div
      ref={rootRef}
      className="relative isolate min-h-screen overflow-hidden bg-[#f4efe5] text-black"
      data-landing-preview={previewMode ? "true" : undefined}
      style={previewRootStyle}
    >
      {previewMode ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[2]">
          <div
            className="absolute border-l border-dashed border-amber-600"
            style={{
              left: `${layoutPaddingX}px`,
              top: `${navHeight}px`,
              bottom: `${footerHeight}px`,
            }}
          />
          <div
            className="absolute border-r border-dashed border-amber-600"
            style={{
              right: `${layoutPaddingX}px`,
              top: `${navHeight}px`,
              bottom: `${footerHeight}px`,
            }}
          />
        </div>
      ) : null}
      {previewMode && onLayoutBodyPaddingXChange ? (
        <>
          <button
            type="button"
            className="absolute z-[4] -translate-x-1/2 bg-transparent"
            style={{
              left: `${layoutPaddingX}px`,
              top: `${navHeight}px`,
              bottom: `${footerHeight}px`,
              width: "12px",
              cursor: "ew-resize",
            }}
            onPointerDown={handlePaddingGuidePointerDown}
            aria-label="Arrastrar linea izquierda del padding del body"
          />
          <button
            type="button"
            className="absolute z-[4] -translate-x-1/2 bg-transparent"
            style={{
              left: `calc(100% - ${layoutPaddingX}px)`,
              top: `${navHeight}px`,
              bottom: `${footerHeight}px`,
              width: "12px",
              cursor: "ew-resize",
            }}
            onPointerDown={handlePaddingGuidePointerDown}
            aria-label="Arrastrar linea derecha del padding del body"
          />
        </>
      ) : null}
      <div className="relative z-[1]">
        <div className="relative">
          <LandingNav
            backgroundColor={navBackgroundColor}
            textColor={navTextColor}
            heightPx={navHeight}
            logoSrc={navLogoSrc}
            logoAlt={navLogoAlt}
            links={navLinks}
          />
          {previewMode && onSelectLayoutSection ? (
            <button
              type="button"
              className="absolute inset-0 z-[3] bg-transparent"
              style={{
                outline:
                  selectedLayoutSectionId === "layout-navbar"
                    ? "2px dashed #334155"
                    : "none",
                outlineOffset: "-2px",
              }}
              onClick={() => onSelectLayoutSection("layout-navbar")}
              aria-label="Seleccionar navbar del layout"
            />
          ) : null}
        </div>
        <div className="relative">
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
              <ScopeBackground
                key={`${group.scopeId}-${groupIndex}`}
                scope={scope}
              >
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
          {previewMode && onSelectLayoutSection ? (
            <button
              type="button"
              className="absolute inset-0 z-[3] bg-transparent"
              style={{
                outline:
                  selectedLayoutSectionId === "layout-body"
                    ? "2px dashed #334155"
                    : "none",
                outlineOffset: "-2px",
              }}
              onClick={() => onSelectLayoutSection("layout-body")}
              aria-label="Seleccionar body del layout"
            />
          ) : null}
        </div>
        <footer
          className="flex items-center border-t border-black/10"
          style={{
            backgroundColor: footerBackgroundColor,
            minHeight: `${footerHeight}px`,
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <p className="font-fira text-4xl font-semibold tracking-tight text-slate-800">
            {footerText}
          </p>
        </footer>
        {previewMode && onSelectLayoutSection ? (
          <button
            type="button"
            className="absolute left-0 right-0 z-[3] bg-transparent"
            style={{
              bottom: 0,
              height: `${footerHeight}px`,
              outline:
                selectedLayoutSectionId === "layout-footer"
                  ? "2px dashed #334155"
                  : "none",
              outlineOffset: "-2px",
            }}
            onClick={() => onSelectLayoutSection("layout-footer")}
            aria-label="Seleccionar footer del layout"
          />
        ) : null}
      </div>
    </div>
  );
}
