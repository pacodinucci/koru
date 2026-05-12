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
  LANDING_LAYOUT_FOOTER_CONTAINERS_LAYOUT_KEY,
  LANDING_LAYOUT_FOOTER_HEIGHT_KEY,
  LANDING_LAYOUT_FOOTER_TEXT_KEY,
  LANDING_LAYOUT_NAV_BG_KEY,
  LANDING_LAYOUT_NAV_HEIGHT_KEY,
  LANDING_LAYOUT_NAV_LOGO_ALT_KEY,
  LANDING_LAYOUT_NAV_LOGO_SRC_KEY,
  LANDING_LAYOUT_NAV_TEXT_KEY,
  LANDING_LAYOUT_PADDING_X_KEY,
  landingLayoutContainerRules,
  parseLandingLayoutNavLinks,
  type LayoutContainerArrangement,
} from "@/modules/landing/config/landing-sections";
import type {
  LandingPreviewBindings,
  LandingResponsiveMode,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
import {
  createResponsiveScopedTextMap,
  getResponsiveModeFromWidth,
} from "@/modules/landing/types/landing-text";

type LandingPageLayoutProps = {
  textMap: LandingTextMap;
  previewViewportHeight?: number;
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
  } | null;
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

function getLayoutContainerWidthKey(containerId: string) {
  return `__landing_layout_container_${containerId}_width`;
}

function getLayoutContainerHeightKey(containerId: string) {
  return `__landing_layout_container_${containerId}_height`;
}

function getLayoutContainerMarginXKey(containerId: string) {
  return `__landing_layout_container_${containerId}_margin_x`;
}

function getLayoutContainerMarginYKey(containerId: string) {
  return `__landing_layout_container_${containerId}_margin_y`;
}
function getLayoutContainerChildrenLayoutKey(containerId: string) {
  return `__landing_layout_container_${containerId}_children_layout`;
}

function getLayoutContainerPaddingXKey(containerId: string) {
  return `__landing_layout_nav_container_${containerId}_padding_x`;
}

function getLayoutContainerPaddingYKey(containerId: string) {
  return `__landing_layout_nav_container_${containerId}_padding_y`;
}

function getNumeric(raw: string | undefined, fallback = 0, max = 2000) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 0, max);
}

function getLayoutContainerArrangementValue(
  raw: string | undefined,
  fallback: LayoutContainerArrangement,
  allowed: readonly LayoutContainerArrangement[],
) {
  if (raw && allowed.includes(raw as LayoutContainerArrangement)) {
    return raw as LayoutContainerArrangement;
  }
  return fallback;
}

function getContainerChildrenLayoutMode(raw: string | undefined) {
  return getLayoutContainerArrangementValue(
    raw,
    "block",
    ["block", "flex-row", "flex-column", "grid-2"],
  );
}

type FooterContainerElementType =
  | "text"
  | "image"
  | "video"
  | "line-horizontal"
  | "line-vertical";

type FooterContainer = {
  id: string;
  name: string;
  parentId?: string | null;
};

type FooterContainerElement = {
  id: string;
  type: FooterContainerElementType;
  label: string;
};
type FooterContainerChildRef = {
  id: string;
  type: "element" | "container";
};

const LANDING_LAYOUT_FOOTER_CONTAINERS_KEY = "__landing_layout_footer_containers";
const LANDING_LAYOUT_FOOTER_ELEMENTS_KEY = "__landing_layout_footer_elements";
const LANDING_LAYOUT_FOOTER_CHILDREN_KEY = "__landing_layout_footer_children";

function getFooterContainerElementsKey(containerId: string) {
  return `${LANDING_LAYOUT_FOOTER_ELEMENTS_KEY}_${containerId}`;
}
function getFooterContainerChildrenKey(containerId: string) {
  return `${LANDING_LAYOUT_FOOTER_CHILDREN_KEY}_${containerId}`;
}

function getFooterElementValueKey(elementId: string) {
  return `__landing_layout_footer_element_${elementId}_value`;
}

