"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  SlidersHorizontal,
  ChevronRight,
  ChevronsRight,
  ChevronLeft,
  GripVertical,
  Trash2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  LANDING_STRUCTURE_KEY,
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
  getSectionExtrasKey,
  getSectionFieldKey,
  getSectionFooterHeightKey,
  getSectionFooterMinHeightKey,
  getSectionItemsOrderKey,
  landingSectionCatalog,
  parseSectionExtraElements,
  parseSectionItemsOrder,
  parseLandingStructure,
  type LandingSectionInstance,
  type SectionExtraElementType,
  type LandingSectionType,
} from "@/modules/landing/config/landing-sections";
import {
  getLandingFieldBackgroundColorKey,
  getLandingFieldBorderColorKey,
  getLandingFieldBorderRadiusKey,
  getLandingFieldBorderStyleKey,
  getLandingFieldBorderWidthKey,
  getLandingFieldButtonVariantKey,
  getLandingFieldColorKey,
  getLandingFieldFontFamilyKey,
  getLandingFieldLineWidthKey,
  getLandingFieldFontWeightKey,
  getLandingFieldPaddingKey,
  getLandingFieldPaddingBottomKey,
  getLandingFieldPaddingLeftKey,
  getLandingFieldPaddingModeKey,
  getLandingFieldPaddingRightKey,
  getLandingFieldPaddingTopKey,
  getLandingFieldPaddingXKey,
  getLandingFieldPaddingYKey,
  getLandingFieldSizeKey,
  type SpacingMode,
} from "@/modules/landing/types/landing-text";
import { publishCmsAction } from "@/modules/cms/server/cms-text.actions";
import { LandingView } from "@/modules/landing/views/landing-view";

type LandingTextMap = Record<string, string>;

type CmsLandingEditorProps = {
  initialTextMap: LandingTextMap;
};

type SectionItem = {
  id: string;
  label: string;
  textKey: string;
  kind: "base" | "extra";
  extraId?: string;
};

