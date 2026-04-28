"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { LandingNav } from "@/modules/landing/components/landing-nav";
import {
  ensureLandingDefaults,
  LANDING_LAYOUT_FOOTER_BG_KEY,
  LANDING_LAYOUT_FOOTER_HEIGHT_KEY,
  LANDING_LAYOUT_FOOTER_TEXT_KEY,
  LANDING_LAYOUT_NAV_BG_KEY,
  LANDING_LAYOUT_NAV_HEIGHT_KEY,
  LANDING_LAYOUT_NAV_LOGO_ALT_KEY,
  LANDING_LAYOUT_NAV_LOGO_SRC_KEY,
  LANDING_LAYOUT_NAV_TEXT_KEY,
  LANDING_LAYOUT_PADDING_X_KEY,
  parseLandingLayoutNavLinks,
} from "@/modules/landing/config/landing-sections";
import type {
  LandingPreviewBindings,
  LandingResponsiveMode,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
import { createResponsiveScopedTextMap } from "@/modules/landing/types/landing-text";

type LandingPageLayoutProps = {
  textMap: LandingTextMap;
  previewViewportHeight?: number;
  children: React.ReactNode;
} & LandingPreviewBindings;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getLayoutPaddingX(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 24;
  }
  return clamp(parsed, 0, 400);
}

function getLayoutNavHeight(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 96;
  }
  return clamp(parsed, 64, 180);
}

function getLayoutFooterHeight(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 220;
  }
  return clamp(parsed, 120, 600);
}

export function LandingPageLayout({
  textMap,
  previewViewportHeight,
  previewMode,
  selectedLayoutSectionId,
  onSelectLayoutSection,
  onLayoutBodyPaddingXChange,
  onLayoutBodyPaddingXDragStateChange,
  responsiveMode,
  children,
}: LandingPageLayoutProps) {
  const completeMap = ensureLandingDefaults(textMap);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [rootWidth, setRootWidth] = useState(0);
  const effectiveResponsiveMode: LandingResponsiveMode = responsiveMode ?? "large";
  const responsiveMap = createResponsiveScopedTextMap(
    completeMap,
    effectiveResponsiveMode,
  );

  const layoutPaddingX = getLayoutPaddingX(
    responsiveMap[LANDING_LAYOUT_PADDING_X_KEY],
  );
  const navBackgroundColor = completeMap[LANDING_LAYOUT_NAV_BG_KEY] ?? "#ffffff";
  const navTextColor = completeMap[LANDING_LAYOUT_NAV_TEXT_KEY] ?? "#111111";
  const navHeight = getLayoutNavHeight(completeMap[LANDING_LAYOUT_NAV_HEIGHT_KEY]);
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
            fixed={!previewMode}
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
        {!previewMode ? <div style={{ minHeight: `${navHeight}px` }} /> : null}
        <div className="relative">
          {children}
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