function parseFooterContainers(textMap: LandingTextMap): FooterContainer[] {
  const raw = textMap[LANDING_LAYOUT_FOOTER_CONTAINERS_KEY];
  if (!raw) {
    return [{ id: "footer-text", name: "Texto footer" }];
  }
  try {
    const parsed = JSON.parse(raw) as FooterContainer[];
    const valid = parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        item.id.trim() !== "" &&
        typeof item.name === "string" &&
        (item.parentId == null || typeof item.parentId === "string"),
    );
    return valid.length > 0 ? valid : [{ id: "footer-text", name: "Texto footer" }];
  } catch {
    return [{ id: "footer-text", name: "Texto footer" }];
  }
}

function getFooterRootContainers(containers: FooterContainer[]) {
  return containers.filter(
    (container) =>
      container.parentId == null ||
      !containers.some((entry) => entry.id === container.parentId),
  );
}

function getFooterChildren(
  containers: FooterContainer[],
  parentId: string,
) {
  return containers.filter((container) => container.parentId === parentId);
}

function parseFooterContainerElements(
  textMap: LandingTextMap,
  containerId: string,
): FooterContainerElement[] {
  const raw = textMap[getFooterContainerElementsKey(containerId)];
  if (!raw) {
    return containerId === "footer-text"
      ? [{ id: "footer-text-default", type: "text", label: "Texto" }]
      : [];
  }
  try {
    const parsed = JSON.parse(raw) as FooterContainerElement[];
    const valid = parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.label === "string" &&
        (item.type === "text" ||
          item.type === "image" ||
          item.type === "video" ||
          item.type === "line-horizontal" ||
          item.type === "line-vertical"),
    );
    return valid;
  } catch {
    return [];
  }
}

function parseFooterContainerChildren(
  textMap: LandingTextMap,
  containerId: string,
  allContainers: FooterContainer[],
): FooterContainerChildRef[] {
  const raw = textMap[getFooterContainerChildrenKey(containerId)];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as FooterContainerChildRef[];
      const valid = parsed.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          (item.type === "element" || item.type === "container"),
      );
      if (valid.length > 0) {
        return valid;
      }
    } catch {
      // fallback below
    }
  }

  const legacyElements = parseFooterContainerElements(textMap, containerId).map(
    (item) => ({ id: item.id, type: "element" as const }),
  );
  const legacyContainers = allContainers
    .filter((container) => container.parentId === containerId)
    .map((item) => ({ id: item.id, type: "container" as const }));
  return [...legacyElements, ...legacyContainers];
}

