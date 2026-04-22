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
  getSectionExtrasKey,
  getSectionFieldKey,
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
const APP_BACKGROUND_COLOR_OPTIONS = [
  "#f6f7fb", // background
  "#ffffff", // card
  "#eef1f7", // secondary
  "#f3f4f6", // muted
  "#ede9fe", // accent
  "#7c63c9", // brand-500
  "#5a3e99", // brand-600
  "#3b2a66", // brand-700
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
  const [newExtraType, setNewExtraType] =
    useState<SectionExtraElementType>("text");
  const [statusMessage, setStatusMessage] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSectionSettingsView, setIsSectionSettingsView] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(
    null,
  );
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
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
      label: extra.type,
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
    setSelectedFieldId(getSectionFieldKey(id, def.fields[0].key));
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
    }

    if (selectedFieldId?.startsWith(`section.${sectionId}.`)) {
      setSelectedFieldId(null);
    }
  }

  function addExtraElement(sectionId: string, type: SectionExtraElementType) {
    const extras = parseSectionExtraElements(textMap, sectionId);
    const extraId = `${type}-${nextExtraIdRef.current++}`;
    const defaults = getExtraDefaults(type);
    const textKey = getSectionExtraTextKey(sectionId, extraId);
    const nextExtras = [...extras, { id: extraId, type }];
    const currentOrder = parseSectionItemsOrder(textMap, sectionId);

    setTextMap((previous) => ({
      ...previous,
      [getSectionExtrasKey(sectionId)]: JSON.stringify(nextExtras),
      [textKey]: defaults.text,
      [getLandingFieldSizeKey(textKey)]: String(defaults.size),
      [getSectionItemsOrderKey(sectionId)]: JSON.stringify([
        ...currentOrder,
        `extra:${extraId}`,
      ]),
    }));

    setSelectedFieldId(textKey);
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

  function reorderSectionItems(
    sectionId: string,
    sourceItemId: string,
    targetItemId: string,
  ) {
    if (sourceItemId === targetItemId) {
      return;
    }

    const ids = activeSectionItems.map((item) => item.id);
    const sourceIndex = ids.indexOf(sourceItemId);
    const targetIndex = ids.indexOf(targetItemId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const next = [...ids];
    const [item] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, item);

    setTextMap((previous) => ({
      ...previous,
      [getSectionItemsOrderKey(sectionId)]: JSON.stringify(next),
    }));
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
    const fieldKey = getSectionFieldKey(section.id, firstField.key);

    setSelectedSectionId(section.id);
    setSelectedFieldId(fieldKey);
    setPanelOpen(true);
    scrollPreviewToSection(section.id);
  }

  function handleSelectField(fieldId: string) {
    const match = fieldId.match(/^section\.([^.]*)\./);
    if (match?.[1]) {
      setSelectedSectionId(match[1]);
    }
    setSelectedFieldId(fieldId);
    setPanelOpen(true);
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

                      <div className="flex justify-end">
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
                            <details className="rounded-md border p-2" open>
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
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
                                  <div className="space-y-1.5 rounded-md border bg-muted/20 p-2">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Version de galeria
                                    </label>
                                    <div className="flex gap-3 rounded-md border bg-background px-3 py-2 text-xs">
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`${selectedSection.id}-gallery-variant`}
                                          checked={
                                            selectedSectionGalleryVariant ===
                                            "grid"
                                          }
                                          onChange={() =>
                                            updateField(
                                              selectedSectionGalleryVariantKey,
                                              "grid",
                                            )
                                          }
                                        />
                                        Grid
                                      </label>
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`${selectedSection.id}-gallery-variant`}
                                          checked={
                                            selectedSectionGalleryVariant ===
                                            "carousel"
                                          }
                                          onChange={() =>
                                            updateField(
                                              selectedSectionGalleryVariantKey,
                                              "carousel",
                                            )
                                          }
                                        />
                                        Carousel
                                      </label>
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`${selectedSection.id}-gallery-variant`}
                                          checked={
                                            selectedSectionGalleryVariant ===
                                            "stacked"
                                          }
                                          onChange={() =>
                                            updateField(
                                              selectedSectionGalleryVariantKey,
                                              "stacked",
                                            )
                                          }
                                        />
                                        Stacked
                                      </label>
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`${selectedSection.id}-gallery-variant`}
                                          checked={
                                            selectedSectionGalleryVariant ===
                                            "editorial"
                                          }
                                          onChange={() =>
                                            updateField(
                                              selectedSectionGalleryVariantKey,
                                              "editorial",
                                            )
                                          }
                                        />
                                        Editorial
                                      </label>
                                    </div>

                                    {selectedSectionGalleryVariant === "grid" &&
                                    selectedSectionGalleryGridImageShapeKey ? (
                                      <div className="space-y-2 rounded-md border bg-background p-2">
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Forma de imagen en grid
                                        </label>
                                        <div className="flex flex-wrap gap-3 rounded-md border px-3 py-2 text-xs">
                                          <label className="inline-flex items-center gap-1">
                                            <input
                                              type="radio"
                                              name={`${selectedSection.id}-gallery-grid-shape`}
                                              checked={
                                                selectedSectionGalleryGridImageShape ===
                                                "square"
                                              }
                                              onChange={() =>
                                                updateField(
                                                  selectedSectionGalleryGridImageShapeKey,
                                                  "square",
                                                )
                                              }
                                            />
                                            Cuadrada
                                          </label>
                                          <label className="inline-flex items-center gap-1">
                                            <input
                                              type="radio"
                                              name={`${selectedSection.id}-gallery-grid-shape`}
                                              checked={
                                                selectedSectionGalleryGridImageShape ===
                                                "portrait"
                                              }
                                              onChange={() =>
                                                updateField(
                                                  selectedSectionGalleryGridImageShapeKey,
                                                  "portrait",
                                                )
                                              }
                                            />
                                            Vertical
                                          </label>
                                          <label className="inline-flex items-center gap-1">
                                            <input
                                              type="radio"
                                              name={`${selectedSection.id}-gallery-grid-shape`}
                                              checked={
                                                selectedSectionGalleryGridImageShape ===
                                                "landscape"
                                              }
                                              onChange={() =>
                                                updateField(
                                                  selectedSectionGalleryGridImageShapeKey,
                                                  "landscape",
                                                )
                                              }
                                            />
                                            Horizontal
                                          </label>
                                        </div>
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
                                  </div>
                                ) : null}

                                {selectedSectionBackgroundModeKey &&
                                selectedSectionBackgroundImageKey &&
                                selectedSectionBackgroundColorKey &&
                                selectedSectionBackgroundGradientKey &&
                                selectedSectionBackgroundZoomKey &&
                                selectedSectionBackgroundPositionXKey &&
                                selectedSectionBackgroundPositionYKey ? (
                                  <div className="space-y-1.5 rounded-md border bg-muted/20 p-2">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Fondo de seccion
                                    </label>
                                    <div className="flex gap-3 rounded-md border bg-background px-3 py-2 text-xs">
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`${selectedSection.id}-background-mode`}
                                          checked={
                                            selectedSectionBackgroundMode ===
                                            "image"
                                          }
                                          onChange={() =>
                                            updateField(
                                              selectedSectionBackgroundModeKey,
                                              "image",
                                            )
                                          }
                                        />
                                        Imagen
                                      </label>
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`${selectedSection.id}-background-mode`}
                                          checked={
                                            selectedSectionBackgroundMode ===
                                            "color"
                                          }
                                          onChange={() =>
                                            updateField(
                                              selectedSectionBackgroundModeKey,
                                              "color",
                                            )
                                          }
                                        />
                                        Color
                                      </label>
                                      <label className="inline-flex items-center gap-1">
                                        <input
                                          type="radio"
                                          name={`${selectedSection.id}-background-mode`}
                                          checked={
                                            selectedSectionBackgroundMode ===
                                            "gradient"
                                          }
                                          onChange={() =>
                                            updateField(
                                              selectedSectionBackgroundModeKey,
                                              "gradient",
                                            )
                                          }
                                        />
                                        Gradient
                                      </label>
                                    </div>

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
                                      <div className="space-y-2">
                                        <div className="flex gap-2">
                                          <Input
                                            type="color"
                                            className="h-10 w-14 p-1"
                                            value={
                                              textMap[
                                                selectedSectionBackgroundColorKey
                                              ] || "#f4efe5"
                                            }
                                            onChange={(event) => {
                                              updateField(
                                                selectedSectionBackgroundColorKey,
                                                event.target.value,
                                              );
                                            }}
                                          />
                                          <Input
                                            value={
                                              textMap[
                                                selectedSectionBackgroundColorKey
                                              ] ?? ""
                                            }
                                            placeholder="#f4efe5"
                                            onChange={(event) =>
                                              updateField(
                                                selectedSectionBackgroundColorKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {APP_BACKGROUND_COLOR_OPTIONS.map(
                                            (color) => {
                                              const isActive =
                                                (
                                                  textMap[
                                                    selectedSectionBackgroundColorKey
                                                  ] ?? ""
                                                )
                                                  .trim()
                                                  .toLowerCase() ===
                                                color.toLowerCase();

                                              return (
                                                <button
                                                  key={color}
                                                  type="button"
                                                  aria-label={`Color ${color}`}
                                                  className={cn(
                                                    "rounded-sm border border-black/30",
                                                    isActive &&
                                                      "ring-2 ring-primary ring-offset-1",
                                                  )}
                                                  style={{
                                                    backgroundColor: color,
                                                    width: "18px",
                                                    height: "18px",
                                                    minWidth: "18px",
                                                    display: "inline-block",
                                                  }}
                                                  title={color}
                                                  onClick={() =>
                                                    updateField(
                                                      selectedSectionBackgroundColorKey,
                                                      color,
                                                    )
                                                  }
                                                />
                                              );
                                            },
                                          )}
                                        </div>
                                      </div>
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
                                ) : null}

                                {selectedSectionPaddingFieldId ? (
                                  <div className="space-y-2 rounded-md border bg-muted/20 p-2">
                                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                      Padding de seccion
                                    </p>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Modo
                                      </label>
                                      <div className="flex gap-3 rounded-md border bg-background px-3 py-2 text-xs">
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedSectionPaddingFieldId}-padding-mode`}
                                            checked={
                                              selectedSectionPaddingMode ===
                                              "all"
                                            }
                                            onChange={() =>
                                              updateField(
                                                getLandingFieldPaddingModeKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                "all",
                                              )
                                            }
                                          />
                                          All
                                        </label>
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedSectionPaddingFieldId}-padding-mode`}
                                            checked={
                                              selectedSectionPaddingMode ===
                                              "axis"
                                            }
                                            onChange={() =>
                                              updateField(
                                                getLandingFieldPaddingModeKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                "axis",
                                              )
                                            }
                                          />
                                          Axis
                                        </label>
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedSectionPaddingFieldId}-padding-mode`}
                                            checked={
                                              selectedSectionPaddingMode ===
                                              "sides"
                                            }
                                            onChange={() =>
                                              updateField(
                                                getLandingFieldPaddingModeKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                "sides",
                                              )
                                            }
                                          />
                                          Sides
                                        </label>
                                      </div>
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
                                  </div>
                                ) : null}
                              </div>
                            </details>

                            <details className="rounded-md border p-2" open>
                              <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Elementos de la seccion
                              </summary>
                              <div className="mt-2 space-y-2">
                                {activeSectionItems.length > 0 ? (
                                  activeSectionItems.map((item) => {
                                    const isExtra = item.kind === "extra";
                                    const extraId = item.extraId;

                                    return (
                                      <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(event) => {
                                          setDraggedItemId(item.id);
                                          event.dataTransfer.setData(
                                            "text/plain",
                                            item.id,
                                          );
                                          event.dataTransfer.effectAllowed =
                                            "move";
                                        }}
                                        onDragOver={(event) => {
                                          event.preventDefault();
                                          event.dataTransfer.dropEffect = "move";
                                          setDragOverItemId(item.id);
                                        }}
                                        onDrop={(event) => {
                                          event.preventDefault();
                                          const sourceId =
                                            draggedItemId ||
                                            event.dataTransfer.getData(
                                              "text/plain",
                                            );
                                          if (sourceId) {
                                            reorderSectionItems(
                                              selectedSection.id,
                                              sourceId,
                                              item.id,
                                            );
                                          }
                                          setDraggedItemId(null);
                                          setDragOverItemId(null);
                                        }}
                                        onDragEnd={() => {
                                          setDraggedItemId(null);
                                          setDragOverItemId(null);
                                        }}
                                        className={cn(
                                          "flex items-center gap-2 rounded-md border px-2 py-1.5",
                                          dragOverItemId === item.id &&
                                            "border-primary bg-primary/5",
                                        )}
                                      >
                                        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                                        <button
                                          type="button"
                                          className="min-w-0 flex-1 truncate text-left text-xs"
                                          onClick={() =>
                                            setSelectedFieldId(item.textKey)
                                          }
                                        >
                                          {item.label}
                                        </button>
                                        {isExtra && extraId ? (
                                          <Button
                                            type="button"
                                            size="icon-sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() =>
                                              removeExtraElement(
                                                selectedSection.id,
                                                extraId,
                                              )
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">
                                              Remove element
                                            </span>
                                          </Button>
                                        ) : (
                                          <Badge variant="secondary">Base</Badge>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    No hay elementos extra en esta seccion.
                                  </p>
                                )}

                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                  <select
                                    className="h-9 rounded-md border bg-background px-3 text-sm"
                                    value={newExtraType}
                                    onChange={(event) =>
                                      setNewExtraType(
                                        event.target
                                          .value as SectionExtraElementType,
                                      )
                                    }
                                  >
                                    <option value="title">Titulo</option>
                                    <option value="text">Texto</option>
                                    <option value="button">Boton</option>
                                  </select>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() =>
                                      addExtraElement(
                                        selectedSection.id,
                                        newExtraType,
                                      )
                                    }
                                  >
                                    Agregar
                                  </Button>
                                </div>
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
                                    className="rounded-md border p-2"
                                    open={isVideoUrlItem}
                                  >
                                    <summary className="cursor-pointer text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                      {item.label}
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
                                                    className="rounded-md border p-2"
                                                    open
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
                                                        <div className="flex gap-2">
                                                          <Input
                                                            type="color"
                                                            className="h-9 w-14 p-1"
                                                            value={
                                                              textMap[
                                                                colorKey
                                                              ] || "#ffffff"
                                                            }
                                                            onChange={(event) =>
                                                              updateField(
                                                                colorKey,
                                                                event.target.value,
                                                              )
                                                            }
                                                          />
                                                          <Input
                                                            value={
                                                              textMap[
                                                                colorKey
                                                              ] ?? "#ffffff"
                                                            }
                                                            onChange={(event) =>
                                                              updateField(
                                                                colorKey,
                                                                event.target.value,
                                                              )
                                                            }
                                                          />
                                                        </div>
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
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
