"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  ChevronsRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Trash2,
  Minus,
  Plus,
  RotateCcw,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Pencil,
  Rows3,
  Columns3,
  Grid2x2,
  Square,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDashboardEditorPanel } from "@/modules/dashboard/components/dashboard-editor-panel";
import { CmsPreviewFrame } from "@/modules/dashboard/components/cms-preview-frame";
import {
  LANDING_BACKGROUND_SCOPES_KEY,
  LANDING_LAYOUT_FOOTER_BG_KEY,
  LANDING_LAYOUT_FOOTER_CONTAINERS_LAYOUT_KEY,
  LANDING_LAYOUT_FOOTER_HEIGHT_KEY,
  LANDING_LAYOUT_FOOTER_TEXT_KEY,
  LANDING_LAYOUT_NAV_BG_KEY,
  LANDING_LAYOUT_NAV_HEIGHT_KEY,
  LANDING_LAYOUT_NAV_LINKS_KEY,
  LANDING_LAYOUT_NAV_LOGO_ALT_KEY,
  LANDING_LAYOUT_NAV_LOGO_SRC_KEY,
  LANDING_LAYOUT_NAV_TEXT_KEY,
  LANDING_LAYOUT_PADDING_X_KEY,
  LANDING_STRUCTURE_KEY,
  parseLandingLayoutNavLinks,
  parseLandingBackgroundScopes,
  ensureLandingDefaults,
  getSectionBackgroundColorKey,
  getSectionBackgroundGradientKey,
  getSectionBackgroundImageKey,
  getSectionBackgroundModeKey,
  getSectionBackgroundPositionXKey,
  getSectionBackgroundPositionYKey,
  getSectionBackgroundZoomKey,
  getSectionBorderColorKey,
  getSectionBorderRadiusKey,
  getSectionBorderStyleKey,
  getSectionBorderWidthKey,
  getSectionGalleryCaptionContainerBackgroundKey,
  getSectionGalleryCaptionContainerOpacityKey,
  getSectionGalleryCaptionContainerPaddingXKey,
  getSectionGalleryCaptionContainerPaddingYKey,
  getSectionGalleryAutoplaySecondsKey,
  getSectionGalleryGridImageShapeKey,
  getSectionGalleryItemCaptionModeKey,
  getSectionGalleryItemImageKey,
  getSectionGalleryItemSubtitleKey,
  getSectionGalleryVariantKey,
  getSectionExtraTextKey,
  getSectionExtraPositionXKey,
  getSectionExtraPositionYKey,
  getSectionExtraResponsivePositionXKey,
  getSectionExtraResponsivePositionYKey,
  getSectionExtrasKey,
  getSectionFieldKey,
  getSectionFooterHeightKey,
  getSectionImageGridColumnsKey,
  getSectionImageGridImageSizeKey,
  getSectionImageGridItemsCountKey,
  getSectionImageGridUseBodyPaddingKey,
  getSectionFooterMinHeightKey,
  getSectionItemsOrderKey,
  landingLayoutContainerRules,
  landingSectionCatalog,
  parseSectionExtraElements,
  parseSectionItemsOrder,
  parseLandingStructure,
  type LandingBackgroundScope,
  type LandingSectionInstance,
  type SectionExtraElementType,
  type LandingSectionType,
  type LayoutContainerArrangement,
} from "@/modules/landing/config/landing-sections";
import {
  createResponsiveScopedTextMap,
  getResponsiveFieldStorageKey,
  getLandingFieldBackgroundColorKey,
  getLandingFieldBorderColorKey,
  getLandingFieldBorderRadiusKey,
  getLandingFieldBorderStyleKey,
  getLandingFieldBorderWidthKey,
  getLandingFieldButtonVariantKey,
  getLandingFieldColorKey,
  getLandingFieldFontFamilyKey,
  getLandingFieldLetterSpacingKey,
  getLandingFieldLineWidthKey,
  getLandingFieldLineHeightKey,
  getLandingFieldFontWeightKey,
  getLandingFieldMarginKey,
  getLandingFieldMarginLeftKey,
  getLandingFieldMarginModeKey,
  getLandingFieldMarginRightKey,
  getLandingFieldMarginTopKey,
  getLandingFieldMarginBottomKey,
  getLandingFieldMarginXKey,
  getLandingFieldMarginYKey,
  getLandingFieldPaddingKey,
  getLandingFieldPaddingBottomKey,
  getLandingFieldPaddingLeftKey,
  getLandingFieldPaddingModeKey,
  getLandingFieldPaddingRightKey,
  getLandingFieldPaddingTopKey,
  getLandingFieldPaddingXKey,
  getLandingFieldPaddingYKey,
  isExplicitResponsiveOverrideKey,
  isResponsiveScopedFieldId,
  getLandingFieldSizeKey,
  getLandingFieldResponsiveSizeKey,
  type LandingResponsiveMode,
  type SpacingMode,
} from "@/modules/landing/types/landing-text";
import {
  publishCmsAction,
  publishCmsPageAction,
} from "@/modules/cms/server/cms-text.actions";
import { LandingView } from "@/modules/landing/views/landing-view";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";

type LandingTextMap = Record<string, string>;

type CmsLandingEditorProps = {
  initialTextMap: LandingTextMap;
  pageSlug?: string;
  previewUrl?: string;
  frameVariant?: "default" | "flush";
  editorMode?: "layout" | "page";
};

type SectionItem = {
  id: string;
  label: string;
  textKey: string;
  kind: "base" | "extra";
  extraId?: string;
};

type LayoutSectionId = "layout-navbar" | "layout-body" | "layout-footer";

function createSectionId(type: LandingSectionType) {
  return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function createBackgroundScopeId() {
  return `scope-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getTypeDefaults(type: LandingSectionType) {
  return landingSectionCatalog[type];
}

function getExtraDefaults(type: SectionExtraElementType) {
  switch (type) {
    case "title":
      return {
        text: "Nuevo titulo",
        size: 34,
        multiline: false,
        label: "Titulo",
      };
    case "button":
      return {
        text: "Nuevo boton",
        size: 14,
        multiline: false,
        label: "Boton",
      };
    case "image":
      return {
        text: "/assets/img1.jpg",
        size: 320,
        multiline: false,
        label: "Imagen",
      };
    case "line-vertical":
      return {
        text: "",
        size: 120,
        multiline: false,
        label: "Linea vertical",
      };
    case "line-horizontal":
      return {
        text: "",
        size: 240,
        multiline: false,
        label: "Linea horizontal",
      };
    case "text":
    default:
      return { text: "Nuevo texto", size: 18, multiline: true, label: "Texto" };
  }
}

function getSpacingModeValue(raw: string | undefined): SpacingMode {
  if (raw === "axis" || raw === "sides") {
    return raw;
  }

  return "all";
}

function getSectionBackgroundModeValue(
  raw: string | undefined,
  image: string | undefined,
  color: string | undefined,
  gradient: string | undefined,
) {
  if (raw === "image" || raw === "color" || raw === "gradient") {
    return raw;
  }

  if ((image ?? "").trim()) {
    return "image";
  }
  if ((gradient ?? "").trim()) {
    return "gradient";
  }
  if ((color ?? "").trim()) {
    return "color";
  }

  return "color";
}

function getSectionBorderStyleValue(raw: string | undefined) {
  if (raw === "dashed" || raw === "dotted" || raw === "none") {
    return raw;
  }

  return "solid";
}

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

function createLayoutNavLinkId() {
  return `nav-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

type FooterContainerElementType =
  | "text"
  | "image"
  | "video"
  | "line-horizontal"
  | "line-vertical";

type FooterContainerElement = {
  id: string;
  type: FooterContainerElementType;
  label: string;
};
type FooterContainerChildRef = {
  id: string;
  type: "element" | "container";
};

const LANDING_LAYOUT_FOOTER_ELEMENTS_KEY = "__landing_layout_footer_elements";
const LANDING_LAYOUT_FOOTER_CONTAINERS_KEY = "__landing_layout_footer_containers";
const LANDING_LAYOUT_FOOTER_CHILDREN_KEY = "__landing_layout_footer_children";

type FooterContainer = {
  id: string;
  name: string;
  parentId?: string | null;
};

function getFooterElementValueKey(elementId: string) {
  return `__landing_layout_footer_element_${elementId}_value`;
}

function getFooterContainerElementsKey(containerId: string) {
  return `${LANDING_LAYOUT_FOOTER_ELEMENTS_KEY}_${containerId}`;
}
function getFooterContainerChildrenKey(containerId: string) {
  return `${LANDING_LAYOUT_FOOTER_CHILDREN_KEY}_${containerId}`;
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
    return valid.length > 0
      ? valid
      : [{ id: "footer-text", name: "Texto footer" }];
  } catch {
    return [{ id: "footer-text", name: "Texto footer" }];
  }
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
    return valid.length > 0
      ? valid
      : containerId === "footer-text"
        ? [{ id: "footer-text-default", type: "text", label: "Texto" }]
        : [];
  } catch {
    return containerId === "footer-text"
      ? [{ id: "footer-text-default", type: "text", label: "Texto" }]
      : [];
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

function getFooterElementDefaultValue(type: FooterContainerElementType) {
  switch (type) {
    case "image":
      return "/assets/img1.jpg";
    case "video":
      return "/assets/vid1.mp4";
    case "line-horizontal":
    case "line-vertical":
      return "1";
    case "text":
    default:
      return "Koru OSA";
  }
}

function getFooterElementLabel(type: FooterContainerElementType, index: number) {
  switch (type) {
    case "image":
      return `Imagen ${index}`;
    case "video":
      return `Video ${index}`;
    case "line-horizontal":
      return `Linea horizontal ${index}`;
    case "line-vertical":
      return `Linea vertical ${index}`;
    case "text":
    default:
      return `Texto ${index}`;
  }
}

function getLayoutNavContainerNameKey(containerId: string) {
  return `__landing_layout_nav_container_${containerId}_name`;
}

function getLayoutNavContainerPaddingXKey(containerId: string) {
  return `__landing_layout_nav_container_${containerId}_padding_x`;
}

function getLayoutNavContainerPaddingYKey(containerId: string) {
  return `__landing_layout_nav_container_${containerId}_padding_y`;
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

function getNumberValue(
  raw: string | undefined,
  fallback: number,
  min = 0,
  max = 120,
) {
  const parsed = Number.parseFloat(raw ?? "");
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
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

function getContainerLayoutOptions() {
  return [
    {
      value: "block",
      label: <Square className="h-4 w-4" />,
      srLabel: "Block",
    },
    {
      value: "flex-row",
      label: <Columns3 className="h-4 w-4" />,
      srLabel: "Flex fila",
    },
    {
      value: "flex-column",
      label: <Rows3 className="h-4 w-4" />,
      srLabel: "Flex columna",
    },
    {
      value: "grid-2",
      label: <Grid2x2 className="h-4 w-4" />,
      srLabel: "Grid 2 columnas",
    },
  ] as const;
}

function getSectionEstimatedHeightVh(type: LandingSectionType) {
  switch (type) {
    case "editorial-feature":
      return 170;
    case "spore-stack":
      return 200;
    case "image-grid":
      return 140;
    case "footer":
      return 60;
    default:
      return 100;
  }
}

function getVideoSectionHeightVh(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 100;
  }
  return clamp(parsed, 40, 300);
}

function getSectionEstimatedHeightVhForSection(
  section: LandingSectionInstance,
  textMap: LandingTextMap,
) {
  if (section.type === "video") {
    return getVideoSectionHeightVh(
      textMap[getSectionFieldKey(section.id, "__section_height")] ??
        textMap[getSectionFieldKey(section.id, "__video_height")],
    );
  }

  return getSectionEstimatedHeightVh(section.type);
}

type SliderValueControlProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

type PanelRangeInputProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
};

type PanelRadioGroupOption = {
  value: string;
  label: ReactNode;
  srLabel?: string;
};

type PanelRadioGroupProps = {
  name: string;
  value: string;
  options: PanelRadioGroupOption[];
  onChange: (value: string) => void;
  orientation?: "row" | "column";
  className?: string;
};

type PanelColorControlProps = {
  value: string | undefined;
  defaultValue: string;
  placeholder?: string;
  onChange: (value: string) => void;
  palette?: readonly string[];
  colorInputClassName?: string;
  showPaletteLabel?: boolean;
  includeTransparentOption?: boolean;
};

function PanelRangeInput({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className,
}: PanelRangeInputProps) {
  const safeValue = Number.isFinite(value) ? clamp(value, min, max) : min;
  const range = max - min;
  const progress = range > 0 ? ((safeValue - min) / range) * 100 : 0;
  const decimals = Number.isInteger(step)
    ? 0
    : (step.toString().split(".")[1]?.length ?? 0);

  const handleAdjust = (direction: -1 | 1) => {
    const next = clamp(safeValue + direction * step, min, max);
    onChange(Number(next.toFixed(decimals)));
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[26px_1fr_26px] items-center gap-2",
        className,
      )}
    >
      <button
        type="button"
        className="panel-range-stepper"
        onClick={() => handleAdjust(-1)}
        aria-label="Disminuir valor"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        className="panel-range-input"
        style={{ "--panel-range-progress": `${progress}%` } as CSSProperties}
        onChange={(event) =>
          onChange(clamp(Number.parseFloat(event.target.value), min, max))
        }
      />
      <button
        type="button"
        className="panel-range-stepper"
        onClick={() => handleAdjust(1)}
        aria-label="Aumentar valor"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PanelRadioGroup({
  name,
  value,
  options,
  onChange,
  orientation = "row",
  className,
}: PanelRadioGroupProps) {
  return (
    <div
      className={cn(
        "flex rounded-md border bg-background px-3 py-2",
        orientation === "row"
          ? "flex-wrap items-center gap-3"
          : "flex-col items-start gap-2",
        className,
      )}
      role="radiogroup"
      aria-label={name}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="inline-flex cursor-pointer items-center gap-2 text-xs"
          title={option.srLabel}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-400 bg-slate-300/80 transition-colors peer-checked:border-[var(--complement-700)] peer-checked:bg-slate-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--complement-700)]">
            <span className="h-2.5 w-2.5 rounded-full bg-transparent transition-colors peer-checked:bg-[var(--complement-700)]" />
          </span>
          <span className="font-medium text-foreground/90">{option.label}</span>
          {option.srLabel ? (
            <span className="sr-only">{option.srLabel}</span>
          ) : null}
        </label>
      ))}
    </div>
  );
}