export function LandingPageLayout({
  textMap,
  previewViewportHeight,
  user = null,
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
  const [measuredMode, setMeasuredMode] = useState<LandingResponsiveMode>("large");
  const effectiveResponsiveMode: LandingResponsiveMode =
    responsiveMode ?? measuredMode;
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
  const containerStyles = {
    "navbar-logo": {
      width: getNumeric(completeMap[getLayoutContainerWidthKey("navbar-logo")], 0, 1200),
      height: getNumeric(completeMap[getLayoutContainerHeightKey("navbar-logo")], 0, 600),
      paddingX: getNumeric(completeMap[getLayoutContainerPaddingXKey("navbar-logo")], 0, 300),
      paddingY: getNumeric(completeMap[getLayoutContainerPaddingYKey("navbar-logo")], 0, 300),
      marginX: getNumeric(completeMap[getLayoutContainerMarginXKey("navbar-logo")], 0, 300),
      marginY: getNumeric(completeMap[getLayoutContainerMarginYKey("navbar-logo")], 0, 300),
    },
    "navbar-nav-options": {
      width: getNumeric(completeMap[getLayoutContainerWidthKey("navbar-options")], 0, 1200),
      height: getNumeric(completeMap[getLayoutContainerHeightKey("navbar-options")], 0, 600),
      paddingX: getNumeric(completeMap[getLayoutContainerPaddingXKey("navbar-options")], 0, 300),
      paddingY: getNumeric(completeMap[getLayoutContainerPaddingYKey("navbar-options")], 0, 300),
      marginX: getNumeric(completeMap[getLayoutContainerMarginXKey("navbar-options")], 0, 300),
      marginY: getNumeric(completeMap[getLayoutContainerMarginYKey("navbar-options")], 0, 300),
    },
    "navbar-auth-slot": {
      width: 0,
      height: 0,
      paddingX: 0,
      paddingY: 0,
      marginX: 0,
      marginY: 0,
    },
  } as const;
  const footerBackgroundColor =
    completeMap[LANDING_LAYOUT_FOOTER_BG_KEY] ?? "#d8cfb6";
  const footerText = completeMap[LANDING_LAYOUT_FOOTER_TEXT_KEY] ?? "Koru OSA";
  const footerHeight = getLayoutFooterHeight(
    completeMap[LANDING_LAYOUT_FOOTER_HEIGHT_KEY],
  );
  const footerContainers = parseFooterContainers(completeMap);
  const footerRootContainers = getFooterRootContainers(footerContainers);
  const footerContainerArrangement = getLayoutContainerArrangementValue(
    completeMap[LANDING_LAYOUT_FOOTER_CONTAINERS_LAYOUT_KEY],
    landingLayoutContainerRules.footer.defaultArrangement,
    landingLayoutContainerRules.footer.allowedArrangements,
  );

  const renderFooterContainer = (container: FooterContainer): React.ReactNode => {
    const elements = parseFooterContainerElements(completeMap, container.id);
    const children = getFooterChildren(footerContainers, container.id);
    const childRefs = parseFooterContainerChildren(
      completeMap,
      container.id,
      footerContainers,
    );
    const childrenLayoutMode = getContainerChildrenLayoutMode(
      completeMap[getLayoutContainerChildrenLayoutKey(container.id)],
    );

    return (
      <div
        key={container.id}
        data-footer-container-id={container.id}
        className={
          previewMode && selectedLayoutSectionId === "layout-footer"
            ? "rounded-sm border-2 border-dashed border-[var(--complement-700)] px-2 py-1"
            : ""
        }
        style={{
          width:
            getNumeric(
              completeMap[getLayoutContainerWidthKey(container.id)],
              0,
              1200,
            ) > 0
              ? `${getNumeric(
                  completeMap[getLayoutContainerWidthKey(container.id)],
                  0,
                  1200,
                )}px`
              : undefined,
          minHeight:
            getNumeric(
              completeMap[getLayoutContainerHeightKey(container.id)],
              0,
              600,
            ) > 0
              ? `${getNumeric(
                  completeMap[getLayoutContainerHeightKey(container.id)],
                  0,
                  600,
                )}px`
              : undefined,
          paddingLeft: `${getNumeric(
            completeMap[getLayoutContainerPaddingXKey(container.id)],
            0,
            300,
          )}px`,
          paddingRight: `${getNumeric(
            completeMap[getLayoutContainerPaddingXKey(container.id)],
            0,
            300,
          )}px`,
          paddingTop: `${getNumeric(
            completeMap[getLayoutContainerPaddingYKey(container.id)],
            0,
            300,
          )}px`,
          paddingBottom: `${getNumeric(
            completeMap[getLayoutContainerPaddingYKey(container.id)],
            0,
            300,
          )}px`,
          marginLeft: `${getNumeric(
            completeMap[getLayoutContainerMarginXKey(container.id)],
            0,
            300,
          )}px`,
          marginRight: `${getNumeric(
            completeMap[getLayoutContainerMarginXKey(container.id)],
            0,
            300,
          )}px`,
          marginTop: `${getNumeric(
            completeMap[getLayoutContainerMarginYKey(container.id)],
            0,
            300,
          )}px`,
          marginBottom: `${getNumeric(
            completeMap[getLayoutContainerMarginYKey(container.id)],
            0,
            300,
          )}px`,
        }}
      >
        {elements.length === 0 && children.length === 0 ? <div className="min-h-8" /> : null}
        <div
          className={
            childrenLayoutMode === "grid-2"
              ? "grid w-full gap-2"
              : childrenLayoutMode === "flex-row"
                ? "flex w-full flex-row flex-wrap items-start gap-2"
                : childrenLayoutMode === "flex-column"
                  ? "flex w-full flex-col gap-2"
                  : "block w-full space-y-2"
          }
          style={
            childrenLayoutMode === "grid-2"
              ? {
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(180px, 100%), 1fr))",
                }
              : undefined
          }
        >
          {childRefs.map((childRef) => {
            if (childRef.type === "container") {
              const childContainer = children.find((entry) => entry.id === childRef.id);
              return childContainer ? renderFooterContainer(childContainer) : null;
            }
            const element = elements.find((entry) => entry.id === childRef.id);
            if (!element) {
              return null;
            }
            const isDefaultText =
              container.id === "footer-text" && element.id === "footer-text-default";
            const valueKey = isDefaultText
              ? LANDING_LAYOUT_FOOTER_TEXT_KEY
              : getFooterElementValueKey(element.id);
            const value = completeMap[valueKey] ?? "";

            if (element.type === "image") {
              return (
                <img
                  key={element.id}
                  src={value}
                  alt={element.label}
                  className="h-24 w-auto object-cover"
                />
              );
            }
            if (element.type === "video") {
              return (
                <video
                  key={element.id}
                  src={value}
                  className="h-24 w-auto"
                  controls={previewMode}
                />
              );
            }
            if (element.type === "line-horizontal") {
              return <div key={element.id} className="my-2 h-px w-full bg-slate-700" />;
            }
            if (element.type === "line-vertical") {
              return <div key={element.id} className="my-2 h-8 w-px bg-slate-700" />;
            }

            return (
              <p
                key={element.id}
                className="font-fira text-4xl font-semibold tracking-tight text-slate-800"
              >
                {value || footerText}
              </p>
            );
          })}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const update = () => {
      const nextWidth = root.clientWidth;
      setRootWidth(nextWidth);
      if (!responsiveMode && nextWidth > 0) {
        setMeasuredMode(getResponsiveModeFromWidth(nextWidth));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [responsiveMode]);

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
    ["--landing-nav-height" as string]: `${navHeight}px`,
    ...(previewMode && previewViewportHeight
      ? ({
          ["--landing-preview-vh" as string]: `${previewViewportHeight}px`,
        } as CSSProperties)
      : {}),
  };

  return (
    <div
      ref={rootRef}
      className="relative isolate min-h-screen overflow-hidden bg-white text-black"
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
        <div
          className="relative"
          data-preview-layout-section-id="layout-navbar"
        >
          <LandingNav
            backgroundColor={navBackgroundColor}
            textColor={navTextColor}
            heightPx={navHeight}
            logoSrc={navLogoSrc}
            logoAlt={navLogoAlt}
            links={navLinks}
            fixed={!previewMode}
            user={user}
            showContainerGuides={previewMode && selectedLayoutSectionId === "layout-navbar"}
            containerStyles={containerStyles}
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
        <div className="relative" data-preview-layout-section-id="layout-body">
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
          data-preview-layout-section-id="layout-footer"
          className="flex items-center border-t border-black/10"
          style={{
            backgroundColor: footerBackgroundColor,
            minHeight: `${footerHeight}px`,
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <div
            className={
              footerContainerArrangement === "grid-2"
                ? "grid w-full gap-2"
                : footerContainerArrangement === "flex-row"
                  ? "flex w-full flex-row flex-wrap items-start gap-2"
                  : footerContainerArrangement === "flex-column"
                    ? "flex w-full flex-col gap-2"
                    : "block w-full space-y-2"
            }
            style={
              footerContainerArrangement === "grid-2"
                ? {
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                  }
                : undefined
            }
          >
            {footerRootContainers.map((container) => renderFooterContainer(container))}
          </div>
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