function createSectionId(type: LandingSectionType) {
  return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

function getNumberValue(
  raw: string | undefined,
  fallback: number,
  min = 0,
  max = 120,
) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
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
  label: string;
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
    <div className={cn("grid grid-cols-[26px_1fr_26px] items-center gap-2", className)}>
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
                aria-label={isTransparent ? "Color transparente" : `Color ${color}`}
                className={cn(
                  "rounded-sm border border-black/30",
                  isActive && "ring-2 ring-primary ring-offset-1",
                )}
                style={{
                  backgroundColor: isTransparent ? "transparent" : color,
                  backgroundImage: isTransparent
                    ? "linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%, #d1d5db), linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%, #d1d5db)"
                    : undefined,
                  backgroundPosition: isTransparent ? "0 0, 4px 4px" : undefined,
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

function parseSectionVideoTextItems(textMap: LandingTextMap, sectionId: string) {
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
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [] as string[];
  }
}

const PREVIEW_ZOOM_MIN = 30;
const PREVIEW_ZOOM_MAX = 200;
const PREVIEW_ZOOM_STEP = 10;
const PREVIEW_ZOOM_DEFAULT = 100;
const PREVIEW_ZOOM_BASE_SCALE = 0.7;
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

export function CmsLandingEditor({ initialTextMap }: CmsLandingEditorProps) {
  const initialStructure = parseLandingStructure(initialTextMap);
  const [textMap, setTextMap] = useState<LandingTextMap>(() =>
    ensureLandingDefaults(initialTextMap),
  );
  const [structure, setStructure] =
    useState<LandingSectionInstance[]>(initialStructure);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialStructure[0]?.id ?? null,
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [newSectionType, setNewSectionType] =
    useState<LandingSectionType>("hero");
  const [statusMessage, setStatusMessage] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSectionSettingsView, setIsSectionSettingsView] = useState(false);
  const [openPanelAccordionId, setOpenPanelAccordionId] = useState<string | null>(
    null,
  );
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(
    null,
  );
  const [previewZoom, setPreviewZoom] = useState(PREVIEW_ZOOM_DEFAULT);
  const [previewViewportHeight, setPreviewViewportHeight] = useState(0);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const nextExtraIdRef = useRef(1);
  const nextVideoTextIdRef = useRef(1);
  const effectivePreviewScale = (previewZoom / 100) * PREVIEW_ZOOM_BASE_SCALE;
  const previewViewportHeightForContent =
    previewViewportHeight > 0 && effectivePreviewScale > 0
      ? previewViewportHeight / effectivePreviewScale
      : undefined;

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

  const activeSectionId = selectedSectionId ?? structure[0]?.id ?? null;
  const selectedSection = useMemo(
    () => structure.find((item) => item.id === activeSectionId) ?? null,
    [activeSectionId, structure],
  );
  const activeSectionIndex = activeSectionId
    ? structure.findIndex((item) => item.id === activeSectionId)
    : -1;
  const selectedSectionPaddingFieldId = selectedSection
    ? getSectionFieldKey(selectedSection.id, "__section_padding")
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
  const selectedSectionPaddingMode = selectedSectionPaddingFieldId
    ? getSpacingModeValue(
        textMap[getLandingFieldPaddingModeKey(selectedSectionPaddingFieldId)],
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
    selectedSectionVideoZoomKey ? (textMap[selectedSectionVideoZoomKey] ?? "") : "",
  );
  const selectedSectionVideoZoom = Number.isFinite(selectedSectionVideoZoomRaw)
    ? clamp(selectedSectionVideoZoomRaw, 1, 3)
    : 1;
  const selectedSectionVideoTextItems = useMemo(
    () =>
      selectedSection ? parseSectionVideoTextItems(textMap, selectedSection.id) : [],
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
    setTextMap((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  }

  function commitStructure(nextStructure: LandingSectionInstance[]) {
    setStructure(nextStructure);
    setTextMap((previous) => ({
      ...previous,
      [LANDING_STRUCTURE_KEY]: JSON.stringify(nextStructure),
    }));
  }

  function addSection() {
    const id = createSectionId(newSectionType);
    const def = getTypeDefaults(newSectionType);
    const newSection: LandingSectionInstance = {
      id,
      type: newSectionType,
      name: `${def.label} ${structure.filter((item) => item.type === newSectionType).length + 1}`,
    };
    const nextStructure = [...structure, newSection];

    setTextMap((previous) => {
      const next: LandingTextMap = {
        ...previous,
        [LANDING_STRUCTURE_KEY]: JSON.stringify(nextStructure),
        [getSectionExtrasKey(id)]: "[]",
        [getSectionItemsOrderKey(id)]: JSON.stringify(
          def.fields.map((field) => `base:${field.key}`),
        ),
      };

      for (const field of def.fields) {
        const key = getSectionFieldKey(id, field.key);
        next[key] = field.defaultValue;
        next[getLandingFieldSizeKey(key)] = String(field.defaultSize);
      }

      return next;
    });

    setStructure(nextStructure);
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
      [getSectionVideoTextFieldKey(sectionId, itemId, "content")]: "Nuevo texto",
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

  function reorderSections(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      return;
    }

    const sourceIndex = structure.findIndex(
      (section) => section.id === sourceId,
    );
    const targetIndex = structure.findIndex(
      (section) => section.id === targetId,
    );

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const next = [...structure];
    const [item] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, item);
    commitStructure(next);
  }

  function goToAdjacentSection(direction: "prev" | "next") {
    if (activeSectionIndex < 0) {
      return;
    }

    const nextIndex =
      direction === "next" ? activeSectionIndex + 1 : activeSectionIndex - 1;
    const targetSection = structure[nextIndex];
    if (!targetSection) {
      return;
    }

    focusSection(targetSection.id);
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
    setPanelOpen(true);
    setIsSectionSettingsView(false);
  }

  function handleMoveSectionExtraPosition(
    sectionId: string,
    extraId: string,
    positionX: number,
    positionY: number,
  ) {
    const nextX = clamp(Math.round(positionX), 0, 100);
    const nextY = clamp(Math.round(positionY), 0, 100);
    const textKey = getSectionExtraTextKey(sectionId, extraId);

    setTextMap((previous) => ({
      ...previous,
      [getSectionExtraPositionXKey(sectionId, extraId)]: String(nextX),
      [getSectionExtraPositionYKey(sectionId, extraId)]: String(nextY),
    }));

    setSelectedSectionId(sectionId);
    setSelectedFieldId(textKey);
    setOpenPanelAccordionId(`top:item:extra:${extraId}`);
    setPanelOpen(true);
    setIsSectionSettingsView(false);
  }

  async function handlePublish() {
    const payload = {
      ...textMap,
      [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
    };
    const result = await publishCmsAction(payload);
    setStatusMessage(
      result.ok ? "Cambios publicados en landing." : "No se pudo publicar.",
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
          <span>Landing builder (edicion inline)</span>
          <div className="flex items-center gap-2">
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
            <Sheet
              open={panelOpen}
              onOpenChange={setPanelOpen}
              modal={false}
              disablePointerDismissal
            >
              <SheetTrigger
                render={<Button type="button" size="sm" variant="outline" />}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Abrir panel de edición
              </SheetTrigger>
              <SheetContent
                side="right"
                className="font-fira w-full overflow-visible border-l-0 p-0 sm:max-w-[460px]"
                showOverlay={false}
                showCloseButton={false}
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
                      style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap" }}
                    >
                      <div
                        className="flex h-full min-w-0 items-center justify-center gap-4 border-r px-2"
                        style={{ flex: "0 0 50%", maxWidth: "50%" }}
                      >
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
                            ? structure[activeSectionIndex]?.name
                            : "Sección actual"}
                        </span>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="h-8 w-8 rounded-md"
                          onClick={() => goToAdjacentSection("next")}
                          disabled={
                            activeSectionIndex < 0 ||
                            activeSectionIndex >= structure.length - 1
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div
                        className="h-full min-w-0"
                        style={{ flex: "0 0 50%", maxWidth: "50%" }}
                      >
                        <button
                          type="button"
                          className="block h-full w-full rounded-none border-0"
                          style={{ backgroundColor: "#059669", color: "#ffffff" }}
                          onClick={handlePublish}
                        >
                          Publicar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex-1 min-h-0 overflow-hidden">
                    <div
                      className={cn(
                        "h-full min-h-0 flex flex-col gap-4 overflow-y-auto overscroll-contain p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                        isSectionSettingsView && "hidden",
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
                                  addExtraElement(selectedSection.id, "line-horizontal")
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
                          onClick={() => setIsSectionSettingsView(true)}
                        >
                          Configurar secciones
                        </Button>
                      </div>

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
                                  {
                                    landingSectionCatalog[selectedSection.type]
                                      .label
                                  }
                                </p>

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
                                        { value: "stacked", label: "Stacked" },
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
                                            <Input
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

                                    {(selectedSectionGalleryVariant ===
                                      "carousel" ||
                                      selectedSectionGalleryVariant ===
                                        "stacked") &&
                                    selectedSectionGalleryAutoplaySecondsKey ? (
                                      <div className="space-y-2">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Autoplay (
                                            {
                                              selectedSectionGalleryAutoplaySeconds
                                            }
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
                                            <Input
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
                                                  <Input
                                                    placeholder="https://... (URL imagen)"
                                                    value={
                                                      textMap[imageKey] ?? ""
                                                    }
                                                    onChange={(event) =>
                                                      updateField(
                                                        imageKey,
                                                        event.target.value,
                                                      )
                                                    }
                                                  />
                                                  <Input
                                                    placeholder="Titulo"
                                                    value={
                                                      textMap[titleKey] ?? ""
                                                    }
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
                                                    <Input
                                                      placeholder="Subtitulo"
                                                      value={
                                                        textMap[subtitleKey] ??
                                                        ""
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
                                        { value: "image", label: "Imagen" },
                                        { value: "color", label: "Color" },
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

                                    {selectedSectionBackgroundMode ===
                                    "image" ? (
                                      <div className="space-y-2">
                                        <Input
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
                                              value={
                                                selectedSectionBackgroundZoom
                                              }
                                              onChange={(value) =>
                                                updateField(
                                                  selectedSectionBackgroundZoomKey,
                                                  String(value),
                                                )
                                              }
                                            />
                                            <Input
                                              type="number"
                                              min={1}
                                              max={3}
                                              step={0.05}
                                              value={
                                                selectedSectionBackgroundZoom
                                              }
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
                                            <Input
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
                                            <Input
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

                                    {selectedSectionBackgroundMode ===
                                    "color" ? (
                                      <PanelColorControl
                                        value={
                                          textMap[
                                            selectedSectionBackgroundColorKey
                                          ]
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
                                      <Input
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
                                          { value: "sides", label: "Sides" },
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
                              </div>
                            </details>

                            <div className="space-y-2">
                              {activeSectionItems.map((item) => {
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
                                        toggleTopLevelAccordion(`top:item:${item.id}`);
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
                                                const contentKey = getSectionVideoTextFieldKey(
                                                  selectedSection.id,
                                                  videoTextId,
                                                  "content",
                                                );
                                                const sizeKey = getSectionVideoTextFieldKey(
                                                  selectedSection.id,
                                                  videoTextId,
                                                  "size",
                                                );
                                                const colorKey = getSectionVideoTextFieldKey(
                                                  selectedSection.id,
                                                  videoTextId,
                                                  "color",
                                                );
                                                const weightKey = getSectionVideoTextFieldKey(
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
                                                            textMap[contentKey] ??
                                                            ""
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
                                                          Tamaño ({textSize}px)
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
                                                          Posicion X ({textPositionX}%)
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
                                                          Posicion Y ({textPositionY}%)
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
                                                  {
                                                    selectedSectionVideoOverlayOpacity
                                                  }
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
                                          Este elemento no requiere texto. Ajusta tamano, color y margen en este panel.
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
                                        <Input
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
                                      {item.kind === "extra" &&
                                      item.extraId &&
                                      extraItem?.type !== "text" ? (
                                        <>
                                          <SliderValueControl
                                            label="Tamano"
                                            value={getNumberValue(
                                              textMap[
                                                getLandingFieldSizeKey(
                                                  item.textKey,
                                                )
                                              ],
                                              extraDefaults?.size ?? 24,
                                              12,
                                              800,
                                            )}
                                            min={12}
                                            max={800}
                                            onChange={(value) =>
                                              updateField(
                                                getLandingFieldSizeKey(
                                                  item.textKey,
                                                ),
                                                String(value),
                                              )
                                            }
                                          />
                                          <SliderValueControl
                                            label="Posicion X"
                                            value={getNumberValue(
                                              textMap[
                                                getSectionExtraPositionXKey(
                                                  selectedSection.id,
                                                  item.extraId,
                                                )
                                              ],
                                              50,
                                              0,
                                              100,
                                            )}
                                            min={0}
                                            max={100}
                                            onChange={(value) =>
                                              updateField(
                                                getSectionExtraPositionXKey(
                                                  selectedSection.id,
                                                  item.extraId,
                                                ),
                                                String(value),
                                              )
                                            }
                                          />
                                          <SliderValueControl
                                            label="Posicion Y"
                                            value={getNumberValue(
                                              textMap[
                                                getSectionExtraPositionYKey(
                                                  selectedSection.id,
                                                  item.extraId,
                                                )
                                              ],
                                              50,
                                              0,
                                              100,
                                            )}
                                            min={0}
                                            max={100}
                                            onChange={(value) =>
                                              updateField(
                                                getSectionExtraPositionYKey(
                                                  selectedSection.id,
                                                  item.extraId,
                                                ),
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
                                                  <option value="ghost">
                                                    Ghost
                                                  </option>
                                                  <option value="destructive">
                                                    Destructive
                                                  </option>
                                                  <option value="link">
                                                    Link
                                                  </option>
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
                                              <option value="nunito">
                                                Nunito
                                              </option>
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
                                              textMap[
                                                getLandingFieldSizeKey(
                                                  item.textKey,
                                                )
                                              ],
                                              extraDefaults?.size ?? 24,
                                              12,
                                              800,
                                            )}
                                            min={12}
                                            max={800}
                                            onChange={(value) =>
                                              updateField(
                                                getLandingFieldSizeKey(
                                                  item.textKey,
                                                ),
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
                                              textMap[
                                                getSectionExtraPositionXKey(
                                                  selectedSection.id,
                                                  item.extraId,
                                                )
                                              ],
                                              50,
                                              0,
                                              100,
                                            )}
                                            min={0}
                                            max={100}
                                            onChange={(value) =>
                                              updateField(
                                                getSectionExtraPositionXKey(
                                                  selectedSection.id,
                                                  item.extraId,
                                                ),
                                                String(value),
                                              )
                                            }
                                          />
                                          <SliderValueControl
                                            label="Posicion Y"
                                            value={getNumberValue(
                                              textMap[
                                                getSectionExtraPositionYKey(
                                                  selectedSection.id,
                                                  item.extraId,
                                                )
                                              ],
                                              50,
                                              0,
                                              100,
                                            )}
                                            min={0}
                                            max={100}
                                            onChange={(value) =>
                                              updateField(
                                                getSectionExtraPositionYKey(
                                                  selectedSection.id,
                                                  item.extraId,
                                                ),
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
                        "h-full min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                        !isSectionSettingsView && "hidden",
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
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Orden de secciones
                        </p>
                        {structure.map((section) => (
                          <div
                            key={section.id}
                            draggable
                            onDragStart={(event) => {
                              setDraggedSectionId(section.id);
                              event.dataTransfer.setData(
                                "text/plain",
                                section.id,
                              );
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = "move";
                              setDragOverSectionId(section.id);
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              const sourceId =
                                draggedSectionId ||
                                event.dataTransfer.getData("text/plain");
                              if (sourceId) {
                                reorderSections(sourceId, section.id);
                              }
                              setDraggedSectionId(null);
                              setDragOverSectionId(null);
                            }}
                            onDragEnd={() => {
                              setDraggedSectionId(null);
                              setDragOverSectionId(null);
                            }}
                            className={cn(
                              "flex items-center gap-2 rounded-md border bg-background px-2 py-2 text-sm",
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
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeSection(section.id)}
                              disabled={structure.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove section</span>
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 rounded-lg border p-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Agregar nueva seccion
                        </p>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <select
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                            value={newSectionType}
                            onChange={(event) =>
                              setNewSectionType(
                                event.target.value as LandingSectionType,
                              )
                            }
                          >
                            {Object.values(landingSectionCatalog).map(
                              (item) => (
                                <option key={item.type} value={item.type}>
                                  {item.label}
                                </option>
                              ),
                            )}
                          </select>
                          <Button type="button" size="sm" onClick={addSection}>
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div
          ref={previewScrollRef}
          className="relative h-[78vh] overflow-auto rounded-xl border bg-muted/20"
        >
          <div className="w-full min-w-0">
            <div
              className="origin-top-left"
              style={{ zoom: effectivePreviewScale }}
            >
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
                <LandingView
                  textMap={{
                    ...textMap,
                    [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
                  }}
                  previewViewportHeight={previewViewportHeightForContent}
                  previewMode
                  selectedFieldId={selectedFieldId}
                  onSelectField={handleSelectField}
                  onMoveSectionExtraPosition={handleMoveSectionExtraPosition}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