function PanelColorControl({
  value,
  defaultValue,
  placeholder,
  onChange,
  palette = BRAND_COMPLEMENT_COLOR_OPTIONS,
  colorInputClassName,
  showPaletteLabel = true,
  includeTransparentOption = false,
}: PanelColorControlProps) {
  const normalized = (value ?? "").trim();
  const validHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)
    ? normalized
    : defaultValue;
  const effectivePalette = includeTransparentOption
    ? (["transparent", ...palette] as const)
    : palette;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="color"
          className={cn("h-10 w-14 p-1", colorInputClassName)}
          value={validHex}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          value={value ?? ""}
          placeholder={placeholder ?? defaultValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        {showPaletteLabel ? (
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Brand y Complement
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {effectivePalette.map((color) => {
            const isActive = normalized.toLowerCase() === color.toLowerCase();
            const isTransparent = color === "transparent";

            return (
              <button
                key={color}
                type="button"
                aria-label={
                  isTransparent ? "Color transparente" : `Color ${color}`
                }
                className={cn(
                  "rounded-sm border border-black/30",
                  isActive && "ring-2 ring-primary ring-offset-1",
                )}
                style={{
                  backgroundColor: isTransparent ? "transparent" : color,
                  backgroundImage: isTransparent
                    ? "linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%, #d1d5db), linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%, #d1d5db)"
                    : undefined,
                  backgroundPosition: isTransparent
                    ? "0 0, 4px 4px"
                    : undefined,
                  backgroundSize: isTransparent ? "8px 8px" : undefined,
                  width: "18px",
                  height: "18px",
                  minWidth: "18px",
                  display: "inline-block",
                }}
                title={isTransparent ? "Transparente" : color}
                onClick={() => onChange(color)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SliderValueControl({
  label,
  value,
  min = 0,
  max = 120,
  step = 1,
  onChange,
}: SliderValueControlProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="grid grid-cols-[1fr_72px] gap-2">
        <PanelRangeInput
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
        />
        <div className="flex h-9 items-center justify-center rounded-md border bg-muted/30 text-xs font-medium tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function PanelInput(props: React.ComponentProps<typeof CustomInputField>) {
  return (
    <CustomInputField
      wrapperClassName="space-y-0"
      inputContainerClassName="border border-input bg-background"
      className="h-9 px-2.5 text-sm"
      {...props}
    />
  );
}

function getSectionBackgroundZoomValue(raw: string | undefined) {
  const parsed = Number.parseFloat(raw ?? "");
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return clamp(parsed, 1, 3);
}

function getSectionBackgroundPositionValue(raw: string | undefined) {
  const parsed = Number.parseFloat(raw ?? "");
  if (!Number.isFinite(parsed)) {
    return 50;
  }
  return clamp(parsed, 0, 100);
}

function getGalleryVariantValue(raw: string | undefined) {
  if (raw === "carousel" || raw === "stacked" || raw === "editorial") {
    return raw;
  }
  return "grid";
}

function getGalleryAutoplaySecondsValue(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return clamp(parsed, 0, 10);
}

function getGalleryCaptionModeValue(raw: string | undefined) {
  if (raw === "none" || raw === "title-subtitle") {
    return raw;
  }
  return "title";
}

function getGalleryCaptionContainerOpacityValue(
  rawOpacity: string | undefined,
  rawBackgroundMode: string | undefined,
) {
  const parsed = Number.parseInt(rawOpacity ?? "", 10);
  if (Number.isFinite(parsed)) {
    return clamp(parsed, 0, 100);
  }
  if (rawBackgroundMode === "off") {
    return 0;
  }
  return 80;
}

function getGalleryCaptionContainerPaddingValue(
  raw: string | undefined,
  fallback: number,
) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, 0, 80);
}

function getGalleryGridImageShapeValue(raw: string | undefined) {
  if (raw === "square" || raw === "portrait" || raw === "landscape") {
    return raw;
  }
  return "landscape";
}

function getSectionVideoTextItemsKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__video_text_items");
}

function getSectionVideoTextFieldKey(
  sectionId: string,
  textId: string,
  field:
    | "content"
    | "size"
    | "color"
    | "weight"
    | "align"
    | "position_x"
    | "position_y",
) {
  return getSectionFieldKey(sectionId, `__video_text_${textId}_${field}`);
}

function parseSectionVideoTextItems(
  textMap: LandingTextMap,
  sectionId: string,
) {
  const raw = textMap[getSectionVideoTextItemsKey(sectionId)];
  if (!raw) {
    return [] as string[];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }
    return parsed.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [] as string[];
  }
}

const PREVIEW_ZOOM_MIN = 30;
const PREVIEW_ZOOM_MAX = 200;
const PREVIEW_ZOOM_STEP = 10;
const PREVIEW_ZOOM_DEFAULT = 100;
const PREVIEW_ZOOM_BASE_SCALE = 0.62;
const PREVIEW_CANVAS_WIDTH: Record<LandingResponsiveMode, number> = {
  large: 1440,
  medium: 1200,
  tablet: 834,
  mobile: 390,
};
const VIDEO_ASSET_OPTIONS = [
  "/assets/vid1.mp4",
  "/assets/vid2.mp4",
  "/assets/vid3.mp4",
  "/assets/vid4.mp4",
  "/assets/vid5.mp4",
  "/assets/vid6.mp4",
] as const;
const BRAND_COLOR_OPTIONS = [
  "#1a1330", // brand-900
  "#2a1d4d", // brand-800
  "#3b2a66", // brand-700
  "#5a3e99", // brand-600
  "#7c63c9", // brand-500
  "#cfc4f3", // brand-300
];

const COMPLEMENT_COLOR_OPTIONS = [
  "#343c11", // complement-900
  "#56660c", // complement-800
  "#a8bb55", // complement-700
  "#d6e68e", // complement-600
  "#f5ffc9", // complement-500
  "#f8ffd8", // complement-300
] as const;

const BRAND_COMPLEMENT_COLOR_OPTIONS = [
  ...BRAND_COLOR_OPTIONS,
  ...COMPLEMENT_COLOR_OPTIONS,
] as const;
const RESPONSIVE_MODES: LandingResponsiveMode[] = [
  "large",
  "medium",
  "tablet",
  "mobile",
];

export function CmsLandingEditor({
  initialTextMap,
  pageSlug = "/",
  previewUrl,
  frameVariant = "default",
  editorMode = "page",
}: CmsLandingEditorProps) {
  const initialStructure = parseLandingStructure(initialTextMap).filter(
    (section) => section.type !== "footer",
  );
  const initialBackgroundScopes = parseLandingBackgroundScopes(initialTextMap);
  const [rawTextMap, setTextMap] = useState<LandingTextMap>(() =>
    ensureLandingDefaults(initialTextMap),
  );
  const [backgroundScopes, setBackgroundScopes] = useState<
    LandingBackgroundScope[]
  >(initialBackgroundScopes);
  const [structure, setStructure] =
    useState<LandingSectionInstance[]>(initialStructure);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialStructure[0]?.id ?? null,
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [newSectionType, setNewSectionType] =
    useState<LandingSectionType>("hero");
  const [selectedLayoutSectionId, setSelectedLayoutSectionId] =
    useState<LayoutSectionId>("layout-body");
  const [newSectionScopeId, setNewSectionScopeId] = useState<string | null>(
    initialStructure[0]?.scopeId ?? initialBackgroundScopes[0]?.id ?? null,
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isSectionSettingsView, setIsSectionSettingsView] = useState(false);
  const [editingBackgroundScopeId, setEditingBackgroundScopeId] = useState<
    string | null
  >(null);
  const [openPanelAccordionId, setOpenPanelAccordionId] = useState<
    string | null
  >(null);
  const [dragOverScopeId, setDragOverScopeId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(
    null,
  );
  const [previewZoom, setPreviewZoom] = useState(PREVIEW_ZOOM_DEFAULT);
  const [responsiveEditMode, setResponsiveEditMode] =
    useState<LandingResponsiveMode>("large");
  const [previewViewportHeight, setPreviewViewportHeight] = useState(0);
  const [isDraggingLayoutBodyPadding, setIsDraggingLayoutBodyPadding] =
    useState(false);
  const [editingLayoutContainerId, setEditingLayoutContainerId] = useState<
    string | null
  >(null);
  const nextFooterElementIdRef = useRef(1);
  const { open: sidebarOpen } = useSidebar();
  const {
    open: panelOpen,
    setOpen: setPanelOpen,
    portalTarget,
  } = useDashboardEditorPanel();
  const compactPreviewSpacing = sidebarOpen && panelOpen;
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const panelRootRef = useRef<HTMLDivElement | null>(null);
  const panelBodyScrollRef = useRef<HTMLDivElement | null>(null);
  const draggedScopeIdRef = useRef<string | null>(null);
  const draggedSectionIdRef = useRef<string | null>(null);
  const nextExtraIdRef = useRef(1);
  const nextVideoTextIdRef = useRef(1);
  const effectivePreviewScale = (previewZoom / 100) * PREVIEW_ZOOM_BASE_SCALE;
  const previewViewportHeightForContent =
    previewViewportHeight > 0 && effectivePreviewScale > 0
      ? previewViewportHeight / effectivePreviewScale
      : undefined;
  const previewCanvasWidth = PREVIEW_CANVAS_WIDTH[responsiveEditMode];
  const previewRulerMarks = useMemo(
    () => Array.from({ length: 101 }, (_, i) => i),
    [],
  );
  const previewCanvasDisplayWidth = previewCanvasWidth * effectivePreviewScale;
  const fallbackScopeId = backgroundScopes[0]?.id ?? "scope-default";
  const textMap = useMemo<LandingTextMap>(
    () => createResponsiveScopedTextMap(rawTextMap, responsiveEditMode),
    [rawTextMap, responsiveEditMode],
  );
  const sectionHeightsByScope = useMemo(() => {
    const map = new Map<string, number>();
    for (const section of structure) {
      const scopeId = section.scopeId ?? fallbackScopeId;
      map.set(
        scopeId,
        (map.get(scopeId) ?? 0) +
          getSectionEstimatedHeightVhForSection(section, textMap),
      );
    }
    return map;
  }, [structure, fallbackScopeId, textMap]);
  const sectionBuckets = useMemo(
    () =>
      backgroundScopes.map((scope) => ({
        scope,
        sections: structure.filter(
          (section) => (section.scopeId ?? fallbackScopeId) === scope.id,
        ),
      })),
    [backgroundScopes, structure, fallbackScopeId],
  );
  const sectionsInRenderOrder = useMemo(
    () => sectionBuckets.flatMap((bucket) => bucket.sections),
    [sectionBuckets],
  );

  function clampPreviewZoom(value: number) {
    return clamp(value, PREVIEW_ZOOM_MIN, PREVIEW_ZOOM_MAX);
  }

  function applyPreviewZoom(value: number) {
    setPreviewZoom(clampPreviewZoom(Math.round(value)));
  }

  function handlePreviewZoomIn() {
    applyPreviewZoom(previewZoom + PREVIEW_ZOOM_STEP);
  }

  function handlePreviewZoomOut() {
    applyPreviewZoom(previewZoom - PREVIEW_ZOOM_STEP);
  }

  function handlePreviewZoomReset() {
    applyPreviewZoom(100);
  }

  function setDraggedScope(scopeId: string | null) {
    draggedScopeIdRef.current = scopeId;
  }

  function setDraggedSection(sectionId: string | null) {
    draggedSectionIdRef.current = sectionId;
  }

  function readDragPayload(
    transfer: DataTransfer,
  ): { type: "scope" | "section"; id: string } | null {
    const raw = transfer.getData("application/x-koru-dnd");
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as { type?: string; id?: string };
      if (
        (parsed.type === "scope" || parsed.type === "section") &&
        typeof parsed.id === "string" &&
        parsed.id.length > 0
      ) {
        return { type: parsed.type, id: parsed.id };
      }
    } catch {
      return null;
    }
    return null;
  }

  useEffect(() => {
    const container = previewScrollRef.current;
    if (!container) {
      return;
    }

    const updateViewportHeight = () => {
      setPreviewViewportHeight(container.clientHeight);
    };

    updateViewportHeight();

    const resizeObserver = new ResizeObserver(updateViewportHeight);
    resizeObserver.observe(container);
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const root = panelRootRef.current;
    const panelBody = panelBodyScrollRef.current;
    if (!root || !panelBody || !panelOpen) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && panelBody.contains(target)) {
        return;
      }

      panelBody.scrollTop += event.deltaY;
      event.preventDefault();
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      root.removeEventListener("wheel", onWheel);
    };
  }, [panelOpen]);

  const activeSectionId = selectedSectionId ?? structure[0]?.id ?? null;
  const selectedSection = useMemo(
    () => structure.find((item) => item.id === activeSectionId) ?? null,
    [activeSectionId, structure],
  );
  const layoutSections = useMemo(
    () =>
      [
        { id: "layout-navbar", name: "Navbar" },
        { id: "layout-body", name: "Body" },
        { id: "layout-footer", name: "Footer" },
      ] as const,
    [],
  );
  const selectedLayoutSectionIndex = layoutSections.findIndex(
    (section) => section.id === selectedLayoutSectionId,
  );
  const addSectionTargetScopeId = useMemo(() => {
    if (
      newSectionScopeId &&
      backgroundScopes.some((scope) => scope.id === newSectionScopeId)
    ) {
      return newSectionScopeId;
    }

    const selectedScopeId = selectedSection?.scopeId;
    if (
      selectedScopeId &&
      backgroundScopes.some((scope) => scope.id === selectedScopeId)
    ) {
      return selectedScopeId;
    }

    return backgroundScopes[0]?.id ?? null;
  }, [backgroundScopes, newSectionScopeId, selectedSection?.scopeId]);
  const editingBackgroundScope = useMemo(
    () =>
      editingBackgroundScopeId
        ? (backgroundScopes.find(
            (scope) => scope.id === editingBackgroundScopeId,
          ) ?? null)
        : null,
    [backgroundScopes, editingBackgroundScopeId],
  );
  const activeSectionIndex = activeSectionId
    ? sectionsInRenderOrder.findIndex((item) => item.id === activeSectionId)
    : -1;
  const selectedSectionPaddingFieldId = selectedSection
    ? getSectionFieldKey(selectedSection.id, "__section_padding")
    : null;
  const selectedSectionEditorialHeaderBackgroundKey =
    selectedSection?.type === "editorial-feature"
      ? getSectionFieldKey(selectedSection.id, "__header_background")
      : null;
  const selectedSectionEditorialImageSizeKey =
    selectedSection?.type === "editorial-feature"
      ? getSectionFieldKey(selectedSection.id, "__image_size")
      : null;
  const selectedSectionGalleryVariantKey = selectedSection
    ? getSectionGalleryVariantKey(selectedSection.id)
    : null;
  const selectedSectionGalleryAutoplaySecondsKey = selectedSection
    ? getSectionGalleryAutoplaySecondsKey(selectedSection.id)
    : null;
  const selectedSectionGalleryCaptionContainerBackgroundKey = selectedSection
    ? getSectionGalleryCaptionContainerBackgroundKey(selectedSection.id)
    : null;
  const selectedSectionGalleryCaptionContainerOpacityKey = selectedSection
    ? getSectionGalleryCaptionContainerOpacityKey(selectedSection.id)
    : null;
  const selectedSectionGalleryCaptionContainerPaddingXKey = selectedSection
    ? getSectionGalleryCaptionContainerPaddingXKey(selectedSection.id)
    : null;
  const selectedSectionGalleryCaptionContainerPaddingYKey = selectedSection
    ? getSectionGalleryCaptionContainerPaddingYKey(selectedSection.id)
    : null;
  const selectedSectionGalleryGridImageShapeKey = selectedSection
    ? getSectionGalleryGridImageShapeKey(selectedSection.id)
    : null;
  const selectedSectionGalleryItemCaptionModeKeys = selectedSection
    ? [1, 2, 3, 4].map((index) =>
        getSectionGalleryItemCaptionModeKey(selectedSection.id, index),
      )
    : [];
  const selectedSectionGalleryItemSubtitleKeys = selectedSection
    ? [1, 2, 3, 4].map((index) =>
        getSectionGalleryItemSubtitleKey(selectedSection.id, index),
      )
    : [];
  const selectedSectionGalleryItemTitleKeys = selectedSection
    ? [1, 2, 3, 4].map((index) =>
        getSectionFieldKey(selectedSection.id, `item${index}`),
      )
    : [];
  const selectedSectionGalleryItemImageKeys = selectedSection
    ? [1, 2, 3, 4].map((index) =>
        getSectionGalleryItemImageKey(selectedSection.id, index),
      )
    : [];
  const selectedSectionBackgroundImageKey = selectedSection
    ? getSectionBackgroundImageKey(selectedSection.id)
    : null;
  const selectedSectionBackgroundModeKey = selectedSection
    ? getSectionBackgroundModeKey(selectedSection.id)
    : null;
  const selectedSectionBackgroundColorKey = selectedSection
    ? getSectionBackgroundColorKey(selectedSection.id)
    : null;
  const selectedSectionBackgroundGradientKey = selectedSection
    ? getSectionBackgroundGradientKey(selectedSection.id)
    : null;
  const selectedSectionBackgroundZoomKey = selectedSection
    ? getSectionBackgroundZoomKey(selectedSection.id)
    : null;
  const selectedSectionBackgroundPositionXKey = selectedSection
    ? getSectionBackgroundPositionXKey(selectedSection.id)
    : null;
  const selectedSectionBackgroundPositionYKey = selectedSection
    ? getSectionBackgroundPositionYKey(selectedSection.id)
    : null;
  const selectedSectionBorderWidthKey = selectedSection
    ? getSectionBorderWidthKey(selectedSection.id)
    : null;
  const selectedSectionBorderColorKey = selectedSection
    ? getSectionBorderColorKey(selectedSection.id)
    : null;
  const selectedSectionBorderRadiusKey = selectedSection
    ? getSectionBorderRadiusKey(selectedSection.id)
    : null;
  const selectedSectionBorderStyleKey = selectedSection
    ? getSectionBorderStyleKey(selectedSection.id)
    : null;
  const selectedSectionFooterHeightKey =
    selectedSection?.type === "footer"
      ? getSectionFooterHeightKey(selectedSection.id)
      : null;
  const selectedSectionFooterLegacyMinHeightKey =
    selectedSection?.type === "footer"
      ? getSectionFooterMinHeightKey(selectedSection.id)
      : null;
  const selectedSectionImageGridItemsCountKey =
    selectedSection?.type === "image-grid"
      ? getSectionImageGridItemsCountKey(selectedSection.id)
      : null;
  const selectedSectionImageGridColumnsKey =
    selectedSection?.type === "image-grid"
      ? getSectionImageGridColumnsKey(selectedSection.id)
      : null;
  const selectedSectionImageGridUseBodyPaddingKey =
    selectedSection?.type === "image-grid"
      ? getSectionImageGridUseBodyPaddingKey(selectedSection.id)
      : null;
  const selectedSectionImageGridImageSizeKey =
    selectedSection?.type === "image-grid"
      ? getSectionImageGridImageSizeKey(selectedSection.id)
      : null;
  const selectedSectionBackgroundMode =
    selectedSectionBackgroundModeKey != null
      ? getSectionBackgroundModeValue(
          textMap[selectedSectionBackgroundModeKey],
          selectedSectionBackgroundImageKey
            ? textMap[selectedSectionBackgroundImageKey]
            : undefined,
          selectedSectionBackgroundColorKey
            ? textMap[selectedSectionBackgroundColorKey]
            : undefined,
          selectedSectionBackgroundGradientKey
            ? textMap[selectedSectionBackgroundGradientKey]
            : undefined,
        )
      : "color";
  const selectedSectionBackgroundZoom = selectedSectionBackgroundZoomKey
    ? getSectionBackgroundZoomValue(textMap[selectedSectionBackgroundZoomKey])
    : 1;
  const selectedSectionBackgroundPositionX =
    selectedSectionBackgroundPositionXKey
      ? getSectionBackgroundPositionValue(
          textMap[selectedSectionBackgroundPositionXKey],
        )
      : 50;
  const selectedSectionBackgroundPositionY =
    selectedSectionBackgroundPositionYKey
      ? getSectionBackgroundPositionValue(
          textMap[selectedSectionBackgroundPositionYKey],
        )
      : 50;
  const selectedSectionBorderWidth = selectedSectionBorderWidthKey
    ? getNumberValue(textMap[selectedSectionBorderWidthKey], 1, 0, 24)
    : 1;
  const selectedSectionBorderRadius = selectedSectionBorderRadiusKey
    ? getNumberValue(textMap[selectedSectionBorderRadiusKey], 0, 0, 120)
    : 0;
  const selectedSectionBorderStyle = selectedSectionBorderStyleKey
    ? getSectionBorderStyleValue(textMap[selectedSectionBorderStyleKey])
    : "solid";
  const selectedSectionFooterHeight = selectedSectionFooterHeightKey
    ? getNumberValue(
        textMap[selectedSectionFooterHeightKey] ??
          (selectedSectionFooterLegacyMinHeightKey
            ? textMap[selectedSectionFooterLegacyMinHeightKey]
            : undefined),
        320,
        180,
        1200,
      )
    : 320;
  const selectedSectionImageGridItemsCount = selectedSectionImageGridItemsCountKey
    ? getNumberValue(textMap[selectedSectionImageGridItemsCountKey], 12, 1, 12)
    : 12;
  const selectedSectionImageGridColumns = selectedSectionImageGridColumnsKey
    ? getNumberValue(textMap[selectedSectionImageGridColumnsKey], 4, 1, 6)
    : 4;
  const selectedSectionImageGridUseBodyPadding =
    selectedSectionImageGridUseBodyPaddingKey
      ? (textMap[selectedSectionImageGridUseBodyPaddingKey] ?? "1") !== "0"
      : true;
  const selectedSectionImageGridImageSize = selectedSectionImageGridImageSizeKey
    ? getNumberValue(textMap[selectedSectionImageGridImageSizeKey], 260, 120, 520)
    : 260;
  const selectedSectionPaddingMode = selectedSectionPaddingFieldId
    ? getSpacingModeValue(
        textMap[getLandingFieldPaddingModeKey(selectedSectionPaddingFieldId)],
      )
    : "all";
  const selectedSectionMarginMode = selectedSectionPaddingFieldId
    ? getSpacingModeValue(
        textMap[getLandingFieldMarginModeKey(selectedSectionPaddingFieldId)],
      )
    : "all";
  const selectedSectionVideoOverlayOpacityKey = selectedSection
    ? getSectionFieldKey(selectedSection.id, "__video_overlay_opacity")
    : null;
  const selectedSectionVideoPositionXKey = selectedSection
    ? getSectionFieldKey(selectedSection.id, "__video_position_x")
    : null;
  const selectedSectionVideoPositionYKey = selectedSection
    ? getSectionFieldKey(selectedSection.id, "__video_position_y")
    : null;
  const selectedSectionVideoZoomKey = selectedSection
    ? getSectionFieldKey(selectedSection.id, "__video_zoom")
    : null;
  const selectedSectionVideoHeightKey = selectedSection
    ? getSectionFieldKey(selectedSection.id, "__section_height")
    : null;
  const selectedSectionVideoOverlayOpacityRaw = Number.parseInt(
    selectedSectionVideoOverlayOpacityKey
      ? (textMap[selectedSectionVideoOverlayOpacityKey] ?? "")
      : "",
    10,
  );
  const selectedSectionVideoOverlayOpacity = Number.isFinite(
    selectedSectionVideoOverlayOpacityRaw,
  )
    ? clamp(selectedSectionVideoOverlayOpacityRaw, 0, 100)
    : 80;
  const selectedSectionVideoPositionXRaw = Number.parseInt(
    selectedSectionVideoPositionXKey
      ? (textMap[selectedSectionVideoPositionXKey] ?? "")
      : "",
    10,
  );
  const selectedSectionVideoPositionX = Number.isFinite(
    selectedSectionVideoPositionXRaw,
  )
    ? clamp(selectedSectionVideoPositionXRaw, 0, 100)
    : 50;
  const selectedSectionVideoPositionYRaw = Number.parseInt(
    selectedSectionVideoPositionYKey
      ? (textMap[selectedSectionVideoPositionYKey] ?? "")
      : "",
    10,
  );
  const selectedSectionVideoPositionY = Number.isFinite(
    selectedSectionVideoPositionYRaw,
  )
    ? clamp(selectedSectionVideoPositionYRaw, 0, 100)
    : 50;
  const selectedSectionVideoZoomRaw = Number.parseFloat(
    selectedSectionVideoZoomKey
      ? (textMap[selectedSectionVideoZoomKey] ?? "")
      : "",
  );
  const selectedSectionVideoZoom = Number.isFinite(selectedSectionVideoZoomRaw)
    ? clamp(selectedSectionVideoZoomRaw, 1, 3)
    : 1;
  const selectedSectionVideoHeight = getVideoSectionHeightVh(
    selectedSectionVideoHeightKey
      ? (textMap[selectedSectionVideoHeightKey] ??
          (selectedSection
            ? textMap[getSectionFieldKey(selectedSection.id, "__video_height")]
            : undefined))
      : undefined,
  );
  const layoutPaddingX = getLayoutPaddingX(
    textMap[LANDING_LAYOUT_PADDING_X_KEY],
  );
  const layoutNavHeight = getLayoutNavHeight(
    textMap[LANDING_LAYOUT_NAV_HEIGHT_KEY],
  );
  const layoutFooterHeight = getLayoutFooterHeight(
    textMap[LANDING_LAYOUT_FOOTER_HEIGHT_KEY],
  );
  const layoutNavLinks = useMemo(
    () => parseLandingLayoutNavLinks(textMap),
    [textMap],
  );
  const logoContainerName =
    textMap[getLayoutNavContainerNameKey("navbar-logo")] ?? "Logo";
  const navOptionsContainerName =
    textMap[getLayoutNavContainerNameKey("navbar-options")] ?? "Opciones";
  const logoContainerPaddingX = getNumberValue(
    textMap[getLayoutNavContainerPaddingXKey("navbar-logo")],
    0,
    0,
    200,
  );
  const logoContainerPaddingY = getNumberValue(
    textMap[getLayoutNavContainerPaddingYKey("navbar-logo")],
    0,
    0,
    200,
  );
  const navOptionsPaddingX = getNumberValue(
    textMap[getLayoutNavContainerPaddingXKey("navbar-options")],
    0,
    0,
    200,
  );
  const navOptionsPaddingY = getNumberValue(
    textMap[getLayoutNavContainerPaddingYKey("navbar-options")],
    0,
    0,
    200,
  );
  const footerTextContainerName =
    textMap[getLayoutNavContainerNameKey("footer-text")] ?? "Texto footer";
  const footerTextContainerPaddingX = getNumberValue(
    textMap[getLayoutNavContainerPaddingXKey("footer-text")],
    0,
    0,
    200,
  );
  const footerTextContainerPaddingY = getNumberValue(
    textMap[getLayoutNavContainerPaddingYKey("footer-text")],
    0,
    0,
    200,
  );
  const footerContainers = useMemo(
    () => parseFooterContainers(textMap),
    [textMap],
  );
  const footerRootContainers = useMemo(
    () =>
      footerContainers.filter(
        (container) =>
          container.parentId == null ||
          !footerContainers.some((entry) => entry.id === container.parentId),
      ),
    [footerContainers],
  );
  const getFooterContainerChildren = (parentId: string) =>
    footerContainers.filter((container) => container.parentId === parentId);

  const getFooterContainerDescendantIds = (
    containers: FooterContainer[],
    rootId: string,
  ) => {
    const result: string[] = [];
    const stack = [rootId];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      result.push(current);
      const children = containers
        .filter((container) => container.parentId === current)
        .map((container) => container.id);
      stack.push(...children);
    }
    return result;
  };


  const addFooterContainer = (parentId: string | null) => {
    setTextMap((previous) => {
      const currentContainers = parseFooterContainers(previous);
      const nextId = `footer-container-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const nextContainers = [
        ...currentContainers,
        {
          id: nextId,
          name: `Contenedor ${currentContainers.length + 1}`,
          parentId,
        },
      ];
      return {
        ...previous,
        [LANDING_LAYOUT_FOOTER_CONTAINERS_KEY]: JSON.stringify(nextContainers),
        [getFooterContainerElementsKey(nextId)]: "[]",
        ...(parentId
          ? {
              [getFooterContainerChildrenKey(parentId)]: JSON.stringify([
                ...parseFooterContainerChildren(
                  previous,
                  parentId,
                  currentContainers,
                ),
                { id: nextId, type: "container" as const },
              ]),
            }
          : {}),
      };
    });
  };
  const footerContainerArrangement = getLayoutContainerArrangementValue(
    textMap[LANDING_LAYOUT_FOOTER_CONTAINERS_LAYOUT_KEY],
    landingLayoutContainerRules.footer.defaultArrangement,
    landingLayoutContainerRules.footer.allowedArrangements,
  );
  const selectedSectionVideoTextItems = useMemo(
    () =>
      selectedSection
        ? parseSectionVideoTextItems(textMap, selectedSection.id)
        : [],
    [selectedSection, textMap],
  );
  const selectedSectionGalleryVariant = selectedSectionGalleryVariantKey
    ? getGalleryVariantValue(textMap[selectedSectionGalleryVariantKey])
    : "grid";
  const selectedSectionGalleryAutoplaySeconds =
    selectedSectionGalleryAutoplaySecondsKey
      ? getGalleryAutoplaySecondsValue(
          textMap[selectedSectionGalleryAutoplaySecondsKey],
        )
      : 0;
  const selectedSectionGalleryCaptionContainerOpacity =
    selectedSectionGalleryCaptionContainerOpacityKey
      ? getGalleryCaptionContainerOpacityValue(
          textMap[selectedSectionGalleryCaptionContainerOpacityKey],
          selectedSectionGalleryCaptionContainerBackgroundKey
            ? textMap[selectedSectionGalleryCaptionContainerBackgroundKey]
            : undefined,
        )
      : 80;
  const selectedSectionGalleryCaptionContainerPaddingX =
    selectedSectionGalleryCaptionContainerPaddingXKey
      ? getGalleryCaptionContainerPaddingValue(
          textMap[selectedSectionGalleryCaptionContainerPaddingXKey],
          12,
        )
      : 12;
  const selectedSectionGalleryCaptionContainerPaddingY =
    selectedSectionGalleryCaptionContainerPaddingYKey
      ? getGalleryCaptionContainerPaddingValue(
          textMap[selectedSectionGalleryCaptionContainerPaddingYKey],
          8,
        )
      : 8;
  const selectedSectionGalleryGridImageShape =
    selectedSectionGalleryGridImageShapeKey
      ? getGalleryGridImageShapeValue(
          textMap[selectedSectionGalleryGridImageShapeKey],
        )
      : "landscape";
  const selectedSectionGalleryItemCaptionModes =
    selectedSectionGalleryItemCaptionModeKeys.map((key) =>
      getGalleryCaptionModeValue(textMap[key]),
    );

  const activeSectionExtras = useMemo(
    () =>
      selectedSectionId
        ? parseSectionExtraElements(textMap, selectedSectionId)
        : [],
    [selectedSectionId, textMap],
  );

  const activeSectionItems = useMemo<SectionItem[]>(() => {
    if (!selectedSectionId) {
      return [];
    }

    const section = structure.find((item) => item.id === selectedSectionId);
    if (!section) {
      return [];
    }

    const baseItems: SectionItem[] = landingSectionCatalog[
      section.type
    ].fields.map((field) => ({
      id: `base:${field.key}`,
      label: field.label,
      textKey: getSectionFieldKey(section.id, field.key),
      kind: "base",
    }));

    const extraItems: SectionItem[] = activeSectionExtras.map((extra) => ({
      id: `extra:${extra.id}`,
      label: getExtraDefaults(extra.type).label,
      textKey: getSectionExtraTextKey(section.id, extra.id),
      kind: "extra",
      extraId: extra.id,
    }));

    const byId = new Map(
      [...baseItems, ...extraItems].map((item) => [item.id, item]),
    );
    const savedOrder = parseSectionItemsOrder(textMap, section.id);
    const ordered = savedOrder
      .map((id) => byId.get(id))
      .filter((item): item is SectionItem => Boolean(item));
    const missing = [...byId.values()].filter(
      (item) => !savedOrder.includes(item.id),
    );

    return [...ordered, ...missing];
  }, [selectedSectionId, structure, activeSectionExtras, textMap]);

  function getExtraPositionXFieldKey(sectionId: string, extraId: string) {
    return getSectionExtraResponsivePositionXKey(
      sectionId,
      extraId,
      responsiveEditMode,
    );
  }

  function getExtraPositionYFieldKey(sectionId: string, extraId: string) {
    return getSectionExtraResponsivePositionYKey(
      sectionId,
      extraId,
      responsiveEditMode,
    );
  }

  function getExtraSizeFieldKey(textKey: string) {
    return getLandingFieldResponsiveSizeKey(textKey, responsiveEditMode);
  }

  function getResponsiveValueFromMap(
    source: LandingTextMap,
    fieldId: string,
    mode: LandingResponsiveMode,
  ) {
    const storageKey = getResponsiveFieldStorageKey(fieldId, mode);
    const overrideValue = source[storageKey];
    if (overrideValue != null && String(overrideValue).trim() !== "") {
      return overrideValue;
    }
    return source[fieldId];
  }

  function materializeResponsiveField(source: LandingTextMap, fieldId: string) {
    const next = { ...source };

    for (const mode of RESPONSIVE_MODES) {
      const storageKey = getResponsiveFieldStorageKey(fieldId, mode);
      if (next[storageKey] == null || String(next[storageKey]).trim() === "") {
        const currentValue = getResponsiveValueFromMap(source, fieldId, mode);
        if (currentValue != null && String(currentValue).trim() !== "") {
          next[storageKey] = currentValue;
        }
      }
    }

    return next;
  }

  function resolveTopLevelAccordionId(
    sectionId: string | null,
    fieldId: string | null,
  ) {
    if (!sectionId || !fieldId) {
      return null;
    }

    const section = structure.find((item) => item.id === sectionId);
    if (!section) {
      return null;
    }

    for (const field of landingSectionCatalog[section.type].fields) {
      if (getSectionFieldKey(section.id, field.key) === fieldId) {
        return `top:item:base:${field.key}`;
      }
    }

    const extras = parseSectionExtraElements(textMap, section.id);
    for (const extra of extras) {
      if (getSectionExtraTextKey(section.id, extra.id) === fieldId) {
        return `top:item:extra:${extra.id}`;
      }
    }

    if (fieldId.startsWith(getSectionFieldKey(section.id, "__video_text_"))) {
      return "top:item:base:url";
    }

    return "top:attributes";
  }

  function toggleTopLevelAccordion(accordionId: string) {
    setOpenPanelAccordionId((previous) =>
      previous === accordionId ? null : accordionId,
    );
  }

  function updateField(fieldId: string, value: string) {
    const isExplicitResponsiveKey = isExplicitResponsiveOverrideKey(fieldId);
    const shouldIsolateByBreakpoint = isResponsiveScopedFieldId(fieldId);
    const resolvedFieldId =
      shouldIsolateByBreakpoint && !isExplicitResponsiveKey
        ? getResponsiveFieldStorageKey(fieldId, responsiveEditMode)
        : fieldId;

    setTextMap((previous) => {
      const next =
        shouldIsolateByBreakpoint && !isExplicitResponsiveKey
          ? materializeResponsiveField(previous, fieldId)
          : { ...previous };

      next[resolvedFieldId] = value;
      return next;
    });
  }

  function updateLayoutField(
    fieldId: string,
    value: string,
    options?: { responsiveScoped?: boolean },
  ) {
    const useResponsiveScope = options?.responsiveScoped === true;
    const isExplicitResponsiveKey = isExplicitResponsiveOverrideKey(fieldId);
    const resolvedFieldId =
      useResponsiveScope && !isExplicitResponsiveKey
        ? getResponsiveFieldStorageKey(fieldId, responsiveEditMode)
        : fieldId;

    setTextMap((previous) => {
      const next =
        useResponsiveScope && !isExplicitResponsiveKey
          ? materializeResponsiveField(previous, fieldId)
          : { ...previous };
      next[resolvedFieldId] = value;
      return next;
    });
  }

  function updateLayoutNavLinks(
    updater: (
      links: ReturnType<typeof parseLandingLayoutNavLinks>,
    ) => ReturnType<typeof parseLandingLayoutNavLinks>,
  ) {
    setTextMap((previous) => {
      const currentLinks = parseLandingLayoutNavLinks(previous);
      const nextLinks = updater(currentLinks).map((item, index) => ({
        id: item.id?.trim() || `nav-${index + 1}`,
        label: item.label ?? "",
        href: item.href ?? "#",
      }));

      return {
        ...previous,
        [LANDING_LAYOUT_NAV_LINKS_KEY]: JSON.stringify(nextLinks),
      };
    });
  }

  function commitLayout(
    nextStructure: LandingSectionInstance[],
    nextScopes: LandingBackgroundScope[],
  ) {
    if (nextScopes.length === 0) {
      return;
    }

    const fallbackScopeId = nextScopes[0].id;
    const validScopeIds = new Set(nextScopes.map((scope) => scope.id));
    const normalizedStructure = nextStructure.map((section) => ({
      ...section,
      scopeId:
        section.scopeId && validScopeIds.has(section.scopeId)
          ? section.scopeId
          : fallbackScopeId,
    }));

    setBackgroundScopes(nextScopes);
    setStructure(normalizedStructure);
    setTextMap((previous) => ({
      ...previous,
      [LANDING_BACKGROUND_SCOPES_KEY]: JSON.stringify(nextScopes),
      [LANDING_STRUCTURE_KEY]: JSON.stringify(normalizedStructure),
    }));
  }

  function commitStructure(nextStructure: LandingSectionInstance[]) {
    commitLayout(nextStructure, backgroundScopes);
  }

  function commitBackgroundScopes(nextScopes: LandingBackgroundScope[]) {
    commitLayout(structure, nextScopes);
  }

  function addBackgroundScope() {
    const nextScope: LandingBackgroundScope = {
      id: createBackgroundScopeId(),
      name: `Fondo ${backgroundScopes.length + 1}`,
      type: "none",
      visualMode: "color",
      color: "#ffffff",
      gradient: "linear-gradient(180deg,#ffffff 0%,#f8f8f8 100%)",
      heightVh: 400,
    };
    commitBackgroundScopes([...backgroundScopes, nextScope]);
  }

  function updateBackgroundScope(
    scopeId: string,
    patch: Partial<LandingBackgroundScope>,
  ) {
    if (patch.heightVh !== undefined) {
      const usedHeight = sectionHeightsByScope.get(scopeId) ?? 0;
      if (patch.heightVh < usedHeight) {
        setStatusMessage(
          `No se puede bajar la altura: las secciones asignadas ocupan ${usedHeight}vh.`,
        );
        return;
      }
    }

    const nextScopes = backgroundScopes.map((scope) =>
      scope.id === scopeId ? { ...scope, ...patch } : scope,
    );
    commitBackgroundScopes(nextScopes);
  }

  function removeBackgroundScope(scopeId: string) {
    if (backgroundScopes.length <= 1) {
      return;
    }
    const nextScopes = backgroundScopes.filter((scope) => scope.id !== scopeId);
    commitBackgroundScopes(nextScopes);
  }

  function addSection() {
    const id = createSectionId(newSectionType);
    const def = getTypeDefaults(newSectionType);
    const targetScopeId =
      addSectionTargetScopeId ??
      selectedSection?.scopeId ??
      backgroundScopes[0]?.id ??
      parseLandingBackgroundScopes(rawTextMap)[0]?.id;
    const targetScope = backgroundScopes.find(
      (scope) => scope.id === targetScopeId,
    );
    if (!targetScope) {
      setStatusMessage(
        "No hay un fondo destino valido para agregar la seccion.",
      );
      return;
    }
    const estimatedHeight = getSectionEstimatedHeightVh(newSectionType);
    const usedHeight = sectionHeightsByScope.get(targetScope.id) ?? 0;
    const requiredHeight = usedHeight + estimatedHeight;
    const shouldExpandTargetScope = requiredHeight > targetScope.heightVh;
    const nextScopes = shouldExpandTargetScope
      ? backgroundScopes.map((scope) =>
          scope.id === targetScope.id
            ? { ...scope, heightVh: requiredHeight }
            : scope,
        )
      : backgroundScopes;
    const newSection: LandingSectionInstance = {
      id,
      type: newSectionType,
      name: `${def.label} ${structure.filter((item) => item.type === newSectionType).length + 1}`,
      scopeId: targetScopeId,
    };
    const nextStructure = [...structure, newSection];
    commitLayout(nextStructure, nextScopes);

    setTextMap((previous) => {
      const next: LandingTextMap = { ...previous };
      next[getSectionExtrasKey(id)] = "[]";
      next[getSectionItemsOrderKey(id)] = JSON.stringify(
        def.fields.map((field) => `base:${field.key}`),
      );

      for (const field of def.fields) {
        const key = getSectionFieldKey(id, field.key);
        next[key] = field.defaultValue;
        next[getLandingFieldSizeKey(key)] = String(field.defaultSize);
      }

      return next;
    });

    if (shouldExpandTargetScope) {
      setStatusMessage(
        `Se ajusto "${targetScope.name}" a ${requiredHeight}vh para agregar la seccion.`,
      );
    }
    setSelectedSectionId(id);
    if (def.fields.length > 0) {
      setSelectedFieldId(getSectionFieldKey(id, def.fields[0].key));
      setOpenPanelAccordionId(`top:item:base:${def.fields[0].key}`);
    } else {
      setSelectedFieldId(null);
      setOpenPanelAccordionId(null);
    }
    setPanelOpen(true);
  }

  function removeSection(sectionId: string) {
    if (structure.length <= 1) {
      return;
    }

    const nextStructure = structure.filter(
      (section) => section.id !== sectionId,
    );
    commitStructure(nextStructure);

    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setOpenPanelAccordionId(null);
    }

    if (selectedFieldId?.startsWith(`section.${sectionId}.`)) {
      setSelectedFieldId(null);
      setOpenPanelAccordionId(null);
    }
  }

  function addExtraElement(sectionId: string, type: SectionExtraElementType) {
    const extras = parseSectionExtraElements(textMap, sectionId);
    const extraId = `${type}-${nextExtraIdRef.current++}`;
    const defaults = getExtraDefaults(type);
    const textKey = getSectionExtraTextKey(sectionId, extraId);
    const nextExtras = [...extras, { id: extraId, type }];
    const currentOrder = parseSectionItemsOrder(textMap, sectionId);

    setTextMap((previous) => {
      const next: LandingTextMap = {
        ...previous,
        [getSectionExtrasKey(sectionId)]: JSON.stringify(nextExtras),
        [textKey]: defaults.text,
        [getLandingFieldSizeKey(textKey)]: String(defaults.size),
        [getSectionExtraPositionXKey(sectionId, extraId)]: "50",
        [getSectionExtraPositionYKey(sectionId, extraId)]: "50",
        [getSectionItemsOrderKey(sectionId)]: JSON.stringify([
          ...currentOrder,
          `extra:${extraId}`,
        ]),
      };

      for (const mode of RESPONSIVE_MODES) {
        next[getLandingFieldResponsiveSizeKey(textKey, mode)] = String(
          defaults.size,
        );
        next[getSectionExtraResponsivePositionXKey(sectionId, extraId, mode)] =
          "50";
        next[getSectionExtraResponsivePositionYKey(sectionId, extraId, mode)] =
          "50";
      }

      if (type === "line-vertical" || type === "line-horizontal") {
        next[getLandingFieldLineWidthKey(textKey)] = "1";
      }
      if (type === "button") {
        next[getLandingFieldButtonVariantKey(textKey)] = "default";
      }

      return next;
    });

    setSelectedFieldId(textKey);
    setOpenPanelAccordionId(`top:item:extra:${extraId}`);
    setPanelOpen(true);
    scrollPreviewToSection(sectionId);
  }

  function removeExtraElement(sectionId: string, extraId: string) {
    const extras = parseSectionExtraElements(textMap, sectionId);
    const nextExtras = extras.filter((item) => item.id !== extraId);
    const textKey = getSectionExtraTextKey(sectionId, extraId);
    const nextOrder = parseSectionItemsOrder(textMap, sectionId).filter(
      (item) => item !== `extra:${extraId}`,
    );

    setTextMap((previous) => ({
      ...previous,
      [getSectionExtrasKey(sectionId)]: JSON.stringify(nextExtras),
      [getSectionItemsOrderKey(sectionId)]: JSON.stringify(nextOrder),
    }));

    if (selectedFieldId === textKey) {
      setSelectedFieldId(null);
      setOpenPanelAccordionId(null);
    }
  }

  function addVideoTextItem(sectionId: string) {
    const currentItems = parseSectionVideoTextItems(textMap, sectionId);
    const itemId = `txt-${nextVideoTextIdRef.current++}`;
    const nextItems = [...currentItems, itemId];
    setTextMap((previous) => ({
      ...previous,
      [getSectionVideoTextItemsKey(sectionId)]: JSON.stringify(nextItems),
      [getSectionVideoTextFieldKey(sectionId, itemId, "content")]:
        "Nuevo texto",
      [getSectionVideoTextFieldKey(sectionId, itemId, "size")]: "44",
      [getSectionVideoTextFieldKey(sectionId, itemId, "color")]: "#ffffff",
      [getSectionVideoTextFieldKey(sectionId, itemId, "weight")]: "700",
      [getSectionVideoTextFieldKey(sectionId, itemId, "align")]: "center",
      [getSectionVideoTextFieldKey(sectionId, itemId, "position_x")]: "50",
      [getSectionVideoTextFieldKey(sectionId, itemId, "position_y")]: "50",
    }));
  }

  function removeVideoTextItem(sectionId: string, itemId: string) {
    const currentItems = parseSectionVideoTextItems(textMap, sectionId);
    const nextItems = currentItems.filter((id) => id !== itemId);
    setTextMap((previous) => {
      const next = {
        ...previous,
        [getSectionVideoTextItemsKey(sectionId)]: JSON.stringify(nextItems),
      };
      delete next[getSectionVideoTextFieldKey(sectionId, itemId, "content")];
      delete next[getSectionVideoTextFieldKey(sectionId, itemId, "size")];
      delete next[getSectionVideoTextFieldKey(sectionId, itemId, "color")];
      delete next[getSectionVideoTextFieldKey(sectionId, itemId, "weight")];
      delete next[getSectionVideoTextFieldKey(sectionId, itemId, "align")];
      delete next[getSectionVideoTextFieldKey(sectionId, itemId, "position_x")];
      delete next[getSectionVideoTextFieldKey(sectionId, itemId, "position_y")];
      return next;
    });
  }

  function reorderBackgroundScopes(
    sourceScopeId: string,
    targetScopeId: string,
  ) {
    if (sourceScopeId === targetScopeId) {
      return;
    }

    const sourceIndex = backgroundScopes.findIndex(
      (scope) => scope.id === sourceScopeId,
    );
    const targetIndex = backgroundScopes.findIndex(
      (scope) => scope.id === targetScopeId,
    );

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const nextScopes = [...backgroundScopes];
    const [scopeItem] = nextScopes.splice(sourceIndex, 1);
    nextScopes.splice(targetIndex, 0, scopeItem);
    commitBackgroundScopes(nextScopes);
  }

  function moveSectionToScope(
    sourceSectionId: string,
    targetScopeId: string,
    targetSectionId?: string,
  ) {
    const sourceIndex = structure.findIndex(
      (section) => section.id === sourceSectionId,
    );
    if (sourceIndex < 0) {
      return;
    }
    const targetScope = backgroundScopes.find(
      (scope) => scope.id === targetScopeId,
    );
    if (!targetScope) {
      return;
    }
    const sourceSection = structure[sourceIndex];
    const sourceHeight = getSectionEstimatedHeightVhForSection(
      sourceSection,
      textMap,
    );
    const sourceCurrentScopeId = sourceSection.scopeId ?? fallbackScopeId;
    const currentTargetUsed = sectionHeightsByScope.get(targetScopeId) ?? 0;
    const targetUsedExcludingSource =
      sourceCurrentScopeId === targetScopeId
        ? currentTargetUsed - sourceHeight
        : currentTargetUsed;
    const requiredTargetHeight = targetUsedExcludingSource + sourceHeight;
    const shouldExpandTargetScope = requiredTargetHeight > targetScope.heightVh;
    const nextScopes = shouldExpandTargetScope
      ? backgroundScopes.map((scope) =>
          scope.id === targetScopeId
            ? { ...scope, heightVh: requiredTargetHeight }
            : scope,
        )
      : backgroundScopes;

    const next = [...structure];
    const [removedSection] = next.splice(sourceIndex, 1);
    const movedSection: LandingSectionInstance = {
      ...removedSection,
      scopeId: targetScopeId,
    };

    if (targetSectionId && targetSectionId !== sourceSectionId) {
      const targetIndexBeforeMove = structure.findIndex(
        (section) => section.id === targetSectionId,
      );
      const targetIndex = next.findIndex(
        (section) => section.id === targetSectionId,
      );
      if (targetIndex >= 0) {
        const isSameScopeMove = sourceCurrentScopeId === targetScopeId;
        const movingDownWithinSameScope =
          isSameScopeMove && targetIndexBeforeMove > sourceIndex;
        const insertIndex = movingDownWithinSameScope
          ? targetIndex + 1
          : targetIndex;
        next.splice(insertIndex, 0, movedSection);
      } else {
        next.push(movedSection);
      }
      if (shouldExpandTargetScope) {
        commitLayout(next, nextScopes);
        setStatusMessage(
          `Se ajusto "${targetScope.name}" a ${requiredTargetHeight}vh para recibir la seccion.`,
        );
      } else {
        commitStructure(next);
      }
      return;
    }

    let insertIndex = -1;
    next.forEach((section, index) => {
      if ((section.scopeId ?? fallbackScopeId) === targetScopeId) {
        insertIndex = index + 1;
      }
    });

    if (insertIndex >= 0) {
      next.splice(insertIndex, 0, movedSection);
    } else {
      next.push(movedSection);
    }

    if (shouldExpandTargetScope) {
      commitLayout(next, nextScopes);
      setStatusMessage(
        `Se ajusto "${targetScope.name}" a ${requiredTargetHeight}vh para recibir la seccion.`,
      );
      return;
    }

    commitStructure(next);
  }

  function reorderSectionWithinScope(
    sectionId: string,
    direction: "up" | "down",
  ) {
    const currentIndex = structure.findIndex(
      (section) => section.id === sectionId,
    );
    if (currentIndex < 0) {
      return;
    }

    const currentScopeId = structure[currentIndex].scopeId ?? fallbackScopeId;
    const scopeIndexes = structure
      .map((section, index) => ({
        index,
        scopeId: section.scopeId ?? fallbackScopeId,
      }))
      .filter((item) => item.scopeId === currentScopeId)
      .map((item) => item.index);

    const scopePosition = scopeIndexes.indexOf(currentIndex);
    if (scopePosition < 0) {
      return;
    }

    const targetScopePosition =
      direction === "up" ? scopePosition - 1 : scopePosition + 1;
    if (targetScopePosition < 0 || targetScopePosition >= scopeIndexes.length) {
      return;
    }

    const targetIndex = scopeIndexes[targetScopePosition];
    const next = [...structure];
    const [moved] = next.splice(currentIndex, 1);
    const adjustedTargetIndex =
      currentIndex < targetIndex ? targetIndex - 1 : targetIndex;
    next.splice(adjustedTargetIndex, 0, moved);
    commitStructure(next);
  }

  function goToAdjacentSection(direction: "prev" | "next") {
    if (activeSectionIndex < 0) {
      return;
    }

    const nextIndex =
      direction === "next" ? activeSectionIndex + 1 : activeSectionIndex - 1;
    const targetSection = sectionsInRenderOrder[nextIndex];
    if (!targetSection) {
      return;
    }

    focusSection(targetSection.id);
  }

  function goToAdjacentLayoutSection(direction: "prev" | "next") {
    if (selectedLayoutSectionIndex < 0) {
      setSelectedLayoutSectionId("layout-body");
      scrollPreviewToLayoutSection("layout-body");
      return;
    }

    const nextIndex =
      direction === "next"
        ? selectedLayoutSectionIndex + 1
        : selectedLayoutSectionIndex - 1;
    const targetSection = layoutSections[nextIndex];
    if (!targetSection) {
      return;
    }

    setSelectedLayoutSectionId(targetSection.id);
    scrollPreviewToLayoutSection(targetSection.id);
  }

  function scrollPreviewToSection(sectionId: string) {
    const container = previewScrollRef.current;
    if (!container) {
      return;
    }

    const target = container.querySelector<HTMLElement>(
      `[data-preview-section-id="${sectionId}"]`,
    );

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }

  function scrollPreviewToLayoutSection(sectionId: LayoutSectionId) {
    const container = previewScrollRef.current;
    if (!container) {
      return;
    }

    const target = container.querySelector<HTMLElement>(
      `[data-preview-layout-section-id="${sectionId}"]`,
    );
    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }

  function focusSection(sectionId: string) {
    const section = structure.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const firstField = landingSectionCatalog[section.type].fields[0];
    const firstExtra = parseSectionExtraElements(textMap, section.id)[0];
    const fieldKey = firstField
      ? getSectionFieldKey(section.id, firstField.key)
      : firstExtra
        ? getSectionExtraTextKey(section.id, firstExtra.id)
        : null;

    setSelectedSectionId(section.id);
    setSelectedFieldId(fieldKey);
    setOpenPanelAccordionId(resolveTopLevelAccordionId(section.id, fieldKey));
    setEditingBackgroundScopeId(null);
    setPanelOpen(true);
    setIsSectionSettingsView(false);
    scrollPreviewToSection(section.id);
  }

  function handleSelectField(fieldId: string) {
    const match = fieldId.match(/^section\.([^.]*)\./);
    const sectionId = match?.[1] ?? null;
    if (match?.[1]) {
      setSelectedSectionId(match[1]);
    }
    setSelectedFieldId(fieldId);
    setOpenPanelAccordionId(resolveTopLevelAccordionId(sectionId, fieldId));
    setEditingBackgroundScopeId(null);
    setPanelOpen(true);
    setIsSectionSettingsView(false);
  }

  function handleMoveSectionExtraPosition(
    sectionId: string,
    extraId: string,
    positionX: number,
    positionY: number,
    mode: LandingResponsiveMode,
  ) {
    const nextX = clamp(Math.round(positionX), 0, 100);
    const nextY = clamp(Math.round(positionY), 0, 100);
    const textKey = getSectionExtraTextKey(sectionId, extraId);
    const basePositionXKey = getSectionExtraPositionXKey(sectionId, extraId);
    const basePositionYKey = getSectionExtraPositionYKey(sectionId, extraId);
    const positionXKey = getSectionExtraResponsivePositionXKey(
      sectionId,
      extraId,
      mode,
    );
    const positionYKey = getSectionExtraResponsivePositionYKey(
      sectionId,
      extraId,
      mode,
    );

    setTextMap((previous) => {
      const next = materializeResponsiveField(previous, basePositionXKey);
      const normalized = materializeResponsiveField(next, basePositionYKey);

      normalized[positionXKey] = String(nextX);
      normalized[positionYKey] = String(nextY);

      return normalized;
    });

    setSelectedSectionId(sectionId);
    setSelectedFieldId(textKey);
    setOpenPanelAccordionId(`top:item:extra:${extraId}`);
    setPanelOpen(true);
    setIsSectionSettingsView(false);
  }

  function handleLayoutBodyPaddingXChange(paddingX: number) {
    const nextPaddingX = clamp(Math.round(paddingX), 0, 400);
    updateLayoutField(LANDING_LAYOUT_PADDING_X_KEY, String(nextPaddingX), {
      responsiveScoped: true,
    });
    setSelectedLayoutSectionId("layout-body");
    setOpenPanelAccordionId("layout:attributes");
    setPanelOpen(true);
  }

  async function handlePublish() {
    const payload = {
      ...rawTextMap,
      [LANDING_BACKGROUND_SCOPES_KEY]: JSON.stringify(backgroundScopes),
      [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
    };
    const result =
      pageSlug === "/"
        ? await publishCmsAction(payload)
        : await publishCmsPageAction(pageSlug, payload);
    setStatusMessage(
      result.ok ? "Cambios publicados." : "No se pudo publicar.",
    );
  }
  const renderFooterContainerAccordion = (
    container: FooterContainer,
    depth = 0,
  ): ReactNode => {
    const containerName =
      textMap[getLayoutNavContainerNameKey(container.id)] ?? container.name;
    const containerPaddingX = getNumberValue(
      textMap[getLayoutNavContainerPaddingXKey(container.id)],
      0,
      0,
      200,
    );
    const containerPaddingY = getNumberValue(
      textMap[getLayoutNavContainerPaddingYKey(container.id)],
      0,
      0,
      200,
    );
    const footerContainerElements = parseFooterContainerElements(textMap, container.id);
    const childContainers = getFooterContainerChildren(container.id);
    const childRefs = parseFooterContainerChildren(
      textMap,
      container.id,
      footerContainers,
    );
    const childrenLayoutMode = getContainerChildrenLayoutMode(
      textMap[getLayoutContainerChildrenLayoutKey(container.id)],
    );

    return (
      <details className="panel-accordion" open key={container.id}>
        <summary
          className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
          style={{ paddingLeft: `${depth * 10}px` }}
        >
          <span className="flex-1 truncate">{containerName}</span>
          <button
            type="button"
            className="container-edit-button inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-background"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setEditingLayoutContainerId((current) =>
                current === container.id ? null : container.id,
              );
            }}
            aria-label="Editar atributos del contenedor footer"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </summary>
        <div
          className="mt-2 space-y-2 rounded-none border bg-background p-2"
          style={{ marginLeft: `${depth * 10}px` }}
        >
          {editingLayoutContainerId === container.id ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Disposicion de elementos
                </label>
                <PanelRadioGroup
                  name={`footer-container-layout-${container.id}`}
                  value={childrenLayoutMode}
                  options={[...getContainerLayoutOptions()]}
                  onChange={(nextValue) =>
                    updateLayoutField(
                      getLayoutContainerChildrenLayoutKey(container.id),
                      nextValue,
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Nombre contenedor
                </label>
                <PanelInput
                  value={containerName}
                  onChange={(event) =>
                    updateLayoutField(
                      getLayoutNavContainerNameKey(container.id),
                      event.target.value,
                    )
                  }
                />
              </div>
              <SliderValueControl
                label="Padding X"
                value={containerPaddingX}
                min={0}
                max={200}
                step={1}
                onChange={(nextValue) =>
                  updateLayoutField(
                    getLayoutNavContainerPaddingXKey(container.id),
                    String(nextValue),
                  )
                }
              />
              <SliderValueControl
                label="Padding Y"
                value={containerPaddingY}
                min={0}
                max={200}
                step={1}
                onChange={(nextValue) =>
                  updateLayoutField(
                    getLayoutNavContainerPaddingYKey(container.id),
                    String(nextValue),
                  )
                }
              />
              <SliderValueControl
                label="Ancho"
                value={getNumberValue(
                  textMap[getLayoutContainerWidthKey(container.id)],
                  0,
                  0,
                  1200,
                )}
                min={0}
                max={1200}
                step={1}
                onChange={(nextValue) =>
                  updateLayoutField(
                    getLayoutContainerWidthKey(container.id),
                    String(nextValue),
                  )
                }
              />
              <SliderValueControl
                label="Alto"
                value={getNumberValue(
                  textMap[getLayoutContainerHeightKey(container.id)],
                  0,
                  0,
                  600,
                )}
                min={0}
                max={600}
                step={1}
                onChange={(nextValue) =>
                  updateLayoutField(
                    getLayoutContainerHeightKey(container.id),
                    String(nextValue),
                  )
                }
              />
              <SliderValueControl
                label="Margen X"
                value={getNumberValue(
                  textMap[getLayoutContainerMarginXKey(container.id)],
                  0,
                  0,
                  300,
                )}
                min={0}
                max={300}
                step={1}
                onChange={(nextValue) =>
                  updateLayoutField(
                    getLayoutContainerMarginXKey(container.id),
                    String(nextValue),
                  )
                }
              />
              <SliderValueControl
                label="Margen Y"
                value={getNumberValue(
                  textMap[getLayoutContainerMarginYKey(container.id)],
                  0,
                  0,
                  300,
                )}
                min={0}
                max={300}
                step={1}
                onChange={(nextValue) =>
                  updateLayoutField(
                    getLayoutContainerMarginYKey(container.id),
                    String(nextValue),
                  )
                }
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
                      />
                    }
                  >
                    + Agregar elemento
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {(
                      [
                        { type: "text", label: "Texto" },
                        { type: "image", label: "Imagen" },
                        { type: "video", label: "Video" },
                        { type: "line-horizontal", label: "Linea horizontal" },
                        { type: "line-vertical", label: "Linea vertical" },
                      ] as Array<{
                        type: FooterContainerElementType;
                        label: string;
                      }>
                    ).map((item) => (
                      <DropdownMenuItem
                        key={item.type}
                        onClick={() => {
                          const current = parseFooterContainerElements(
                            textMap,
                            container.id,
                          );
                          const countOfType = current.filter(
                            (entry) => entry.type === item.type,
                          ).length;
                          const nextId = `footer-el-${nextFooterElementIdRef.current++}`;
                          const nextElement: FooterContainerElement = {
                            id: nextId,
                            type: item.type,
                            label: getFooterElementLabel(
                              item.type,
                              countOfType + 1,
                            ),
                          };
                          setTextMap((previous) => ({
                            ...previous,
                            [getFooterContainerElementsKey(container.id)]:
                              JSON.stringify([
                                ...parseFooterContainerElements(
                                  previous,
                                  container.id,
                                ),
                                nextElement,
                              ]),
                            [getFooterContainerChildrenKey(container.id)]:
                              JSON.stringify([
                                ...parseFooterContainerChildren(
                                  previous,
                                  container.id,
                                  parseFooterContainers(previous),
                                ),
                                { id: nextId, type: "element" as const },
                              ]),
                            [getFooterElementValueKey(nextId)]:
                              getFooterElementDefaultValue(item.type),
                          }));
                        }}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
                    onClick={() => addFooterContainer(container.id)}
                  >
                    + Agregar contenedor hijo
                  </button>
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => {
                      setTextMap((previous) => {
                        const currentContainers = parseFooterContainers(previous);
                        const idsToRemove = getFooterContainerDescendantIds(
                          currentContainers,
                          container.id,
                        );
                        const nextContainers = currentContainers.filter(
                          (entry) => !idsToRemove.includes(entry.id),
                        );
                        const nextMap: LandingTextMap = {
                          ...previous,
                          [LANDING_LAYOUT_FOOTER_CONTAINERS_KEY]:
                            JSON.stringify(nextContainers),
                        };
                        currentContainers.forEach((entry) => {
                          nextMap[getFooterContainerChildrenKey(entry.id)] =
                            JSON.stringify(
                              parseFooterContainerChildren(
                                previous,
                                entry.id,
                                currentContainers,
                              ).filter(
                                (child) =>
                                  !(
                                    child.type === "container" &&
                                    idsToRemove.includes(child.id)
                                  ),
                              ),
                            );
                        });
                        idsToRemove.forEach((id) => {
                          delete nextMap[getFooterContainerElementsKey(id)];
                          delete nextMap[getFooterContainerChildrenKey(id)];
                          delete nextMap[getLayoutNavContainerNameKey(id)];
                          delete nextMap[getLayoutNavContainerPaddingXKey(id)];
                          delete nextMap[getLayoutNavContainerPaddingYKey(id)];
                          delete nextMap[getLayoutContainerWidthKey(id)];
                          delete nextMap[getLayoutContainerHeightKey(id)];
                          delete nextMap[getLayoutContainerMarginXKey(id)];
                          delete nextMap[getLayoutContainerMarginYKey(id)];
                          const elements = parseFooterContainerElements(
                            previous,
                            id,
                          );
                          elements.forEach((element) => {
                            if (
                              !(
                                id === "footer-text" &&
                                element.id === "footer-text-default"
                              )
                            ) {
                              delete nextMap[getFooterElementValueKey(element.id)];
                            }
                          });
                        });
                        if (
                          editingLayoutContainerId &&
                          idsToRemove.includes(editingLayoutContainerId)
                        ) {
                          setEditingLayoutContainerId(null);
                        }
                        return nextMap;
                      });
                    }}
                  >
                    Quitar contenedor
                  </button>
                </div>
              </div>

              {childRefs.map((childRef) => {
                if (childRef.type === "container") {
                  const childContainer = childContainers.find(
                    (entry) => entry.id === childRef.id,
                  );
                  return childContainer
                    ? renderFooterContainerAccordion(childContainer, depth + 1)
                    : null;
                }
                const element = footerContainerElements.find(
                  (entry) => entry.id === childRef.id,
                );
                if (!element) {
                  return null;
                }
                const isDefaultText =
                  container.id === "footer-text" &&
                  element.id === "footer-text-default";
                const valueKey = isDefaultText
                  ? LANDING_LAYOUT_FOOTER_TEXT_KEY
                  : getFooterElementValueKey(element.id);

                return (
                  <div
                    key={element.id}
                    className="space-y-1.5 rounded-sm border bg-muted/20 p-2"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">
                        {element.label}
                      </label>
                      {!isDefaultText ? (
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline"
                          onClick={() => {
                            setTextMap((previous) => {
                              const current = parseFooterContainerElements(
                                previous,
                                container.id,
                              );
                              const next = current.filter(
                                (entry) => entry.id !== element.id,
                              );
                              const map = {
                                ...previous,
                                [getFooterContainerElementsKey(container.id)]:
                                  JSON.stringify(next),
                                [getFooterContainerChildrenKey(container.id)]:
                                  JSON.stringify(
                                    parseFooterContainerChildren(
                                      previous,
                                      container.id,
                                      parseFooterContainers(previous),
                                    ).filter(
                                      (entry) =>
                                        !(
                                          entry.type === "element" &&
                                          entry.id === element.id
                                        ),
                                    ),
                                  ),
                              };
                              delete map[valueKey];
                              return map;
                            });
                          }}
                        >
                          Quitar
                        </button>
                      ) : null}
                    </div>
                    <PanelInput
                      value={textMap[valueKey] ?? ""}
                      onChange={(event) =>
                        updateLayoutField(valueKey, event.target.value)
                      }
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </details>
    );
  };

  const panelPortal = portalTarget
    ? createPortal(
        <div
          ref={panelRootRef}
          className="font-fira relative h-full overflow-visible select-none [&_input]:select-text [&_textarea]:select-text"
        >
          <button
            type="button"
            className="panel-close-float absolute top-1/2 -left-10 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/65 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
            onClick={() => setPanelOpen(false)}
            aria-label="Cerrar panel"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b">
              <div
                className="h-14 w-full overflow-hidden"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                }}
              >
                <div
                  className="flex h-full min-w-0 items-center justify-center gap-4 border-r px-2"
                  style={{ flex: "0 0 50%", maxWidth: "50%" }}
                >
                  {editorMode === "layout" ? (
                    <>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-md"
                        onClick={() => goToAdjacentLayoutSection("prev")}
                        disabled={selectedLayoutSectionIndex <= 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="max-w-[120px] truncate text-center text-sm font-medium">
                        {layoutSections[selectedLayoutSectionIndex]?.name ??
                          "Layout"}
                      </span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-md"
                        onClick={() => goToAdjacentLayoutSection("next")}
                        disabled={
                          selectedLayoutSectionIndex < 0 ||
                          selectedLayoutSectionIndex >=
                            layoutSections.length - 1
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-md"
                        onClick={() => goToAdjacentSection("prev")}
                        disabled={activeSectionIndex <= 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="max-w-[120px] truncate text-center text-sm font-medium">
                        {activeSectionId
                          ? sectionsInRenderOrder[activeSectionIndex]?.name
                          : "SecciÃ³n actual"}
                      </span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-md"
                        onClick={() => goToAdjacentSection("next")}
                        disabled={
                          activeSectionIndex < 0 ||
                          activeSectionIndex >= sectionsInRenderOrder.length - 1
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                <div
                  className="h-full min-w-0"
                  style={{ flex: "0 0 50%", maxWidth: "50%" }}
                >
                  <button
                    type="button"
                    className="block h-full w-full rounded-none border-0"
                    style={{
                      backgroundColor: "#059669",
                      color: "#ffffff",
                    }}
                    onClick={handlePublish}
                  >
                    Publicar
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={panelBodyScrollRef}
              className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div
                className={cn(
                  "h-full min-h-0 flex flex-col gap-4 p-4",
                  editorMode === "layout" && "hidden",
                  (isSectionSettingsView || editingBackgroundScope) && "hidden",
                )}
              >
                {statusMessage ? (
                  <p className="text-xs text-muted-foreground">
                    {statusMessage}
                  </p>
                ) : null}

                <div className="flex items-center justify-between gap-2">
                  {selectedSection?.type === "footer" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button type="button" size="sm" variant="outline" />
                        }
                      >
                        Agregar elemento
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() =>
                            addExtraElement(selectedSection.id, "text")
                          }
                        >
                          Texto
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            addExtraElement(selectedSection.id, "button")
                          }
                        >
                          Boton
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            addExtraElement(selectedSection.id, "image")
                          }
                        >
                          Imagen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            addExtraElement(selectedSection.id, "line-vertical")
                          }
                        >
                          Linea vertical
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            addExtraElement(
                              selectedSection.id,
                              "line-horizontal",
                            )
                          }
                        >
                          Linea horizontal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingBackgroundScopeId(null);
                      setIsSectionSettingsView(true);
                    }}
                  >
                    Configurar secciones
                  </Button>
                </div>

                {selectedSection ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Edicion responsive
                    </label>
                    <PanelRadioGroup
                      name="footer-responsive-mode"
                      value={responsiveEditMode}
                      options={[
                        {
                          value: "large",
                          label: <Monitor className="h-4 w-4" />,
                          srLabel: "Grande",
                        },
                        {
                          value: "medium",
                          label: <Laptop className="h-4 w-4" />,
                          srLabel: "Mediana",
                        },
                        {
                          value: "tablet",
                          label: <Tablet className="h-4 w-4" />,
                          srLabel: "Tablet",
                        },
                        {
                          value: "mobile",
                          label: <Smartphone className="h-4 w-4" />,
                          srLabel: "Movil",
                        },
                      ]}
                      onChange={(nextValue) =>
                        setResponsiveEditMode(
                          nextValue as LandingResponsiveMode,
                        )
                      }
                    />
                  </div>
                ) : null}

                <div className="order-2 space-y-3">
                  {selectedSection ? (
                    <>
                      <details
                        className="panel-accordion"
                        open={openPanelAccordionId === "top:attributes"}
                      >
                        <summary
                          className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                          onClick={(event) => {
                            event.preventDefault();
                            toggleTopLevelAccordion("top:attributes");
                          }}
                        >
                          Atributos generales de seccion
                        </summary>
                        <div className="mt-2 space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Tipo:{" "}
                            {landingSectionCatalog[selectedSection.type].label}
                          </p>

                          {selectedSection.type === "image-grid" &&
                          selectedSectionImageGridItemsCountKey &&
                          selectedSectionImageGridColumnsKey &&
                          selectedSectionImageGridUseBodyPaddingKey &&
                          selectedSectionImageGridImageSizeKey ? (
                            <div className="space-y-2 rounded-md border bg-background p-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                Cantidad de imagenes (
                                {selectedSectionImageGridItemsCount})
                              </label>
                              <div className="grid grid-cols-[1fr_84px] gap-2">
                                <PanelRangeInput
                                  min={1}
                                  max={12}
                                  step={1}
                                  value={selectedSectionImageGridItemsCount}
                                  onChange={(value) =>
                                    updateField(
                                      selectedSectionImageGridItemsCountKey,
                                      String(value),
                                    )
                                  }
                                />
                                <PanelInput
                                  type="number"
                                  min={1}
                                  max={12}
                                  step={1}
                                  value={selectedSectionImageGridItemsCount}
                                  onChange={(event) =>
                                    updateField(
                                      selectedSectionImageGridItemsCountKey,
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>

                              <label className="text-xs font-medium text-muted-foreground">
                                Cantidad de columnas ({selectedSectionImageGridColumns})
                              </label>
                              <div className="grid grid-cols-[1fr_84px] gap-2">
                                <PanelRangeInput
                                  min={1}
                                  max={6}
                                  step={1}
                                  value={selectedSectionImageGridColumns}
                                  onChange={(value) =>
                                    updateField(
                                      selectedSectionImageGridColumnsKey,
                                      String(value),
                                    )
                                  }
                                />
                                <PanelInput
                                  type="number"
                                  min={1}
                                  max={6}
                                  step={1}
                                  value={selectedSectionImageGridColumns}
                                  onChange={(event) =>
                                    updateField(
                                      selectedSectionImageGridColumnsKey,
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>

                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-2 py-2 text-xs font-medium text-foreground/90">
                                <input
                                  type="checkbox"
                                  checked={selectedSectionImageGridUseBodyPadding}
                                  onChange={(event) =>
                                    updateField(
                                      selectedSectionImageGridUseBodyPaddingKey,
                                      event.target.checked ? "1" : "0",
                                    )
                                  }
                                />
                                Ajustar al padding del body
                              </label>

                              <label className="text-xs font-medium text-muted-foreground">
                                Tamano de imagen ({selectedSectionImageGridImageSize}px)
                              </label>
                              <div className="grid grid-cols-[1fr_84px] gap-2">
                                <PanelRangeInput
                                  min={120}
                                  max={520}
                                  step={1}
                                  value={selectedSectionImageGridImageSize}
                                  onChange={(value) =>
                                    updateField(
                                      selectedSectionImageGridImageSizeKey,
                                      String(value),
                                    )
                                  }
                                />
                                <PanelInput
                                  type="number"
                                  min={120}
                                  max={520}
                                  step={1}
                                  value={selectedSectionImageGridImageSize}
                                  onChange={(event) =>
                                    updateField(
                                      selectedSectionImageGridImageSizeKey,
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ) : null}

                          {selectedSection.type === "gallery" &&
                          selectedSectionGalleryVariantKey ? (
                            <details className="panel-accordion panel-accordion-inner">
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Version de galeria
                              </summary>
                              <PanelRadioGroup
                                name={`${selectedSection.id}-gallery-variant`}
                                value={selectedSectionGalleryVariant}
                                options={[
                                  { value: "grid", label: "Grid" },
                                  {
                                    value: "carousel",
                                    label: "Carousel",
                                  },
                                  {
                                    value: "stacked",
                                    label: "Stacked",
                                  },
                                  {
                                    value: "editorial",
                                    label: "Editorial",
                                  },
                                ]}
                                onChange={(nextValue) =>
                                  updateField(
                                    selectedSectionGalleryVariantKey,
                                    nextValue,
                                  )
                                }
                              />

                              {selectedSectionGalleryVariant === "grid" &&
                              selectedSectionGalleryGridImageShapeKey ? (
                                <div className="space-y-2 rounded-md border bg-background p-2">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Forma de imagen en grid
                                  </label>
                                  <PanelRadioGroup
                                    name={`${selectedSection.id}-gallery-grid-shape`}
                                    value={selectedSectionGalleryGridImageShape}
                                    options={[
                                      {
                                        value: "square",
                                        label: "Cuadrada",
                                      },
                                      {
                                        value: "portrait",
                                        label: "Vertical",
                                      },
                                      {
                                        value: "landscape",
                                        label: "Horizontal",
                                      },
                                    ]}
                                    onChange={(nextValue) =>
                                      updateField(
                                        selectedSectionGalleryGridImageShapeKey,
                                        nextValue,
                                      )
                                    }
                                  />
                                </div>
                              ) : null}

                              {selectedSectionGalleryCaptionContainerOpacityKey &&
                              selectedSectionGalleryCaptionContainerPaddingXKey &&
                              selectedSectionGalleryCaptionContainerPaddingYKey ? (
                                <div className="space-y-2 rounded-md border bg-background p-2">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Contenedor de texto
                                  </label>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Opacidad de fondo (
                                      {
                                        selectedSectionGalleryCaptionContainerOpacity
                                      }
                                      %)
                                    </label>
                                    <div className="grid grid-cols-[1fr_84px] gap-2">
                                      <PanelRangeInput
                                        min={0}
                                        max={100}
                                        step={1}
                                        value={
                                          selectedSectionGalleryCaptionContainerOpacity
                                        }
                                        onChange={(value) =>
                                          updateField(
                                            selectedSectionGalleryCaptionContainerOpacityKey,
                                            String(value),
                                          )
                                        }
                                      />
                                      <PanelInput
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={1}
                                        value={
                                          selectedSectionGalleryCaptionContainerOpacity
                                        }
                                        onChange={(event) =>
                                          updateField(
                                            selectedSectionGalleryCaptionContainerOpacityKey,
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <SliderValueControl
                                      label="Padding X"
                                      value={
                                        selectedSectionGalleryCaptionContainerPaddingX
                                      }
                                      min={0}
                                      max={80}
                                      onChange={(value) =>
                                        updateField(
                                          selectedSectionGalleryCaptionContainerPaddingXKey,
                                          String(value),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <SliderValueControl
                                      label="Padding Y"
                                      value={
                                        selectedSectionGalleryCaptionContainerPaddingY
                                      }
                                      min={0}
                                      max={80}
                                      onChange={(value) =>
                                        updateField(
                                          selectedSectionGalleryCaptionContainerPaddingYKey,
                                          String(value),
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              ) : null}

                              {(selectedSectionGalleryVariant === "carousel" ||
                                selectedSectionGalleryVariant === "stacked") &&
                              selectedSectionGalleryAutoplaySecondsKey ? (
                                <div className="space-y-2">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Autoplay (
                                      {selectedSectionGalleryAutoplaySeconds}
                                      s)
                                    </label>
                                    <div className="grid grid-cols-[1fr_84px] gap-2">
                                      <PanelRangeInput
                                        min={0}
                                        max={10}
                                        step={1}
                                        value={
                                          selectedSectionGalleryAutoplaySeconds
                                        }
                                        onChange={(value) =>
                                          updateField(
                                            selectedSectionGalleryAutoplaySecondsKey,
                                            String(value),
                                          )
                                        }
                                      />
                                      <PanelInput
                                        type="number"
                                        min={0}
                                        max={10}
                                        step={1}
                                        value={
                                          selectedSectionGalleryAutoplaySeconds
                                        }
                                        onChange={(event) =>
                                          updateField(
                                            selectedSectionGalleryAutoplaySecondsKey,
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                      0 desactiva el avance automatico.
                                    </p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Imagenes del carrusel
                                    </label>
                                    {selectedSectionGalleryItemImageKeys.map(
                                      (imageKey, imageIndex) => {
                                        const titleKey =
                                          selectedSectionGalleryItemTitleKeys[
                                            imageIndex
                                          ];
                                        const modeKey =
                                          selectedSectionGalleryItemCaptionModeKeys[
                                            imageIndex
                                          ];
                                        const subtitleKey =
                                          selectedSectionGalleryItemSubtitleKeys[
                                            imageIndex
                                          ];
                                        const mode =
                                          selectedSectionGalleryItemCaptionModes[
                                            imageIndex
                                          ] ?? "title";

                                        return (
                                          <div
                                            key={imageKey}
                                            className="space-y-2 rounded-md border bg-background p-2"
                                          >
                                            <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                              Imagen {imageIndex + 1}
                                            </p>
                                            <PanelInput
                                              placeholder="https://... (URL imagen)"
                                              value={textMap[imageKey] ?? ""}
                                              onChange={(event) =>
                                                updateField(
                                                  imageKey,
                                                  event.target.value,
                                                )
                                              }
                                            />
                                            <PanelInput
                                              placeholder="Titulo"
                                              value={textMap[titleKey] ?? ""}
                                              onChange={(event) =>
                                                updateField(
                                                  titleKey,
                                                  event.target.value,
                                                )
                                              }
                                            />
                                            <select
                                              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                              value={mode}
                                              onChange={(event) =>
                                                updateField(
                                                  modeKey,
                                                  event.target.value,
                                                )
                                              }
                                            >
                                              <option value="none">
                                                Sin texto
                                              </option>
                                              <option value="title">
                                                Solo titulo
                                              </option>
                                              <option value="title-subtitle">
                                                Titulo + subtitulo
                                              </option>
                                            </select>
                                            {mode === "title-subtitle" ? (
                                              <PanelInput
                                                placeholder="Subtitulo"
                                                value={
                                                  textMap[subtitleKey] ?? ""
                                                }
                                                onChange={(event) =>
                                                  updateField(
                                                    subtitleKey,
                                                    event.target.value,
                                                  )
                                                }
                                              />
                                            ) : null}
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </details>
                          ) : null}

                          {selectedSectionBackgroundModeKey &&
                          selectedSectionBackgroundImageKey &&
                          selectedSectionBackgroundColorKey &&
                          selectedSectionBackgroundGradientKey &&
                          selectedSectionBackgroundZoomKey &&
                          selectedSectionBackgroundPositionXKey &&
                          selectedSectionBackgroundPositionYKey ? (
                            <details className="panel-accordion panel-accordion-inner">
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Fondo de seccion
                              </summary>
                              <div className="mt-2 space-y-2">
                                <PanelRadioGroup
                                  name={`${selectedSection.id}-background-mode`}
                                  value={selectedSectionBackgroundMode}
                                  options={[
                                    {
                                      value: "image",
                                      label: "Imagen",
                                    },
                                    {
                                      value: "color",
                                      label: "Color",
                                    },
                                    {
                                      value: "gradient",
                                      label: "Gradient",
                                    },
                                  ]}
                                  onChange={(nextValue) =>
                                    updateField(
                                      selectedSectionBackgroundModeKey,
                                      nextValue,
                                    )
                                  }
                                />

                                {selectedSectionBackgroundMode === "image" ? (
                                  <div className="space-y-2">
                                    <PanelInput
                                      placeholder="https://..."
                                      value={
                                        textMap[
                                          selectedSectionBackgroundImageKey
                                        ] ?? ""
                                      }
                                      onChange={(event) =>
                                        updateField(
                                          selectedSectionBackgroundImageKey,
                                          event.target.value,
                                        )
                                      }
                                    />
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Zoom (
                                        {selectedSectionBackgroundZoom.toFixed(
                                          2,
                                        )}
                                        x)
                                      </label>
                                      <div className="grid grid-cols-[1fr_84px] gap-2">
                                        <PanelRangeInput
                                          min={1}
                                          max={3}
                                          step={0.05}
                                          value={selectedSectionBackgroundZoom}
                                          onChange={(value) =>
                                            updateField(
                                              selectedSectionBackgroundZoomKey,
                                              String(value),
                                            )
                                          }
                                        />
                                        <PanelInput
                                          type="number"
                                          min={1}
                                          max={3}
                                          step={0.05}
                                          value={selectedSectionBackgroundZoom}
                                          onChange={(event) =>
                                            updateField(
                                              selectedSectionBackgroundZoomKey,
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Posicion X (
                                        {Math.round(
                                          selectedSectionBackgroundPositionX,
                                        )}
                                        %)
                                      </label>
                                      <div className="grid grid-cols-[1fr_84px] gap-2">
                                        <PanelRangeInput
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={
                                            selectedSectionBackgroundPositionX
                                          }
                                          onChange={(value) =>
                                            updateField(
                                              selectedSectionBackgroundPositionXKey,
                                              String(value),
                                            )
                                          }
                                        />
                                        <PanelInput
                                          type="number"
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={Math.round(
                                            selectedSectionBackgroundPositionX,
                                          )}
                                          onChange={(event) =>
                                            updateField(
                                              selectedSectionBackgroundPositionXKey,
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Posicion Y (
                                        {Math.round(
                                          selectedSectionBackgroundPositionY,
                                        )}
                                        %)
                                      </label>
                                      <div className="grid grid-cols-[1fr_84px] gap-2">
                                        <PanelRangeInput
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={
                                            selectedSectionBackgroundPositionY
                                          }
                                          onChange={(value) =>
                                            updateField(
                                              selectedSectionBackgroundPositionYKey,
                                              String(value),
                                            )
                                          }
                                        />
                                        <PanelInput
                                          type="number"
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={Math.round(
                                            selectedSectionBackgroundPositionY,
                                          )}
                                          onChange={(event) =>
                                            updateField(
                                              selectedSectionBackgroundPositionYKey,
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : null}

                                {selectedSectionBackgroundMode === "color" ? (
                                  <PanelColorControl
                                    value={
                                      textMap[selectedSectionBackgroundColorKey]
                                    }
                                    defaultValue="#f4efe5"
                                    placeholder="#f4efe5"
                                    includeTransparentOption
                                    onChange={(nextColor) =>
                                      updateField(
                                        selectedSectionBackgroundColorKey,
                                        nextColor,
                                      )
                                    }
                                  />
                                ) : null}

                                {selectedSectionBackgroundMode ===
                                "gradient" ? (
                                  <PanelInput
                                    placeholder="linear-gradient(135deg, #d9e8d4, #f4efe5)"
                                    value={
                                      textMap[
                                        selectedSectionBackgroundGradientKey
                                      ] ?? ""
                                    }
                                    onChange={(event) =>
                                      updateField(
                                        selectedSectionBackgroundGradientKey,
                                        event.target.value,
                                      )
                                    }
                                  />
                                ) : null}

                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      updateField(
                                        selectedSectionBackgroundModeKey,
                                        "color",
                                      );
                                      updateField(
                                        selectedSectionBackgroundZoomKey,
                                        "1",
                                      );
                                      updateField(
                                        selectedSectionBackgroundPositionXKey,
                                        "50",
                                      );
                                      updateField(
                                        selectedSectionBackgroundPositionYKey,
                                        "50",
                                      );
                                    }}
                                  >
                                    Reset fondo
                                  </Button>
                                </div>
                              </div>
                            </details>
                          ) : null}

                          {selectedSectionBorderWidthKey &&
                          selectedSectionBorderColorKey &&
                          selectedSectionBorderRadiusKey &&
                          selectedSectionBorderStyleKey ? (
                            <details className="panel-accordion panel-accordion-inner">
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Bordes de seccion
                              </summary>
                              <div className="mt-2 space-y-2">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Estilo
                                  </label>
                                  <select
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    value={selectedSectionBorderStyle}
                                    onChange={(event) =>
                                      updateField(
                                        selectedSectionBorderStyleKey,
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                    <option value="none">None</option>
                                  </select>
                                </div>
                                <SliderValueControl
                                  label="Ancho"
                                  value={selectedSectionBorderWidth}
                                  min={0}
                                  max={24}
                                  onChange={(value) =>
                                    updateField(
                                      selectedSectionBorderWidthKey,
                                      String(value),
                                    )
                                  }
                                />
                                <SliderValueControl
                                  label="Radio"
                                  value={selectedSectionBorderRadius}
                                  min={0}
                                  max={120}
                                  onChange={(value) =>
                                    updateField(
                                      selectedSectionBorderRadiusKey,
                                      String(value),
                                    )
                                  }
                                />
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Color
                                  </label>
                                  <PanelColorControl
                                    value={
                                      textMap[selectedSectionBorderColorKey]
                                    }
                                    defaultValue="#d1d5db"
                                    placeholder="#d1d5db"
                                    onChange={(nextColor) =>
                                      updateField(
                                        selectedSectionBorderColorKey,
                                        nextColor,
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      updateField(
                                        selectedSectionBorderStyleKey,
                                        "solid",
                                      );
                                      updateField(
                                        selectedSectionBorderWidthKey,
                                        "1",
                                      );
                                      updateField(
                                        selectedSectionBorderRadiusKey,
                                        "0",
                                      );
                                    }}
                                  >
                                    Reset borde
                                  </Button>
                                </div>
                              </div>
                            </details>
                          ) : null}

                          {selectedSection.type === "footer" &&
                          selectedSectionFooterHeightKey ? (
                            <details className="panel-accordion panel-accordion-inner">
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Altura
                              </summary>
                              <div className="mt-2 space-y-2">
                                <SliderValueControl
                                  label="Altura"
                                  value={selectedSectionFooterHeight}
                                  min={180}
                                  max={1200}
                                  onChange={(value) =>
                                    updateField(
                                      selectedSectionFooterHeightKey,
                                      String(value),
                                    )
                                  }
                                />
                              </div>
                            </details>
                          ) : null}

                          {selectedSection.type === "video" &&
                          selectedSectionVideoHeightKey ? (
                            <details className="panel-accordion panel-accordion-inner">
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Altura de seccion
                              </summary>
                              <div className="mt-2 space-y-2">
                                <SliderValueControl
                                  label="Altura (vh)"
                                  value={selectedSectionVideoHeight}
                                  min={40}
                                  max={300}
                                  onChange={(value) =>
                                    updateField(
                                      selectedSectionVideoHeightKey,
                                      String(value),
                                    )
                                  }
                                />
                              </div>
                            </details>
                          ) : null}

                          {selectedSectionPaddingFieldId ? (
                            <details className="panel-accordion panel-accordion-inner">
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Padding de seccion
                              </summary>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Modo
                                </label>
                                <PanelRadioGroup
                                  name={`${selectedSectionPaddingFieldId}-padding-mode`}
                                  value={selectedSectionPaddingMode}
                                  options={[
                                    { value: "all", label: "All" },
                                    { value: "axis", label: "Axis" },
                                    {
                                      value: "sides",
                                      label: "Sides",
                                    },
                                  ]}
                                  onChange={(nextValue) =>
                                    updateField(
                                      getLandingFieldPaddingModeKey(
                                        selectedSectionPaddingFieldId,
                                      ),
                                      nextValue,
                                    )
                                  }
                                />
                              </div>

                              {selectedSectionPaddingMode === "all" ? (
                                <SliderValueControl
                                  label="Padding"
                                  value={getNumberValue(
                                    textMap[
                                      getLandingFieldPaddingKey(
                                        selectedSectionPaddingFieldId,
                                      )
                                    ],
                                    0,
                                  )}
                                  onChange={(value) =>
                                    updateField(
                                      getLandingFieldPaddingKey(
                                        selectedSectionPaddingFieldId,
                                      ),
                                      String(value),
                                    )
                                  }
                                />
                              ) : null}

                              {selectedSectionPaddingMode === "axis" ? (
                                <div className="grid grid-cols-1 gap-2">
                                  <SliderValueControl
                                    label="Px"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldPaddingXKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                    )}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldPaddingXKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                  <SliderValueControl
                                    label="Py"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldPaddingYKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                    )}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldPaddingYKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                </div>
                              ) : null}

                              {selectedSectionPaddingMode === "sides" ? (
                                <div className="grid grid-cols-1 gap-2">
                                  <SliderValueControl
                                    label="Pt"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldPaddingTopKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                    )}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldPaddingTopKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                  <SliderValueControl
                                    label="Pr"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldPaddingRightKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                    )}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldPaddingRightKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                  <SliderValueControl
                                    label="Pb"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldPaddingBottomKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                    )}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldPaddingBottomKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                  <SliderValueControl
                                    label="Pl"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldPaddingLeftKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                    )}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldPaddingLeftKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                </div>
                              ) : null}
                            </details>
                          ) : null}

                          {selectedSectionPaddingFieldId ? (
                            <details className="panel-accordion panel-accordion-inner">
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Margen de seccion
                              </summary>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Modo
                                </label>
                                <PanelRadioGroup
                                  name={`${selectedSectionPaddingFieldId}-margin-mode`}
                                  value={selectedSectionMarginMode}
                                  options={[
                                    { value: "all", label: "All" },
                                    { value: "axis", label: "Axis" },
                                    { value: "sides", label: "Sides" },
                                  ]}
                                  onChange={(nextValue) =>
                                    updateField(
                                      getLandingFieldMarginModeKey(
                                        selectedSectionPaddingFieldId,
                                      ),
                                      nextValue,
                                    )
                                  }
                                />
                              </div>

                              {selectedSectionMarginMode === "all" ? (
                                <SliderValueControl
                                  label="Margin"
                                  value={getNumberValue(
                                    textMap[
                                      getLandingFieldMarginKey(
                                        selectedSectionPaddingFieldId,
                                      )
                                    ],
                                    0,
                                    -120,
                                    120,
                                  )}
                                  min={-120}
                                  max={120}
                                  onChange={(value) =>
                                    updateField(
                                      getLandingFieldMarginKey(
                                        selectedSectionPaddingFieldId,
                                      ),
                                      String(value),
                                    )
                                  }
                                />
                              ) : null}

                              {selectedSectionMarginMode === "axis" ? (
                                <div className="grid grid-cols-1 gap-2">
                                  <SliderValueControl
                                    label="Mx"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldMarginXKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                      -120,
                                      120,
                                    )}
                                    min={-120}
                                    max={120}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldMarginXKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                  <SliderValueControl
                                    label="My"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldMarginYKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                      -120,
                                      120,
                                    )}
                                    min={-120}
                                    max={120}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldMarginYKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                </div>
                              ) : null}

                              {selectedSectionMarginMode === "sides" ? (
                                <div className="grid grid-cols-1 gap-2">
                                  <SliderValueControl
                                    label="Mt"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldMarginTopKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                      -120,
                                      120,
                                    )}
                                    min={-120}
                                    max={120}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldMarginTopKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                  <SliderValueControl
                                    label="Mr"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldMarginRightKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                      -120,
                                      120,
                                    )}
                                    min={-120}
                                    max={120}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldMarginRightKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                  <SliderValueControl
                                    label="Mb"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldMarginBottomKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                      -120,
                                      120,
                                    )}
                                    min={-120}
                                    max={120}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldMarginBottomKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                  <SliderValueControl
                                    label="Ml"
                                    value={getNumberValue(
                                      textMap[
                                        getLandingFieldMarginLeftKey(
                                          selectedSectionPaddingFieldId,
                                        )
                                      ],
                                      0,
                                      -120,
                                      120,
                                    )}
                                    min={-120}
                                    max={120}
                                    onChange={(value) =>
                                      updateField(
                                        getLandingFieldMarginLeftKey(
                                          selectedSectionPaddingFieldId,
                                        ),
                                        String(value),
                                      )
                                    }
                                  />
                                </div>
                              ) : null}
                            </details>
                          ) : null}
                        </div>
                      </details>

                      <div className="space-y-2">
                        {selectedSection.type === "spore-stack" ? (
                          <div className="space-y-2">
                            {[1, 2, 3, 4].map((sporeIndex) => {
                              const baseKey = `spore${sporeIndex}`;
                              const xKey = getSectionFieldKey(
                                selectedSection.id,
                                `${baseKey}_x`,
                              );
                              const yKey = getSectionFieldKey(
                                selectedSection.id,
                                `${baseKey}_y`,
                              );
                              const sizeKey = getSectionFieldKey(
                                selectedSection.id,
                                `${baseKey}_size`,
                              );
                              const rotateKey = getSectionFieldKey(
                                selectedSection.id,
                                `${baseKey}_rotate`,
                              );
                              const opacityKey = getSectionFieldKey(
                                selectedSection.id,
                                `${baseKey}_opacity`,
                              );
                              const colorKey = getSectionFieldKey(
                                selectedSection.id,
                                `${baseKey}_color`,
                              );
                              const flipXKey = getSectionFieldKey(
                                selectedSection.id,
                                `${baseKey}_flip_x`,
                              );
                              const flipYKey = getSectionFieldKey(
                                selectedSection.id,
                                `${baseKey}_flip_y`,
                              );

                              return (
                                <details
                                  key={`spore-accordion-${sporeIndex}`}
                                  className="panel-accordion"
                                  open={
                                    openPanelAccordionId ===
                                    `top:spore:${sporeIndex}`
                                  }
                                >
                                  <summary
                                    className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      toggleTopLevelAccordion(
                                        `top:spore:${sporeIndex}`,
                                      );
                                    }}
                                  >
                                    Espora {sporeIndex}
                                  </summary>
                                  <div className="mt-2 space-y-2">
                                    <SliderValueControl
                                      label="Posicion X (%)"
                                      value={getNumberValue(
                                        textMap[xKey],
                                        sporeIndex === 1
                                          ? 6
                                          : sporeIndex === 2
                                            ? 86
                                            : sporeIndex === 3
                                              ? 8
                                              : 72,
                                        -50,
                                        150,
                                      )}
                                      min={-50}
                                      max={150}
                                      onChange={(value) =>
                                        updateField(xKey, String(value))
                                      }
                                    />
                                    <SliderValueControl
                                      label="Posicion Y (%)"
                                      value={getNumberValue(
                                        textMap[yKey],
                                        sporeIndex === 1
                                          ? 6
                                          : sporeIndex === 2
                                            ? 22
                                            : sporeIndex === 3
                                              ? 55
                                              : 84,
                                        -50,
                                        150,
                                      )}
                                      min={-50}
                                      max={150}
                                      onChange={(value) =>
                                        updateField(yKey, String(value))
                                      }
                                    />
                                    <SliderValueControl
                                      label="Tamano"
                                      value={getNumberValue(
                                        textMap[sizeKey],
                                        sporeIndex === 1
                                          ? 6
                                          : sporeIndex === 2
                                            ? 21
                                            : sporeIndex === 3
                                              ? 25
                                              : 7,
                                        1,
                                        100,
                                      )}
                                      min={1}
                                      max={100}
                                      onChange={(value) =>
                                        updateField(sizeKey, String(value))
                                      }
                                    />
                                    <SliderValueControl
                                      label="Rotacion"
                                      value={getNumberValue(
                                        textMap[rotateKey],
                                        sporeIndex === 1
                                          ? -16
                                          : sporeIndex === 2
                                            ? 21
                                            : sporeIndex === 3
                                              ? -28
                                              : 14,
                                        -360,
                                        360,
                                      )}
                                      min={-360}
                                      max={360}
                                      onChange={(value) =>
                                        updateField(rotateKey, String(value))
                                      }
                                    />
                                    <SliderValueControl
                                      label="Opacidad (0-100)"
                                      value={getNumberValue(
                                        textMap[opacityKey],
                                        sporeIndex === 2 || sporeIndex === 3
                                          ? 30
                                          : 10,
                                        0,
                                        100,
                                      )}
                                      min={0}
                                      max={100}
                                      onChange={(value) =>
                                        updateField(opacityKey, String(value))
                                      }
                                    />
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Color
                                      </label>
                                      <PanelInput
                                        value={
                                          textMap[colorKey] ??
                                          (sporeIndex === 1
                                            ? "var(--brand-600)"
                                            : sporeIndex === 2
                                              ? "var(--complement-800)"
                                              : sporeIndex === 3
                                                ? "var(--brand-500)"
                                                : "var(--complement-700)")
                                        }
                                        placeholder="var(--brand-600) o #RRGGBB"
                                        onChange={(event) =>
                                          updateField(
                                            colorKey,
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Eje X
                                        </label>
                                        <select
                                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                          value={
                                            textMap[flipXKey] ??
                                            (sporeIndex === 2 ||
                                            sporeIndex === 4
                                              ? "1"
                                              : "0")
                                          }
                                          onChange={(event) =>
                                            updateField(
                                              flipXKey,
                                              event.target.value,
                                            )
                                          }
                                        >
                                          <option value="0">Normal</option>
                                          <option value="1">Invertido</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Eje Y
                                        </label>
                                        <select
                                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                          value={
                                            textMap[flipYKey] ??
                                            (sporeIndex === 3 ||
                                            sporeIndex === 4
                                              ? "1"
                                              : "0")
                                          }
                                          onChange={(event) =>
                                            updateField(
                                              flipYKey,
                                              event.target.value,
                                            )
                                          }
                                        >
                                          <option value="0">Normal</option>
                                          <option value="1">Invertido</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </details>
                              );
                            })}
                          </div>
                        ) : null}
                        {activeSectionItems.map((item) => {
                          if (selectedSection.type === "spore-stack") {
                            return null;
                          }
                          const baseFieldKey =
                            item.kind === "base"
                              ? item.id.replace(/^base:/, "")
                              : null;
                          const baseField = baseFieldKey
                            ? landingSectionCatalog[
                                selectedSection.type
                              ].fields.find(
                                (field) => field.key === baseFieldKey,
                              )
                            : null;
                          const extraItem = item.extraId
                            ? activeSectionExtras.find(
                                (entry) => entry.id === item.extraId,
                              )
                            : null;
                          const extraDefaults = extraItem
                            ? getExtraDefaults(extraItem.type)
                            : null;
                          const isMultiline =
                            baseField?.multiline ??
                            extraDefaults?.multiline ??
                            false;
                          const isLineExtra =
                            extraItem?.type === "line-vertical" ||
                            extraItem?.type === "line-horizontal";
                          const isButtonExtra = extraItem?.type === "button";
                          const buttonVariantValue =
                            textMap[
                              getLandingFieldButtonVariantKey(item.textKey)
                            ] ?? "default";
                          const extraSizeKey =
                            item.kind === "extra"
                              ? getExtraSizeFieldKey(item.textKey)
                              : null;
                          const extraPositionXKey = item.extraId
                            ? getExtraPositionXFieldKey(
                                selectedSection.id,
                                item.extraId,
                              )
                            : null;
                          const extraPositionYKey = item.extraId
                            ? getExtraPositionYFieldKey(
                                selectedSection.id,
                                item.extraId,
                              )
                            : null;
                          const isVideoUrlItem =
                            selectedSection.type === "video" &&
                            item.kind === "base" &&
                            baseFieldKey === "url";
                          const hasKnownVideoControls =
                            isVideoUrlItem &&
                            selectedSectionVideoOverlayOpacityKey &&
                            selectedSectionVideoPositionXKey &&
                            selectedSectionVideoPositionYKey &&
                            selectedSectionVideoZoomKey;

                          return (
                            <details
                              key={`config-${item.id}`}
                              className="panel-accordion"
                              open={
                                openPanelAccordionId === `top:item:${item.id}`
                              }
                            >
                              <summary
                                className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                                onClick={(event) => {
                                  event.preventDefault();
                                  toggleTopLevelAccordion(
                                    `top:item:${item.id}`,
                                  );
                                }}
                              >
                                {item.label}
                                {item.kind === "extra" && item.extraId ? (
                                  <span className="float-right inline-flex items-center">
                                    <Button
                                      type="button"
                                      size="icon-sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        removeExtraElement(
                                          selectedSection.id,
                                          item.extraId!,
                                        );
                                      }}
                                      aria-label="Eliminar elemento"
                                      title="Eliminar elemento"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </span>
                                ) : null}
                              </summary>
                              <div className="mt-2 space-y-2">
                                {isVideoUrlItem ? (
                                  <>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Archivo de video
                                      </label>
                                      <select
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                        value={
                                          VIDEO_ASSET_OPTIONS.includes(
                                            (textMap[item.textKey] ??
                                              "") as (typeof VIDEO_ASSET_OPTIONS)[number],
                                          )
                                            ? ((textMap[item.textKey] ??
                                                "/assets/vid2.mp4") as (typeof VIDEO_ASSET_OPTIONS)[number])
                                            : "/assets/vid2.mp4"
                                        }
                                        onChange={(event) =>
                                          updateField(
                                            item.textKey,
                                            event.target.value,
                                          )
                                        }
                                      >
                                        {VIDEO_ASSET_OPTIONS.map(
                                          (videoPath) => (
                                            <option
                                              key={videoPath}
                                              value={videoPath}
                                            >
                                              {videoPath.replace(
                                                "/assets/",
                                                "",
                                              )}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    </div>
                                    <div className="space-y-2 rounded-md border p-2">
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                        onClick={() =>
                                          addVideoTextItem(selectedSection.id)
                                        }
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        Agregar texto
                                      </button>
                                      {selectedSectionVideoTextItems.map(
                                        (videoTextId, index) => {
                                          const contentKey =
                                            getSectionVideoTextFieldKey(
                                              selectedSection.id,
                                              videoTextId,
                                              "content",
                                            );
                                          const sizeKey =
                                            getSectionVideoTextFieldKey(
                                              selectedSection.id,
                                              videoTextId,
                                              "size",
                                            );
                                          const colorKey =
                                            getSectionVideoTextFieldKey(
                                              selectedSection.id,
                                              videoTextId,
                                              "color",
                                            );
                                          const weightKey =
                                            getSectionVideoTextFieldKey(
                                              selectedSection.id,
                                              videoTextId,
                                              "weight",
                                            );
                                          const positionXKey =
                                            getSectionVideoTextFieldKey(
                                              selectedSection.id,
                                              videoTextId,
                                              "position_x",
                                            );
                                          const positionYKey =
                                            getSectionVideoTextFieldKey(
                                              selectedSection.id,
                                              videoTextId,
                                              "position_y",
                                            );
                                          const textSize = getNumberValue(
                                            textMap[sizeKey],
                                            44,
                                            12,
                                            120,
                                          );
                                          const textPositionX = getNumberValue(
                                            textMap[positionXKey],
                                            50,
                                            0,
                                            100,
                                          );
                                          const textPositionY = getNumberValue(
                                            textMap[positionYKey],
                                            50,
                                            0,
                                            100,
                                          );
                                          const textWeight = getNumberValue(
                                            textMap[weightKey],
                                            700,
                                            400,
                                            900,
                                          );

                                          return (
                                            <details
                                              key={videoTextId}
                                              className="panel-accordion panel-accordion-inner"
                                            >
                                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                                Texto {index + 1}
                                              </summary>
                                              <div className="mt-2 space-y-2">
                                                <div className="flex justify-end">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 px-2 text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                      removeVideoTextItem(
                                                        selectedSection.id,
                                                        videoTextId,
                                                      )
                                                    }
                                                  >
                                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                    Eliminar
                                                  </Button>
                                                </div>
                                                <div className="space-y-1.5">
                                                  <label className="text-xs font-medium text-muted-foreground">
                                                    Contenido
                                                  </label>
                                                  <Textarea
                                                    value={
                                                      textMap[contentKey] ?? ""
                                                    }
                                                    onChange={(event) =>
                                                      updateField(
                                                        contentKey,
                                                        event.target.value,
                                                      )
                                                    }
                                                    rows={3}
                                                    placeholder="Escribi el texto sobre el video"
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <label className="text-xs font-medium text-muted-foreground">
                                                    Color
                                                  </label>
                                                  <PanelColorControl
                                                    value={textMap[colorKey]}
                                                    defaultValue="#ffffff"
                                                    placeholder="#ffffff"
                                                    colorInputClassName="h-9"
                                                    onChange={(nextColor) =>
                                                      updateField(
                                                        colorKey,
                                                        nextColor,
                                                      )
                                                    }
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <label className="text-xs font-medium text-muted-foreground">
                                                    Weight ({textWeight})
                                                  </label>
                                                  <PanelRangeInput
                                                    min={400}
                                                    max={900}
                                                    step={100}
                                                    value={textWeight}
                                                    onChange={(value) =>
                                                      updateField(
                                                        weightKey,
                                                        String(value),
                                                      )
                                                    }
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <label className="text-xs font-medium text-muted-foreground">
                                                    TamaÃ±o ({textSize}px)
                                                  </label>
                                                  <PanelRangeInput
                                                    min={12}
                                                    max={120}
                                                    step={1}
                                                    value={textSize}
                                                    onChange={(value) =>
                                                      updateField(
                                                        sizeKey,
                                                        String(value),
                                                      )
                                                    }
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <label className="text-xs font-medium text-muted-foreground">
                                                    Posicion X ({textPositionX}
                                                    %)
                                                  </label>
                                                  <PanelRangeInput
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    value={textPositionX}
                                                    onChange={(value) =>
                                                      updateField(
                                                        positionXKey,
                                                        String(value),
                                                      )
                                                    }
                                                  />
                                                </div>
                                                <div className="space-y-1.5">
                                                  <label className="text-xs font-medium text-muted-foreground">
                                                    Posicion Y ({textPositionY}
                                                    %)
                                                  </label>
                                                  <PanelRangeInput
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    value={textPositionY}
                                                    onChange={(value) =>
                                                      updateField(
                                                        positionYKey,
                                                        String(value),
                                                      )
                                                    }
                                                  />
                                                </div>
                                              </div>
                                            </details>
                                          );
                                        },
                                      )}
                                    </div>
                                    {hasKnownVideoControls ? (
                                      <>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Transparencia del filtro (
                                            {selectedSectionVideoOverlayOpacity}
                                            %)
                                          </label>
                                          <div className="grid grid-cols-1 gap-2">
                                            <PanelRangeInput
                                              min={0}
                                              max={100}
                                              step={1}
                                              value={
                                                selectedSectionVideoOverlayOpacity
                                              }
                                              onChange={(value) =>
                                                updateField(
                                                  selectedSectionVideoOverlayOpacityKey,
                                                  String(value),
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Posicion X (
                                            {Math.round(
                                              selectedSectionVideoPositionX,
                                            )}
                                            %)
                                          </label>
                                          <div className="grid grid-cols-1 gap-2">
                                            <PanelRangeInput
                                              min={0}
                                              max={100}
                                              step={1}
                                              value={
                                                selectedSectionVideoPositionX
                                              }
                                              onChange={(value) =>
                                                updateField(
                                                  selectedSectionVideoPositionXKey,
                                                  String(value),
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Posicion Y (
                                            {Math.round(
                                              selectedSectionVideoPositionY,
                                            )}
                                            %)
                                          </label>
                                          <div className="grid grid-cols-1 gap-2">
                                            <PanelRangeInput
                                              min={0}
                                              max={100}
                                              step={1}
                                              value={
                                                selectedSectionVideoPositionY
                                              }
                                              onChange={(value) =>
                                                updateField(
                                                  selectedSectionVideoPositionYKey,
                                                  String(value),
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Zoom (
                                            {selectedSectionVideoZoom.toFixed(
                                              2,
                                            )}
                                            x)
                                          </label>
                                          <div className="grid grid-cols-1 gap-2">
                                            <PanelRangeInput
                                              min={1}
                                              max={3}
                                              step={0.05}
                                              value={selectedSectionVideoZoom}
                                              onChange={(value) =>
                                                updateField(
                                                  selectedSectionVideoZoomKey,
                                                  String(value),
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                      </>
                                    ) : null}
                                  </>
                                ) : isLineExtra ? (
                                  <p className="text-xs text-muted-foreground">
                                    Este elemento no requiere texto. Ajusta
                                    tamano, color y margen en este panel.
                                  </p>
                                ) : isMultiline ? (
                                  <Textarea
                                    value={
                                      textMap[item.textKey] ??
                                      baseField?.defaultValue ??
                                      extraDefaults?.text ??
                                      ""
                                    }
                                    onChange={(event) =>
                                      updateField(
                                        item.textKey,
                                        event.target.value,
                                      )
                                    }
                                    rows={4}
                                  />
                                ) : (
                                  <PanelInput
                                    value={
                                      textMap[item.textKey] ??
                                      baseField?.defaultValue ??
                                      extraDefaults?.text ??
                                      ""
                                    }
                                    onChange={(event) =>
                                      updateField(
                                        item.textKey,
                                        event.target.value,
                                      )
                                    }
                                  />
                                )}
                                {item.kind === "base" &&
                                !isVideoUrlItem &&
                                baseFieldKey !== "image" ? (
                                  <>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Fuente
                                      </label>
                                      <select
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                        value={
                                          textMap[
                                            getLandingFieldFontFamilyKey(
                                              item.textKey,
                                            )
                                          ] ?? "fira-sans"
                                        }
                                        onChange={(event) =>
                                          updateField(
                                            getLandingFieldFontFamilyKey(
                                              item.textKey,
                                            ),
                                            event.target.value,
                                          )
                                        }
                                      >
                                        <option value="fira-sans">
                                          Fira Sans
                                        </option>
                                        <option value="montserrat">
                                          Montserrat
                                        </option>
                                        <option value="nunito">Nunito</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Color
                                      </label>
                                      <PanelColorControl
                                        value={
                                          textMap[
                                            getLandingFieldColorKey(
                                              item.textKey,
                                            )
                                          ]
                                        }
                                        defaultValue="#111827"
                                        placeholder="#111827"
                                        showPaletteLabel={false}
                                        onChange={(nextColor) =>
                                          updateField(
                                            getLandingFieldColorKey(
                                              item.textKey,
                                            ),
                                            nextColor,
                                          )
                                        }
                                      />
                                    </div>
                                    {selectedSection?.type ===
                                      "editorial-feature" &&
                                    baseFieldKey === "header_title" &&
                                    selectedSectionEditorialHeaderBackgroundKey ? (
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Fondo del contenedor
                                        </label>
                                        <PanelColorControl
                                          value={
                                            textMap[
                                              selectedSectionEditorialHeaderBackgroundKey
                                            ]
                                          }
                                          defaultValue="#ddd8ca"
                                          placeholder="#ddd8ca"
                                          showPaletteLabel={false}
                                          onChange={(nextColor) =>
                                            updateField(
                                              selectedSectionEditorialHeaderBackgroundKey,
                                              nextColor,
                                            )
                                          }
                                        />
                                      </div>
                                    ) : null}
                                    <SliderValueControl
                                      label="Tamano"
                                      value={getNumberValue(
                                        textMap[getLandingFieldSizeKey(item.textKey)],
                                        baseField?.defaultSize ?? 24,
                                        12,
                                        800,
                                      )}
                                      min={12}
                                      max={800}
                                      onChange={(value) =>
                                        updateField(
                                          getLandingFieldSizeKey(item.textKey),
                                          String(value),
                                        )
                                      }
                                    />
                                    <SliderValueControl
                                      label="Weight"
                                      value={getNumberValue(
                                        textMap[
                                          getLandingFieldFontWeightKey(
                                            item.textKey,
                                          )
                                        ],
                                        400,
                                        100,
                                        900,
                                      )}
                                      min={100}
                                      max={900}
                                      step={100}
                                      onChange={(value) =>
                                        updateField(
                                          getLandingFieldFontWeightKey(
                                            item.textKey,
                                          ),
                                          String(value),
                                        )
                                      }
                                    />
                                    <SliderValueControl
                                      label="Interlineado"
                                      value={getNumberValue(
                                        textMap[
                                          getLandingFieldLineHeightKey(
                                            item.textKey,
                                          )
                                        ],
                                        1.2,
                                        0.8,
                                        3,
                                      )}
                                      min={0.8}
                                      max={3}
                                      step={0.05}
                                      onChange={(value) =>
                                        updateField(
                                          getLandingFieldLineHeightKey(
                                            item.textKey,
                                          ),
                                          String(value),
                                        )
                                      }
                                    />
                                    <SliderValueControl
                                      label="Espaciado letras"
                                      value={getNumberValue(
                                        textMap[
                                          getLandingFieldLetterSpacingKey(
                                            item.textKey,
                                          )
                                        ],
                                        0,
                                        -10,
                                        40,
                                      )}
                                      min={-10}
                                      max={40}
                                      step={0.5}
                                      onChange={(value) =>
                                        updateField(
                                          getLandingFieldLetterSpacingKey(
                                            item.textKey,
                                          ),
                                          String(value),
                                        )
                                      }
                                    />
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Margen
                                      </label>
                                      <PanelRadioGroup
                                        name={`${item.textKey}-margin-mode`}
                                        value={getSpacingModeValue(
                                          textMap[
                                            getLandingFieldMarginModeKey(
                                              item.textKey,
                                            )
                                          ],
                                        )}
                                        options={[
                                          { value: "all", label: "All" },
                                          { value: "axis", label: "Axis" },
                                          { value: "sides", label: "Sides" },
                                        ]}
                                        onChange={(nextValue) =>
                                          updateField(
                                            getLandingFieldMarginModeKey(
                                              item.textKey,
                                            ),
                                            nextValue,
                                          )
                                        }
                                      />
                                    </div>
                                    {getSpacingModeValue(
                                      textMap[
                                        getLandingFieldMarginModeKey(
                                          item.textKey,
                                        )
                                      ],
                                    ) === "all" ? (
                                      <SliderValueControl
                                        label="Margin"
                                        value={getNumberValue(
                                          textMap[
                                            getLandingFieldMarginKey(
                                              item.textKey,
                                            )
                                          ],
                                          0,
                                          -120,
                                          120,
                                        )}
                                        min={-120}
                                        max={120}
                                        onChange={(value) =>
                                          updateField(
                                            getLandingFieldMarginKey(
                                              item.textKey,
                                            ),
                                            String(value),
                                          )
                                        }
                                      />
                                    ) : null}
                                    {getSpacingModeValue(
                                      textMap[
                                        getLandingFieldMarginModeKey(
                                          item.textKey,
                                        )
                                      ],
                                    ) === "axis" ? (
                                      <div className="grid grid-cols-1 gap-2">
                                        <SliderValueControl
                                          label="Mx"
                                          value={getNumberValue(
                                            textMap[
                                              getLandingFieldMarginXKey(
                                                item.textKey,
                                              )
                                            ],
                                            0,
                                            -120,
                                            120,
                                          )}
                                          min={-120}
                                          max={120}
                                          onChange={(value) =>
                                            updateField(
                                              getLandingFieldMarginXKey(
                                                item.textKey,
                                              ),
                                              String(value),
                                            )
                                          }
                                        />
                                        <SliderValueControl
                                          label="My"
                                          value={getNumberValue(
                                            textMap[
                                              getLandingFieldMarginYKey(
                                                item.textKey,
                                              )
                                            ],
                                            0,
                                            -120,
                                            120,
                                          )}
                                          min={-120}
                                          max={120}
                                          onChange={(value) =>
                                            updateField(
                                              getLandingFieldMarginYKey(
                                                item.textKey,
                                              ),
                                              String(value),
                                            )
                                          }
                                        />
                                      </div>
                                    ) : null}
                                    {getSpacingModeValue(
                                      textMap[
                                        getLandingFieldMarginModeKey(
                                          item.textKey,
                                        )
                                      ],
                                    ) === "sides" ? (
                                      <div className="grid grid-cols-1 gap-2">
                                        <SliderValueControl
                                          label="Mt"
                                          value={getNumberValue(
                                            textMap[
                                              getLandingFieldMarginTopKey(
                                                item.textKey,
                                              )
                                            ],
                                            0,
                                            -120,
                                            120,
                                          )}
                                          min={-120}
                                          max={120}
                                          onChange={(value) =>
                                            updateField(
                                              getLandingFieldMarginTopKey(
                                                item.textKey,
                                              ),
                                              String(value),
                                            )
                                          }
                                        />
                                        <SliderValueControl
                                          label="Mr"
                                          value={getNumberValue(
                                            textMap[
                                              getLandingFieldMarginRightKey(
                                                item.textKey,
                                              )
                                            ],
                                            0,
                                            -120,
                                            120,
                                          )}
                                          min={-120}
                                          max={120}
                                          onChange={(value) =>
                                            updateField(
                                              getLandingFieldMarginRightKey(
                                                item.textKey,
                                              ),
                                              String(value),
                                            )
                                          }
                                        />
                                        <SliderValueControl
                                          label="Mb"
                                          value={getNumberValue(
                                            textMap[
                                              getLandingFieldMarginBottomKey(
                                                item.textKey,
                                              )
                                            ],
                                            0,
                                            -120,
                                            120,
                                          )}
                                          min={-120}
                                          max={120}
                                          onChange={(value) =>
                                            updateField(
                                              getLandingFieldMarginBottomKey(
                                                item.textKey,
                                              ),
                                              String(value),
                                            )
                                          }
                                        />
                                        <SliderValueControl
                                          label="Ml"
                                          value={getNumberValue(
                                            textMap[
                                              getLandingFieldMarginLeftKey(
                                                item.textKey,
                                              )
                                            ],
                                            0,
                                            -120,
                                            120,
                                          )}
                                          min={-120}
                                          max={120}
                                          onChange={(value) =>
                                            updateField(
                                              getLandingFieldMarginLeftKey(
                                                item.textKey,
                                              ),
                                              String(value),
                                            )
                                          }
                                        />
                                      </div>
                                    ) : null}
                                  </>
                                ) : null}
                                {item.kind === "extra" &&
                                item.extraId &&
                                extraItem?.type !== "text" ? (
                                  <>
                                    <SliderValueControl
                                      label="Tamano"
                                      value={getNumberValue(
                                        textMap[extraSizeKey!],
                                        extraDefaults?.size ?? 24,
                                        12,
                                        800,
                                      )}
                                      min={12}
                                      max={800}
                                      onChange={(value) =>
                                        updateField(
                                          extraSizeKey!,
                                          String(value),
                                        )
                                      }
                                    />
                                    <SliderValueControl
                                      label="Posicion X"
                                      value={getNumberValue(
                                        textMap[extraPositionXKey!],
                                        50,
                                        0,
                                        100,
                                      )}
                                      min={0}
                                      max={100}
                                      onChange={(value) =>
                                        updateField(
                                          extraPositionXKey!,
                                          String(value),
                                        )
                                      }
                                    />
                                    <SliderValueControl
                                      label="Posicion Y"
                                      value={getNumberValue(
                                        textMap[extraPositionYKey!],
                                        50,
                                        0,
                                        100,
                                      )}
                                      min={0}
                                      max={100}
                                      onChange={(value) =>
                                        updateField(
                                          extraPositionYKey!,
                                          String(value),
                                        )
                                      }
                                    />
                                    {isLineExtra ? (
                                      <>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Color
                                          </label>
                                          <PanelColorControl
                                            value={
                                              textMap[
                                                getLandingFieldColorKey(
                                                  item.textKey,
                                                )
                                              ]
                                            }
                                            defaultValue="#111827"
                                            placeholder="#111827"
                                            showPaletteLabel={false}
                                            onChange={(nextColor) =>
                                              updateField(
                                                getLandingFieldColorKey(
                                                  item.textKey,
                                                ),
                                                nextColor,
                                              )
                                            }
                                          />
                                        </div>
                                        <SliderValueControl
                                          label="Ancho"
                                          value={getNumberValue(
                                            textMap[
                                              getLandingFieldLineWidthKey(
                                                item.textKey,
                                              )
                                            ],
                                            1,
                                            1,
                                            40,
                                          )}
                                          min={1}
                                          max={40}
                                          onChange={(value) =>
                                            updateField(
                                              getLandingFieldLineWidthKey(
                                                item.textKey,
                                              ),
                                              String(value),
                                            )
                                          }
                                        />
                                      </>
                                    ) : null}
                                    {isButtonExtra ? (
                                      <>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Estilo de boton
                                          </label>
                                          <select
                                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                            value={
                                              textMap[
                                                getLandingFieldButtonVariantKey(
                                                  item.textKey,
                                                )
                                              ] ?? "default"
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                getLandingFieldButtonVariantKey(
                                                  item.textKey,
                                                ),
                                                event.target.value,
                                              )
                                            }
                                          >
                                            <option value="default">
                                              Default
                                            </option>
                                            <option value="outline">
                                              Outline
                                            </option>
                                            <option value="secondary">
                                              Secondary
                                            </option>
                                            <option value="ghost">Ghost</option>
                                            <option value="destructive">
                                              Destructive
                                            </option>
                                            <option value="link">Link</option>
                                            <option value="custom">
                                              Custom
                                            </option>
                                          </select>
                                        </div>
                                        {buttonVariantValue === "custom" ? (
                                          <>
                                            <div className="space-y-1.5">
                                              <label className="text-xs font-medium text-muted-foreground">
                                                Fuente
                                              </label>
                                              <select
                                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                                value={
                                                  textMap[
                                                    getLandingFieldFontFamilyKey(
                                                      item.textKey,
                                                    )
                                                  ] ?? "fira-sans"
                                                }
                                                onChange={(event) =>
                                                  updateField(
                                                    getLandingFieldFontFamilyKey(
                                                      item.textKey,
                                                    ),
                                                    event.target.value,
                                                  )
                                                }
                                              >
                                                <option value="fira-sans">
                                                  Fira Sans
                                                </option>
                                                <option value="montserrat">
                                                  Montserrat
                                                </option>
                                                <option value="nunito">
                                                  Nunito
                                                </option>
                                              </select>
                                            </div>
                                            <div className="space-y-1.5">
                                              <label className="text-xs font-medium text-muted-foreground">
                                                Color de texto
                                              </label>
                                              <PanelColorControl
                                                value={
                                                  textMap[
                                                    getLandingFieldColorKey(
                                                      item.textKey,
                                                    )
                                                  ]
                                                }
                                                defaultValue="#ffffff"
                                                placeholder="#ffffff"
                                                showPaletteLabel={false}
                                                onChange={(nextColor) =>
                                                  updateField(
                                                    getLandingFieldColorKey(
                                                      item.textKey,
                                                    ),
                                                    nextColor,
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <label className="text-xs font-medium text-muted-foreground">
                                                Color de fondo
                                              </label>
                                              <PanelColorControl
                                                value={
                                                  textMap[
                                                    getLandingFieldBackgroundColorKey(
                                                      item.textKey,
                                                    )
                                                  ]
                                                }
                                                defaultValue="#1d4ed8"
                                                placeholder="#1d4ed8"
                                                showPaletteLabel={false}
                                                includeTransparentOption
                                                onChange={(nextColor) =>
                                                  updateField(
                                                    getLandingFieldBackgroundColorKey(
                                                      item.textKey,
                                                    ),
                                                    nextColor,
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className="space-y-1.5">
                                              <label className="text-xs font-medium text-muted-foreground">
                                                Color de borde
                                              </label>
                                              <PanelColorControl
                                                value={
                                                  textMap[
                                                    getLandingFieldBorderColorKey(
                                                      item.textKey,
                                                    )
                                                  ]
                                                }
                                                defaultValue="#1f2937"
                                                placeholder="#1f2937"
                                                showPaletteLabel={false}
                                                onChange={(nextColor) =>
                                                  updateField(
                                                    getLandingFieldBorderColorKey(
                                                      item.textKey,
                                                    ),
                                                    nextColor,
                                                  )
                                                }
                                              />
                                            </div>
                                            <SliderValueControl
                                              label="Ancho de borde"
                                              value={getNumberValue(
                                                textMap[
                                                  getLandingFieldBorderWidthKey(
                                                    item.textKey,
                                                  )
                                                ],
                                                1,
                                                0,
                                                20,
                                              )}
                                              min={0}
                                              max={20}
                                              onChange={(value) =>
                                                updateField(
                                                  getLandingFieldBorderWidthKey(
                                                    item.textKey,
                                                  ),
                                                  String(value),
                                                )
                                              }
                                            />
                                            <div className="space-y-1.5">
                                              <label className="text-xs font-medium text-muted-foreground">
                                                Estilo de borde
                                              </label>
                                              <select
                                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                                value={
                                                  textMap[
                                                    getLandingFieldBorderStyleKey(
                                                      item.textKey,
                                                    )
                                                  ] ?? "solid"
                                                }
                                                onChange={(event) =>
                                                  updateField(
                                                    getLandingFieldBorderStyleKey(
                                                      item.textKey,
                                                    ),
                                                    event.target.value,
                                                  )
                                                }
                                              >
                                                <option value="solid">
                                                  Solid
                                                </option>
                                                <option value="dashed">
                                                  Dashed
                                                </option>
                                                <option value="dotted">
                                                  Dotted
                                                </option>
                                                <option value="none">
                                                  None
                                                </option>
                                              </select>
                                            </div>
                                            <SliderValueControl
                                              label="Radio de borde"
                                              value={getNumberValue(
                                                textMap[
                                                  getLandingFieldBorderRadiusKey(
                                                    item.textKey,
                                                  )
                                                ],
                                                8,
                                                0,
                                                80,
                                              )}
                                              min={0}
                                              max={80}
                                              onChange={(value) =>
                                                updateField(
                                                  getLandingFieldBorderRadiusKey(
                                                    item.textKey,
                                                  ),
                                                  String(value),
                                                )
                                              }
                                            />
                                          </>
                                        ) : null}
                                      </>
                                    ) : null}
                                  </>
                                ) : null}
                                {item.kind === "base" &&
                                selectedSection?.type === "editorial-feature" &&
                                baseFieldKey === "image" &&
                                selectedSectionEditorialImageSizeKey ? (
                                  <SliderValueControl
                                    label="Tamaño imagen (%)"
                                    value={getNumberValue(
                                      textMap[selectedSectionEditorialImageSizeKey],
                                      100,
                                      30,
                                      100,
                                    )}
                                    min={30}
                                    max={100}
                                    onChange={(value) =>
                                      updateField(
                                        selectedSectionEditorialImageSizeKey,
                                        String(value),
                                      )
                                    }
                                  />
                                ) : null}
                                {item.kind === "extra" &&
                                extraItem?.type === "text" ? (
                                  <>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Fuente
                                      </label>
                                      <select
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                        value={
                                          textMap[
                                            getLandingFieldFontFamilyKey(
                                              item.textKey,
                                            )
                                          ] ?? "fira-sans"
                                        }
                                        onChange={(event) =>
                                          updateField(
                                            getLandingFieldFontFamilyKey(
                                              item.textKey,
                                            ),
                                            event.target.value,
                                          )
                                        }
                                      >
                                        <option value="fira-sans">
                                          Fira Sans
                                        </option>
                                        <option value="montserrat">
                                          Montserrat
                                        </option>
                                        <option value="nunito">Nunito</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Color
                                      </label>
                                      <PanelColorControl
                                        value={
                                          textMap[
                                            getLandingFieldColorKey(
                                              item.textKey,
                                            )
                                          ]
                                        }
                                        defaultValue="#111827"
                                        placeholder="#111827"
                                        showPaletteLabel={false}
                                        onChange={(nextColor) =>
                                          updateField(
                                            getLandingFieldColorKey(
                                              item.textKey,
                                            ),
                                            nextColor,
                                          )
                                        }
                                      />
                                    </div>
                                    <SliderValueControl
                                      label="Tamano"
                                      value={getNumberValue(
                                        textMap[extraSizeKey!],
                                        extraDefaults?.size ?? 24,
                                        12,
                                        800,
                                      )}
                                      min={12}
                                      max={800}
                                      onChange={(value) =>
                                        updateField(
                                          extraSizeKey!,
                                          String(value),
                                        )
                                      }
                                    />
                                    <SliderValueControl
                                      label="Weight"
                                      value={getNumberValue(
                                        textMap[
                                          getLandingFieldFontWeightKey(
                                            item.textKey,
                                          )
                                        ],
                                        400,
                                        100,
                                        900,
                                      )}
                                      min={100}
                                      max={900}
                                      step={100}
                                      onChange={(value) =>
                                        updateField(
                                          getLandingFieldFontWeightKey(
                                            item.textKey,
                                          ),
                                          String(value),
                                        )
                                      }
                                    />
                                    <SliderValueControl
                                      label="Posicion X"
                                      value={getNumberValue(
                                        textMap[extraPositionXKey!],
                                        50,
                                        0,
                                        100,
                                      )}
                                      min={0}
                                      max={100}
                                      onChange={(value) =>
                                        updateField(
                                          extraPositionXKey!,
                                          String(value),
                                        )
                                      }
                                    />
                                    <SliderValueControl
                                      label="Posicion Y"
                                      value={getNumberValue(
                                        textMap[extraPositionYKey!],
                                        50,
                                        0,
                                        100,
                                      )}
                                      min={0}
                                      max={100}
                                      onChange={(value) =>
                                        updateField(
                                          extraPositionYKey!,
                                          String(value),
                                        )
                                      }
                                    />
                                  </>
                                ) : null}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              <div
                className={cn(
                  "h-full min-h-0 space-y-4 p-4",
                  (!isSectionSettingsView || editingBackgroundScope) &&
                    "hidden",
                )}
              >
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsSectionSettingsView(false)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Volver
                  </Button>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Configuracion de secciones
                  </p>
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Fondos y secciones
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addBackgroundScope}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Fondo
                    </Button>
                  </div>
                  {sectionBuckets.map(({ scope, sections }) => (
                    <div
                      key={scope.id}
                      draggable
                      onDragStart={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest('[data-section-draggable="true"]')) {
                          return;
                        }
                        event.dataTransfer.setData(
                          "application/x-koru-dnd",
                          JSON.stringify({
                            type: "scope",
                            id: scope.id,
                          }),
                        );
                        setDraggedScope(scope.id);
                        setDraggedSection(null);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(event) => {
                        const payload = readDragPayload(event.dataTransfer);
                        if (
                          draggedScopeIdRef.current ||
                          draggedSectionIdRef.current ||
                          payload
                        ) {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDragOverScopeId(scope.id);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const payload = readDragPayload(event.dataTransfer);
                        const activeScopeId =
                          payload?.type === "scope"
                            ? payload.id
                            : draggedScopeIdRef.current;
                        const activeSectionId =
                          payload?.type === "section"
                            ? payload.id
                            : draggedSectionIdRef.current;
                        if (activeScopeId && activeScopeId !== scope.id) {
                          reorderBackgroundScopes(activeScopeId, scope.id);
                        } else if (activeSectionId) {
                          moveSectionToScope(activeSectionId, scope.id);
                        }
                        setDraggedScope(null);
                        setDraggedSection(null);
                        setDragOverScopeId(null);
                        setDragOverSectionId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedScope(null);
                        setDraggedSection(null);
                        setDragOverScopeId(null);
                        setDragOverSectionId(null);
                      }}
                      className={cn(
                        "space-y-2 rounded-md border bg-background p-2",
                        dragOverScopeId === scope.id &&
                          "border-primary bg-primary/5",
                      )}
                    >
                      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
                        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {scope.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {scope.type === "spore" ? "Esporas" : "Plano"} ·
                            Usado {sectionHeightsByScope.get(scope.id) ?? 0}vh
                            de {scope.heightVh}vh
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBackgroundScopeId(scope.id);
                            setIsSectionSettingsView(true);
                          }}
                        >
                          Editar fondo
                        </Button>
                      </div>
                      <div className="space-y-2 pl-2">
                        {sections.length === 0 ? (
                          <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                            Arrastra secciones aca
                          </div>
                        ) : (
                          sections.map((section) => (
                            <div
                              key={section.id}
                              data-section-draggable="true"
                              draggable
                              onDragStart={(event) => {
                                event.stopPropagation();
                                event.dataTransfer.setData(
                                  "application/x-koru-dnd",
                                  JSON.stringify({
                                    type: "section",
                                    id: section.id,
                                  }),
                                );
                                setDraggedSection(section.id);
                                setDraggedScope(null);
                                event.dataTransfer.effectAllowed = "move";
                              }}
                              onDragOver={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                event.dataTransfer.dropEffect = "move";
                                setDragOverSectionId(section.id);
                                setDragOverScopeId(scope.id);
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                const payload = readDragPayload(
                                  event.dataTransfer,
                                );
                                const activeSectionId =
                                  payload?.type === "section"
                                    ? payload.id
                                    : draggedSectionIdRef.current;
                                if (
                                  activeSectionId &&
                                  activeSectionId !== section.id
                                ) {
                                  moveSectionToScope(
                                    activeSectionId,
                                    scope.id,
                                    section.id,
                                  );
                                }
                                setDraggedSection(null);
                                setDragOverSectionId(null);
                                setDragOverScopeId(null);
                              }}
                              onDragEnd={() => {
                                setDraggedSection(null);
                                setDragOverSectionId(null);
                                setDragOverScopeId(null);
                              }}
                              className={cn(
                                "grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 rounded-md border bg-background px-2 py-2 text-sm",
                                dragOverSectionId === section.id &&
                                  "border-primary bg-primary/5",
                              )}
                            >
                              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                              <button
                                type="button"
                                className="min-w-0 flex-1 truncate text-left"
                                onClick={() => focusSection(section.id)}
                              >
                                {section.name}
                              </button>
                              <Badge variant="outline">
                                {landingSectionCatalog[section.type].label}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() =>
                                    reorderSectionWithinScope(section.id, "up")
                                  }
                                  disabled={sections[0]?.id === section.id}
                                  title="Subir seccion"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() =>
                                    reorderSectionWithinScope(
                                      section.id,
                                      "down",
                                    )
                                  }
                                  disabled={
                                    sections[sections.length - 1]?.id ===
                                    section.id
                                  }
                                  title="Bajar seccion"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => removeSection(section.id)}
                                disabled={structure.length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Agregar nueva seccion
                  </p>
                  <div className="space-y-2">
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      value={newSectionType}
                      onChange={(event) =>
                        setNewSectionType(
                          event.target.value as LandingSectionType,
                        )
                      }
                    >
                      {Object.values(landingSectionCatalog).map((item) =>
                        item.type !== "footer" ? (
                          <option key={item.type} value={item.type}>
                            {item.label}
                          </option>
                        ) : null,
                      )}
                    </select>
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      value={addSectionTargetScopeId ?? ""}
                      onChange={(event) =>
                        setNewSectionScopeId(event.target.value || null)
                      }
                    >
                      {backgroundScopes.map((scope) => (
                        <option key={scope.id} value={scope.id}>
                          {scope.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end">
                      <Button type="button" size="sm" onClick={addSection}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "h-full min-h-0 space-y-2 p-4",
                  editorMode !== "layout" && "hidden",
                )}
              >
                {statusMessage ? (
                  <p className="text-xs text-muted-foreground">
                    {statusMessage}
                  </p>
                ) : null}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Edicion responsive
                  </label>
                  <PanelRadioGroup
                    name="layout-responsive-mode"
                    value={responsiveEditMode}
                    options={[
                      {
                        value: "large",
                        label: <Monitor className="h-4 w-4" />,
                        srLabel: "Grande",
                      },
                      {
                        value: "medium",
                        label: <Laptop className="h-4 w-4" />,
                        srLabel: "Mediana",
                      },
                      {
                        value: "tablet",
                        label: <Tablet className="h-4 w-4" />,
                        srLabel: "Tablet",
                      },
                      {
                        value: "mobile",
                        label: <Smartphone className="h-4 w-4" />,
                        srLabel: "Movil",
                      },
                    ]}
                    onChange={(nextValue) =>
                      setResponsiveEditMode(nextValue as LandingResponsiveMode)
                    }
                  />
                </div>
                <details
                  className="panel-accordion"
                  open={openPanelAccordionId === "layout:attributes"}
                >
                  <summary
                    className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                    onClick={(event) => {
                      event.preventDefault();
                      toggleTopLevelAccordion("layout:attributes");
                    }}
                  >
                    Atributos generales
                  </summary>
                  <div className="mt-2 space-y-3">

                    {selectedLayoutSectionId === "layout-navbar" ? (
                      <>
                        <details className="panel-accordion panel-accordion-inner">
                          <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            Colores
                          </summary>
                          <div className="mt-2 space-y-2 rounded-md border bg-background p-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Fondo navbar
                              </label>
                              <PanelColorControl
                                value={
                                  textMap[LANDING_LAYOUT_NAV_BG_KEY] ??
                                  "#ffffff"
                                }
                                defaultValue="#ffffff"
                                showPaletteLabel={false}
                                onChange={(nextColor) =>
                                  updateLayoutField(
                                    LANDING_LAYOUT_NAV_BG_KEY,
                                    nextColor,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Texto navbar
                              </label>
                              <PanelColorControl
                                value={
                                  textMap[LANDING_LAYOUT_NAV_TEXT_KEY] ??
                                  "#111111"
                                }
                                defaultValue="#111111"
                                showPaletteLabel={false}
                                onChange={(nextColor) =>
                                  updateLayoutField(
                                    LANDING_LAYOUT_NAV_TEXT_KEY,
                                    nextColor,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </details>

                        <details className="panel-accordion panel-accordion-inner">
                          <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            Dimensiones
                          </summary>
                          <div className="mt-2 space-y-2 rounded-md border bg-background p-2">
                            <SliderValueControl
                              label="Altura navbar (px)"
                              value={layoutNavHeight}
                              min={64}
                              max={180}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  LANDING_LAYOUT_NAV_HEIGHT_KEY,
                                  String(nextValue),
                                )
                              }
                            />
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Altura exacta (px)
                              </label>
                              <PanelInput
                                type="number"
                                min={64}
                                max={180}
                                value={layoutNavHeight}
                                onChange={(event) =>
                                  updateLayoutField(
                                    LANDING_LAYOUT_NAV_HEIGHT_KEY,
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </details>
                      </>
                    ) : null}

                    {selectedLayoutSectionId === "layout-body" ? (
                      <details className="panel-accordion panel-accordion-inner">
                        <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          Body
                        </summary>
                        <div className="mt-2 space-y-2 rounded-md border bg-background p-2">
                          <SliderValueControl
                            label="Padding X del body (px)"
                            value={layoutPaddingX}
                            min={0}
                            max={400}
                            step={1}
                            onChange={(nextValue) =>
                              updateLayoutField(
                                LANDING_LAYOUT_PADDING_X_KEY,
                                String(nextValue),
                                { responsiveScoped: true },
                              )
                            }
                          />
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                              Padding exacto (px)
                            </label>
                            <PanelInput
                              type="number"
                              min={0}
                              max={400}
                              value={layoutPaddingX}
                              onChange={(event) =>
                                updateLayoutField(
                                  LANDING_LAYOUT_PADDING_X_KEY,
                                  event.target.value,
                                  { responsiveScoped: true },
                                )
                              }
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            El padding del body aplica al contenido de las
                            secciones, no al navbar/footer ni al ancho de la
                            seccion.
                          </p>
                        </div>
                      </details>
                    ) : null}

                    {selectedLayoutSectionId === "layout-footer" ? (
                      <>
                        <details className="panel-accordion panel-accordion-inner">
                          <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            Colores
                          </summary>
                          <div className="mt-2 space-y-2 rounded-md border bg-background p-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Fondo footer
                              </label>
                              <PanelColorControl
                                value={
                                  textMap[LANDING_LAYOUT_FOOTER_BG_KEY] ??
                                  "#d8cfb6"
                                }
                                defaultValue="#d8cfb6"
                                showPaletteLabel={false}
                                onChange={(nextColor) =>
                                  updateLayoutField(
                                    LANDING_LAYOUT_FOOTER_BG_KEY,
                                    nextColor,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </details>

                        <details className="panel-accordion panel-accordion-inner">
                          <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            Dimensiones
                          </summary>
                          <div className="mt-2 space-y-2 rounded-md border bg-background p-2">
                            <SliderValueControl
                              label="Altura footer (px)"
                              value={layoutFooterHeight}
                              min={120}
                              max={600}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  LANDING_LAYOUT_FOOTER_HEIGHT_KEY,
                                  String(nextValue),
                                )
                              }
                            />
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Altura exacta (px)
                              </label>
                              <PanelInput
                                type="number"
                                min={120}
                                max={600}
                                value={layoutFooterHeight}
                                onChange={(event) =>
                                  updateLayoutField(
                                    LANDING_LAYOUT_FOOTER_HEIGHT_KEY,
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </details>
                      </>
                    ) : null}
                  </div>
                </details>
                <div className="h-px w-full bg-border/80" />

                {selectedLayoutSectionId === "layout-navbar" ? (
                  <>
                    <details className="panel-accordion" open>
                      <summary
                        className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                        onClick={() => setEditingLayoutContainerId(null)}
                      >
                        <span className="flex-1 truncate">{logoContainerName}</span>
                        <button
                          type="button"
                          className="container-edit-button inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-background"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setEditingLayoutContainerId((current) =>
                              current === "navbar-logo" ? null : "navbar-logo",
                            );
                          }}
                          aria-label="Editar atributos del contenedor logo"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </summary>
                      <div className="mt-2 space-y-2 rounded-none border bg-background p-2">
                        {editingLayoutContainerId === "navbar-logo" ? (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Nombre contenedor
                              </label>
                              <PanelInput
                                value={logoContainerName}
                                onChange={(event) =>
                                  updateLayoutField(
                                    getLayoutNavContainerNameKey("navbar-logo"),
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <SliderValueControl
                              label="Padding X"
                              value={logoContainerPaddingX}
                              min={0}
                              max={200}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutNavContainerPaddingXKey(
                                    "navbar-logo",
                                  ),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Padding Y"
                              value={logoContainerPaddingY}
                              min={0}
                              max={200}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutNavContainerPaddingYKey(
                                    "navbar-logo",
                                  ),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Ancho"
                              value={getNumberValue(textMap[getLayoutContainerWidthKey("navbar-logo")], 0, 0, 1200)}
                              min={0}
                              max={1200}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutContainerWidthKey("navbar-logo"),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Alto"
                              value={getNumberValue(textMap[getLayoutContainerHeightKey("navbar-logo")], 0, 0, 600)}
                              min={0}
                              max={600}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutContainerHeightKey("navbar-logo"),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Margen X"
                              value={getNumberValue(textMap[getLayoutContainerMarginXKey("navbar-logo")], 0, 0, 300)}
                              min={0}
                              max={300}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutContainerMarginXKey("navbar-logo"),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Margen Y"
                              value={getNumberValue(textMap[getLayoutContainerMarginYKey("navbar-logo")], 0, 0, 300)}
                              min={0}
                              max={300}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutContainerMarginYKey("navbar-logo"),
                                  String(nextValue),
                                )
                              }
                            />
                          </>
                        ) : (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Logo URL
                              </label>
                              <PanelInput
                                value={
                                  textMap[LANDING_LAYOUT_NAV_LOGO_SRC_KEY] ??
                                  "/branding/koru-logo.png"
                                }
                                onChange={(event) =>
                                  updateLayoutField(
                                    LANDING_LAYOUT_NAV_LOGO_SRC_KEY,
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Logo alt
                              </label>
                              <PanelInput
                                value={
                                  textMap[LANDING_LAYOUT_NAV_LOGO_ALT_KEY] ??
                                  "Koru"
                                }
                                onChange={(event) =>
                                  updateLayoutField(
                                    LANDING_LAYOUT_NAV_LOGO_ALT_KEY,
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </details>

                    <details className="panel-accordion" open>
                      <summary
                        className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                        onClick={() => setEditingLayoutContainerId(null)}
                      >
                        <span className="flex-1 truncate">{navOptionsContainerName}</span>
                        <button
                          type="button"
                          className="container-edit-button inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-background"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setEditingLayoutContainerId((current) =>
                              current === "navbar-options"
                                ? null
                                : "navbar-options",
                            );
                          }}
                          aria-label="Editar atributos del contenedor opciones"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </summary>
                      <div className="mt-2 space-y-2 rounded-none border bg-muted/20 p-2">
                        {editingLayoutContainerId === "navbar-options" ? (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Nombre contenedor
                              </label>
                              <PanelInput
                                value={navOptionsContainerName}
                                onChange={(event) =>
                                  updateLayoutField(
                                    getLayoutNavContainerNameKey(
                                      "navbar-options",
                                    ),
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <SliderValueControl
                              label="Padding X"
                              value={navOptionsPaddingX}
                              min={0}
                              max={200}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutNavContainerPaddingXKey(
                                    "navbar-options",
                                  ),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Padding Y"
                              value={navOptionsPaddingY}
                              min={0}
                              max={200}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutNavContainerPaddingYKey(
                                    "navbar-options",
                                  ),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Ancho"
                              value={getNumberValue(textMap[getLayoutContainerWidthKey("navbar-options")], 0, 0, 1200)}
                              min={0}
                              max={1200}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutContainerWidthKey("navbar-options"),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Alto"
                              value={getNumberValue(textMap[getLayoutContainerHeightKey("navbar-options")], 0, 0, 600)}
                              min={0}
                              max={600}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutContainerHeightKey("navbar-options"),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Margen X"
                              value={getNumberValue(textMap[getLayoutContainerMarginXKey("navbar-options")], 0, 0, 300)}
                              min={0}
                              max={300}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutContainerMarginXKey("navbar-options"),
                                  String(nextValue),
                                )
                              }
                            />
                            <SliderValueControl
                              label="Margen Y"
                              value={getNumberValue(textMap[getLayoutContainerMarginYKey("navbar-options")], 0, 0, 300)}
                              min={0}
                              max={300}
                              step={1}
                              onChange={(nextValue) =>
                                updateLayoutField(
                                  getLayoutContainerMarginYKey("navbar-options"),
                                  String(nextValue),
                                )
                              }
                            />
                          </>
                        ) : (
                          <>
                            {layoutNavLinks.map((item, index) => (
                              <details
                                key={item.id}
                                className="panel-accordion panel-accordion-inner"
                              >
                                <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                  Opcion {index + 1}
                                </summary>
                                <div className="mt-2 grid grid-cols-1 gap-2 rounded-none border bg-background p-2">
                                  <div className="flex justify-end">
                                    <Button
                                      type="button"
                                      size="icon-sm"
                                      variant="ghost"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() =>
                                        updateLayoutNavLinks((links) =>
                                          links.length <= 1
                                            ? links
                                            : links.filter(
                                                (entry) => entry.id !== item.id,
                                              ),
                                        )
                                      }
                                      disabled={layoutNavLinks.length <= 1}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <PanelInput
                                    value={item.label}
                                    onChange={(event) =>
                                      updateLayoutNavLinks((links) =>
                                        links.map((entry) =>
                                          entry.id === item.id
                                            ? {
                                                ...entry,
                                                label: event.target.value,
                                              }
                                            : entry,
                                        ),
                                      )
                                    }
                                    placeholder="Texto"
                                  />
                                  <PanelInput
                                    value={item.href}
                                    onChange={(event) =>
                                      updateLayoutNavLinks((links) =>
                                        links.map((entry) =>
                                          entry.id === item.id
                                            ? {
                                                ...entry,
                                                href: event.target.value,
                                              }
                                            : entry,
                                        ),
                                      )
                                    }
                                    placeholder="URL o ancla"
                                  />
                                </div>
                              </details>
                            ))}
                            <div className="pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateLayoutNavLinks((links) => [
                                    ...links,
                                    {
                                      id: createLayoutNavLinkId(),
                                      label: `Nueva opcion ${links.length + 1}`,
                                      href: "#",
                                    },
                                  ])
                                }
                              >
                                Agregar opcion
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </details>
                  </>
                ) : null}

                {selectedLayoutSectionId === "layout-footer" ? (
                  <>
                    {landingLayoutContainerRules.footer.allowArrangementSelect ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Disposicion de contenedores
                        </label>
                        <PanelRadioGroup
                          name="layout-footer-containers-layout"
                          value={footerContainerArrangement}
                          options={[...getContainerLayoutOptions()]}
                          onChange={(nextValue) =>
                            updateLayoutField(
                              LANDING_LAYOUT_FOOTER_CONTAINERS_LAYOUT_KEY,
                              nextValue,
                            )
                          }
                        />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
                      onClick={() => addFooterContainer(null)}
                    >
                      + Agregar contenedor
                    </button>
                    {footerRootContainers.map((container) =>
                      renderFooterContainerAccordion(container),
                    )}
                  </>
                ) : null}
              </div>

              <div
                className={cn(
                  "h-full min-h-0 space-y-4 p-4",
                  !editingBackgroundScope && "hidden",
                )}
              >
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingBackgroundScopeId(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Volver
                  </Button>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Editar fondo
                  </p>
                </div>

                {editingBackgroundScope ? (
                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        Nombre
                      </label>
                      <PanelInput
                        value={editingBackgroundScope.name}
                        onChange={(event) =>
                          updateBackgroundScope(editingBackgroundScope.id, {
                            name: event.target.value,
                          })
                        }
                        placeholder="Nombre del fondo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        Tipo
                      </label>
                      <select
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                        value={editingBackgroundScope.type}
                        onChange={(event) =>
                          updateBackgroundScope(editingBackgroundScope.id, {
                            type: event.target.value as "none" | "spore",
                          })
                        }
                      >
                        <option value="none">Plano</option>
                        <option value="spore">Esporas</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          Visual
                        </label>
                        <select
                          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                          value={editingBackgroundScope.visualMode}
                          onChange={(event) =>
                            updateBackgroundScope(editingBackgroundScope.id, {
                              visualMode: event.target.value as
                                | "color"
                                | "gradient",
                            })
                          }
                        >
                          <option value="color">Color</option>
                          <option value="gradient">Gradiente</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          Altura (vh)
                        </label>
                        <PanelInput
                          type="number"
                          min={100}
                          max={2000}
                          value={editingBackgroundScope.heightVh}
                          onChange={(event) => {
                            const parsed = Number.parseInt(
                              event.target.value,
                              10,
                            );
                            if (Number.isFinite(parsed)) {
                              updateBackgroundScope(editingBackgroundScope.id, {
                                heightVh: Math.min(2000, Math.max(100, parsed)),
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {editingBackgroundScope.visualMode === "gradient"
                          ? "Gradiente CSS"
                          : "Color"}
                      </label>
                      <PanelInput
                        value={
                          editingBackgroundScope.visualMode === "gradient"
                            ? editingBackgroundScope.gradient
                            : editingBackgroundScope.color
                        }
                        onChange={(event) =>
                          updateBackgroundScope(editingBackgroundScope.id, {
                            ...(editingBackgroundScope.visualMode === "gradient"
                              ? { gradient: event.target.value }
                              : { color: event.target.value }),
                          })
                        }
                        placeholder={
                          editingBackgroundScope.visualMode === "gradient"
                            ? "linear-gradient(180deg,#fff 0%,#f8f8f8 100%)"
                            : "#ffffff o var(--brand-600)"
                        }
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Usado{" "}
                      {sectionHeightsByScope.get(editingBackgroundScope.id) ??
                        0}
                      vh de {editingBackgroundScope.heightVh}vh
                    </p>
                    <div className="pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          removeBackgroundScope(editingBackgroundScope.id)
                        }
                        disabled={backgroundScopes.length <= 1}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Eliminar fondo
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>,
        portalTarget,
      )
    : null;

  return (
    <CmsPreviewFrame
      title={
        editorMode === "layout"
          ? "Layout builder (edicion global)"
          : "Landing builder (edicion inline)"
      }
      frameVariant={frameVariant}
      compactSpacing={compactPreviewSpacing}
      scrollRef={previewScrollRef}
      viewportScroll={previewUrl ? "hidden" : "auto"}
      viewportHeightClassName={previewUrl ? "h-[74vh]" : undefined}
      actions={
        <>
          <div className="flex items-center gap-1 rounded-md border bg-background px-1 py-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={handlePreviewZoomOut}
              disabled={previewZoom <= PREVIEW_ZOOM_MIN}
              title="Alejar vista"
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Alejar vista</span>
            </Button>
            <Input
              type="number"
              min={PREVIEW_ZOOM_MIN}
              max={PREVIEW_ZOOM_MAX}
              step={PREVIEW_ZOOM_STEP}
              className="h-8 w-20 text-center text-xs"
              value={previewZoom}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                if (!Number.isNaN(parsed)) {
                  applyPreviewZoom(parsed);
                }
              }}
              title="Zoom de vista previa (%)"
            />
            <span className="text-xs text-muted-foreground">%</span>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={handlePreviewZoomIn}
              disabled={previewZoom >= PREVIEW_ZOOM_MAX}
              title="Acercar vista"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Acercar vista</span>
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={handlePreviewZoomReset}
              title="Resetear zoom a 100%"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only">Resetear zoom</span>
            </Button>
          </div>
          {panelPortal}
        </>
      }
    >
      <div
        className={cn(
          "flex w-full justify-center p-4",
          frameVariant === "flush" && "p-0",
          compactPreviewSpacing && "p-1 md:p-1.5",
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className="pointer-events-none relative h-6 rounded-md border bg-background/95 shadow-sm"
            style={{
              width: `${previewCanvasDisplayWidth}px`,
              minWidth: `${previewCanvasDisplayWidth}px`,
            }}
            aria-hidden
          >
            {isDraggingLayoutBodyPadding ? (
              <span className="absolute top-8 left-1/2 z-10 -translate-x-1/2 rounded-sm border border-[#374151]/30 bg-background px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#374151]">
                {layoutPaddingX}px
              </span>
            ) : null}
            {previewRulerMarks.map((mark) => {
              const isMajor = mark % 10 === 0;
              const isMedium = mark % 5 === 0;
              return (
                <div
                  key={`vw-mark-${mark}`}
                  className="absolute bottom-0"
                  style={{
                    left: `${mark}%`,
                    transform: "translateX(-0.5px)",
                  }}
                >
                  <div
                    className={cn(
                      "w-px bg-[#374151]",
                      isMajor
                        ? "h-3 opacity-95"
                        : isMedium
                          ? "h-2 opacity-75"
                          : "h-1 opacity-55",
                    )}
                  />
                  {isMajor ? (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-medium tabular-nums text-[#374151]">
                      {mark}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div
            className="origin-top-left"
            style={{
              zoom: effectivePreviewScale,
              width: `${previewCanvasWidth}px`,
            }}
          >
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title={`Preview ${previewUrl}`}
                className="w-full rounded-lg border border-slate-200 bg-white"
                style={{
                  minHeight: `${Math.max(
                    640,
                    Math.round(previewViewportHeightForContent ?? 820),
                  )}px`,
                }}
              />
            ) : (
              <div
                onClickCapture={(event) => {
                  const target = event.target as HTMLElement;
                  if (
                    target.closest("a") ||
                    target.closest("button") ||
                    target.closest("form")
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <LandingPageLayout
                  textMap={{
                    ...rawTextMap,
                    [LANDING_BACKGROUND_SCOPES_KEY]:
                      JSON.stringify(backgroundScopes),
                    [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
                  }}
                  previewViewportHeight={previewViewportHeightForContent}
                  previewMode
                  responsiveMode={responsiveEditMode}
                  selectedLayoutSectionId={
                    editorMode === "layout" ? selectedLayoutSectionId : null
                  }
                  onSelectLayoutSection={
                    editorMode === "layout"
                      ? (sectionId) => {
                          setSelectedLayoutSectionId(sectionId);
                          setPanelOpen(true);
                          scrollPreviewToLayoutSection(sectionId);
                        }
                      : undefined
                  }
                  onLayoutBodyPaddingXChange={
                    editorMode === "layout"
                      ? handleLayoutBodyPaddingXChange
                      : undefined
                  }
                  onLayoutBodyPaddingXDragStateChange={
                    editorMode === "layout"
                      ? setIsDraggingLayoutBodyPadding
                      : undefined
                  }
                >
                  <LandingView
                    textMap={{
                      ...rawTextMap,
                      [LANDING_BACKGROUND_SCOPES_KEY]:
                        JSON.stringify(backgroundScopes),
                      [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
                    }}
                    previewMode
                    responsiveMode={responsiveEditMode}
                    selectedFieldId={selectedFieldId}
                    onSelectField={handleSelectField}
                    onMoveSectionExtraPosition={handleMoveSectionExtraPosition}
                  />
                </LandingPageLayout>
              </div>
            )}
          </div>
            </div>
      </div>
    </CmsPreviewFrame>
  );
}

