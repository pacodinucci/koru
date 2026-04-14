"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  getLandingFieldColorKey,
  getLandingFieldFontFamilyKey,
  getLandingFieldFontWeightKey,
  getLandingFieldMarginKey,
  getLandingFieldMarginLeftKey,
  getLandingFieldMarginModeKey,
  getLandingFieldMarginRightKey,
  getLandingFieldMarginTopKey,
  getLandingFieldMarginXKey,
  getLandingFieldMarginYKey,
  getLandingFieldMarginBottomKey,
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

type SelectedFieldContext = {
  key: string;
  sizeKey: string;
  colorKey: string;
  fontFamilyKey: string;
  fontWeightKey: string;
  marginKey: string;
  marginModeKey: string;
  marginXKey: string;
  marginYKey: string;
  marginTopKey: string;
  marginRightKey: string;
  marginBottomKey: string;
  marginLeftKey: string;
  paddingKey: string;
  paddingModeKey: string;
  paddingXKey: string;
  paddingYKey: string;
  paddingTopKey: string;
  paddingRightKey: string;
  paddingBottomKey: string;
  paddingLeftKey: string;
  section: LandingSectionInstance;
  field: {
    key: string;
    label: string;
    multiline?: boolean;
    defaultSize: number;
  };
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

const PREVIEW_ZOOM_MIN = 30;
const PREVIEW_ZOOM_MAX = 200;
const PREVIEW_ZOOM_STEP = 10;
const PREVIEW_ZOOM_DEFAULT = 100;
const PREVIEW_ZOOM_BASE_SCALE = 0.7;

export function CmsLandingEditor({ initialTextMap }: CmsLandingEditorProps) {
  const RECENT_BG_COLORS_KEY = "koru_recent_section_bg_colors";
  const initialStructure = parseLandingStructure(initialTextMap);
  const [textMap, setTextMap] = useState<LandingTextMap>(() =>
    ensureLandingDefaults(initialTextMap),
  );
  const [structure, setStructure] =
    useState<LandingSectionInstance[]>(initialStructure);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [newSectionType, setNewSectionType] =
    useState<LandingSectionType>("hero");
  const [newExtraType, setNewExtraType] =
    useState<SectionExtraElementType>("text");
  const [statusMessage, setStatusMessage] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSectionConfigOpen, setIsSectionConfigOpen] = useState(false);
  const [isSectionSettingsView, setIsSectionSettingsView] = useState(false);
  const [recentBackgroundColors, setRecentBackgroundColors] = useState<
    string[]
  >(() => {
    try {
      if (typeof window === "undefined") {
        return [];
      }
      const raw = window.localStorage.getItem(RECENT_BG_COLORS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as string[];
      return parsed
        .filter((item) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(item))
        .slice(0, 8);
    } catch {
      return [];
    }
  });
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

  function rememberBackgroundColor(color: string) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
      return;
    }

    setRecentBackgroundColors((previous) => {
      const next = [color, ...previous.filter((item) => item !== color)].slice(
        0,
        8,
      );
      try {
        window.localStorage.setItem(RECENT_BG_COLORS_KEY, JSON.stringify(next));
      } catch {
        // no-op
      }
      return next;
    });
  }

  const selectedSection = useMemo(
    () => structure.find((item) => item.id === selectedSectionId) ?? null,
    [selectedSectionId, structure],
  );
  const activeSectionId = selectedSectionId ?? structure[0]?.id ?? null;
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
  const selectedSectionGalleryGridImageShape = selectedSectionGalleryGridImageShapeKey
    ? getGalleryGridImageShapeValue(
        textMap[selectedSectionGalleryGridImageShapeKey],
      )
    : "landscape";
  const selectedSectionGalleryItemCaptionModes =
    selectedSectionGalleryItemCaptionModeKeys.map((key) =>
      getGalleryCaptionModeValue(textMap[key]),
    );

  const selectedFieldContext = useMemo<SelectedFieldContext | null>(() => {
    if (!selectedFieldId) {
      return null;
    }

    const match = selectedFieldId.match(/^section\.([^.]*)\.(.+)$/);
    if (!match) {
      return null;
    }

    const section = structure.find((item) => item.id === match[1]);
    if (!section) {
      return null;
    }

    const definition = landingSectionCatalog[section.type];
    const field = definition.fields.find((item) => item.key === match[2]);
    if (field) {
      const styleFieldId =
        section.type === "image-grid" && /^item\d+$/.test(field.key)
          ? getSectionFieldKey(section.id, "__cards_text_style")
          : selectedFieldId;

      return {
        key: selectedFieldId,
        sizeKey: getLandingFieldSizeKey(styleFieldId),
        colorKey: getLandingFieldColorKey(styleFieldId),
        fontFamilyKey: getLandingFieldFontFamilyKey(styleFieldId),
        fontWeightKey: getLandingFieldFontWeightKey(styleFieldId),
        marginKey: getLandingFieldMarginKey(styleFieldId),
        marginModeKey: getLandingFieldMarginModeKey(styleFieldId),
        marginXKey: getLandingFieldMarginXKey(styleFieldId),
        marginYKey: getLandingFieldMarginYKey(styleFieldId),
        marginTopKey: getLandingFieldMarginTopKey(styleFieldId),
        marginRightKey: getLandingFieldMarginRightKey(styleFieldId),
        marginBottomKey: getLandingFieldMarginBottomKey(styleFieldId),
        marginLeftKey: getLandingFieldMarginLeftKey(styleFieldId),
        paddingKey: getLandingFieldPaddingKey(styleFieldId),
        paddingModeKey: getLandingFieldPaddingModeKey(styleFieldId),
        paddingXKey: getLandingFieldPaddingXKey(styleFieldId),
        paddingYKey: getLandingFieldPaddingYKey(styleFieldId),
        paddingTopKey: getLandingFieldPaddingTopKey(styleFieldId),
        paddingRightKey: getLandingFieldPaddingRightKey(styleFieldId),
        paddingBottomKey: getLandingFieldPaddingBottomKey(styleFieldId),
        paddingLeftKey: getLandingFieldPaddingLeftKey(styleFieldId),
        section,
        field,
      };
    }

    const extraMatch = match[2].match(/^extra\.([^.]*)\.text$/);
    if (!extraMatch) {
      return null;
    }

    const extras = parseSectionExtraElements(textMap, section.id);
    const extra = extras.find((item) => item.id === extraMatch[1]);
    if (!extra) {
      return null;
    }

    const defaults = getExtraDefaults(extra.type);

    return {
      key: selectedFieldId,
      sizeKey: getLandingFieldSizeKey(selectedFieldId),
      colorKey: getLandingFieldColorKey(selectedFieldId),
      fontFamilyKey: getLandingFieldFontFamilyKey(selectedFieldId),
      fontWeightKey: getLandingFieldFontWeightKey(selectedFieldId),
      marginKey: getLandingFieldMarginKey(selectedFieldId),
      marginModeKey: getLandingFieldMarginModeKey(selectedFieldId),
      marginXKey: getLandingFieldMarginXKey(selectedFieldId),
      marginYKey: getLandingFieldMarginYKey(selectedFieldId),
      marginTopKey: getLandingFieldMarginTopKey(selectedFieldId),
      marginRightKey: getLandingFieldMarginRightKey(selectedFieldId),
      marginBottomKey: getLandingFieldMarginBottomKey(selectedFieldId),
      marginLeftKey: getLandingFieldMarginLeftKey(selectedFieldId),
      paddingKey: getLandingFieldPaddingKey(selectedFieldId),
      paddingModeKey: getLandingFieldPaddingModeKey(selectedFieldId),
      paddingXKey: getLandingFieldPaddingXKey(selectedFieldId),
      paddingYKey: getLandingFieldPaddingYKey(selectedFieldId),
      paddingTopKey: getLandingFieldPaddingTopKey(selectedFieldId),
      paddingRightKey: getLandingFieldPaddingRightKey(selectedFieldId),
      paddingBottomKey: getLandingFieldPaddingBottomKey(selectedFieldId),
      paddingLeftKey: getLandingFieldPaddingLeftKey(selectedFieldId),
      section,
      field: {
        key: match[2],
        label: defaults.label,
        multiline: defaults.multiline,
        defaultSize: defaults.size,
      },
    };
  }, [selectedFieldId, structure, textMap]);

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
  const activeItemIndex = selectedFieldId
    ? activeSectionItems.findIndex((item) => item.textKey === selectedFieldId)
    : -1;

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

  function goToAdjacentItem(direction: "prev" | "next") {
    if (activeSectionItems.length === 0) {
      return;
    }

    const baseIndex = activeItemIndex >= 0 ? activeItemIndex : 0;
    const nextIndex = direction === "next" ? baseIndex + 1 : baseIndex - 1;
    const targetItem = activeSectionItems[nextIndex];
    if (!targetItem) {
      return;
    }

    setSelectedFieldId(targetItem.textKey);
    setPanelOpen(true);
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
                Open editor panel
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full p-0 sm:max-w-[460px]"
                showOverlay={false}
              >
                <SheetHeader className="border-b">
                  <SheetTitle>Panel de configuracion</SheetTitle>
                  <SheetDescription>
                    Edita contenido, estilos y orden de secciones desde un solo
                    lugar.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex h-full min-h-0 flex-col">
                  <div className="relative flex-1 overflow-hidden">
                    <div
                      className={cn(
                        "absolute inset-0 space-y-4 overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-transform duration-300 ease-out",
                        isSectionSettingsView
                          ? "-translate-x-full"
                          : "translate-x-0",
                      )}
                    >
                      {statusMessage ? (
                        <p className="text-xs text-muted-foreground">
                          {statusMessage}
                        </p>
                      ) : null}

                      <div className="space-y-3 rounded-lg border p-3">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
                          onClick={() =>
                            setIsSectionConfigOpen((previous) => !previous)
                          }
                        >
                          Configuracion de seccion
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-300 ${isSectionConfigOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        <div
                          className={`grid transition-all duration-300 ease-out ${isSectionConfigOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                        >
                          <div className="min-h-0 overflow-hidden space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Seccion activa
                              </label>
                              <select
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                value={selectedSectionId ?? ""}
                                onChange={(event) =>
                                  focusSection(event.target.value)
                                }
                              >
                                <option value="" disabled>
                                  Seleccionar seccion
                                </option>
                                {structure.map((section) => (
                                  <option key={section.id} value={section.id}>
                                    {section.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {selectedSection ? (
                              <>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Nombre de seccion
                                  </label>
                                  <Input
                                    value={selectedSection.name}
                                    onChange={(event) =>
                                      commitStructure(
                                        structure.map((item) =>
                                          item.id === selectedSection.id
                                            ? {
                                                ...item,
                                                name: event.target.value,
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                  />
                                </div>
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
                                          checked={selectedSectionGalleryVariant === "grid"}
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
                                          checked={selectedSectionGalleryVariant === "carousel"}
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
                                          checked={selectedSectionGalleryVariant === "stacked"}
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
                                          checked={selectedSectionGalleryVariant === "editorial"}
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
                                              checked={selectedSectionGalleryGridImageShape === "square"}
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
                                              checked={selectedSectionGalleryGridImageShape === "portrait"}
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
                                              checked={selectedSectionGalleryGridImageShape === "landscape"}
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
                                            Opacidad de fondo ({selectedSectionGalleryCaptionContainerOpacity}%)
                                          </label>
                                          <div className="grid grid-cols-[1fr_84px] gap-2">
                                            <Input
                                              type="range"
                                              min={0}
                                              max={100}
                                              step={1}
                                              value={selectedSectionGalleryCaptionContainerOpacity}
                                              onChange={(event) =>
                                                updateField(
                                                  selectedSectionGalleryCaptionContainerOpacityKey,
                                                  event.target.value,
                                                )
                                              }
                                            />
                                            <Input
                                              type="number"
                                              min={0}
                                              max={100}
                                              step={1}
                                              value={selectedSectionGalleryCaptionContainerOpacity}
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
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Padding X ({selectedSectionGalleryCaptionContainerPaddingX}px)
                                          </label>
                                          <div className="grid grid-cols-[1fr_84px] gap-2">
                                            <Input
                                              type="range"
                                              min={0}
                                              max={80}
                                              step={1}
                                              value={selectedSectionGalleryCaptionContainerPaddingX}
                                              onChange={(event) =>
                                                updateField(
                                                  selectedSectionGalleryCaptionContainerPaddingXKey,
                                                  event.target.value,
                                                )
                                              }
                                            />
                                            <Input
                                              type="number"
                                              min={0}
                                              max={80}
                                              step={1}
                                              value={selectedSectionGalleryCaptionContainerPaddingX}
                                              onChange={(event) =>
                                                updateField(
                                                  selectedSectionGalleryCaptionContainerPaddingXKey,
                                                  event.target.value,
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Padding Y ({selectedSectionGalleryCaptionContainerPaddingY}px)
                                          </label>
                                          <div className="grid grid-cols-[1fr_84px] gap-2">
                                            <Input
                                              type="range"
                                              min={0}
                                              max={80}
                                              step={1}
                                              value={selectedSectionGalleryCaptionContainerPaddingY}
                                              onChange={(event) =>
                                                updateField(
                                                  selectedSectionGalleryCaptionContainerPaddingYKey,
                                                  event.target.value,
                                                )
                                              }
                                            />
                                            <Input
                                              type="number"
                                              min={0}
                                              max={80}
                                              step={1}
                                              value={selectedSectionGalleryCaptionContainerPaddingY}
                                              onChange={(event) =>
                                                updateField(
                                                  selectedSectionGalleryCaptionContainerPaddingYKey,
                                                  event.target.value,
                                                )
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ) : null}

                                    {(selectedSectionGalleryVariant === "carousel" ||
                                      selectedSectionGalleryVariant === "stacked") &&
                                    selectedSectionGalleryAutoplaySecondsKey ? (
                                      <div className="space-y-2">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Autoplay ({selectedSectionGalleryAutoplaySeconds}s)
                                          </label>
                                          <div className="grid grid-cols-[1fr_84px] gap-2">
                                            <Input
                                              type="range"
                                              min={0}
                                              max={10}
                                              step={1}
                                              value={selectedSectionGalleryAutoplaySeconds}
                                              onChange={(event) =>
                                                updateField(
                                                  selectedSectionGalleryAutoplaySecondsKey,
                                                  event.target.value,
                                                )
                                              }
                                            />
                                            <Input
                                              type="number"
                                              min={0}
                                              max={10}
                                              step={1}
                                              value={selectedSectionGalleryAutoplaySeconds}
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
                                                    value={textMap[imageKey] ?? ""}
                                                    onChange={(event) =>
                                                      updateField(
                                                        imageKey,
                                                        event.target.value,
                                                      )
                                                    }
                                                  />
                                                  <Input
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
                                                    <Input
                                                      placeholder="Subtitulo"
                                                      value={textMap[subtitleKey] ?? ""}
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
                                            <Input
                                              type="range"
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
                                            <Input
                                              type="range"
                                              min={0}
                                              max={100}
                                              step={1}
                                              value={
                                                selectedSectionBackgroundPositionX
                                              }
                                              onChange={(event) =>
                                                updateField(
                                                  selectedSectionBackgroundPositionXKey,
                                                  event.target.value,
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
                                            <Input
                                              type="range"
                                              min={0}
                                              max={100}
                                              step={1}
                                              value={
                                                selectedSectionBackgroundPositionY
                                              }
                                              onChange={(event) =>
                                                updateField(
                                                  selectedSectionBackgroundPositionYKey,
                                                  event.target.value,
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
                                              rememberBackgroundColor(
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
                                            onBlur={(event) =>
                                              rememberBackgroundColor(
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        {recentBackgroundColors.length > 0 ? (
                                          <div className="flex flex-wrap gap-1.5">
                                            {recentBackgroundColors.map(
                                              (color) => (
                                                <button
                                                  key={color}
                                                  type="button"
                                                  className="h-6 w-6 rounded border border-black/20"
                                                  style={{
                                                    backgroundColor: color,
                                                  }}
                                                  title={color}
                                                  onClick={() =>
                                                    updateField(
                                                      selectedSectionBackgroundColorKey,
                                                      color,
                                                    )
                                                  }
                                                />
                                              ),
                                            )}
                                          </div>
                                        ) : null}
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
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Padding
                                        </label>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={120}
                                          step={1}
                                          value={
                                            textMap[
                                              getLandingFieldPaddingKey(
                                                selectedSectionPaddingFieldId,
                                              )
                                            ] ?? ""
                                          }
                                          onChange={(event) =>
                                            updateField(
                                              getLandingFieldPaddingKey(
                                                selectedSectionPaddingFieldId,
                                              ),
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    ) : null}

                                    {selectedSectionPaddingMode === "axis" ? (
                                      <div className="grid grid-cols-[1fr_1fr] gap-2">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Px
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                getLandingFieldPaddingXKey(
                                                  selectedSectionPaddingFieldId,
                                                )
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                getLandingFieldPaddingXKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Py
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                getLandingFieldPaddingYKey(
                                                  selectedSectionPaddingFieldId,
                                                )
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                getLandingFieldPaddingYKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ) : null}

                                    {selectedSectionPaddingMode === "sides" ? (
                                      <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Pt
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                getLandingFieldPaddingTopKey(
                                                  selectedSectionPaddingFieldId,
                                                )
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                getLandingFieldPaddingTopKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Pr
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                getLandingFieldPaddingRightKey(
                                                  selectedSectionPaddingFieldId,
                                                )
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                getLandingFieldPaddingRightKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Pb
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                getLandingFieldPaddingBottomKey(
                                                  selectedSectionPaddingFieldId,
                                                )
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                getLandingFieldPaddingBottomKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Pl
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                getLandingFieldPaddingLeftKey(
                                                  selectedSectionPaddingFieldId,
                                                )
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                getLandingFieldPaddingLeftKey(
                                                  selectedSectionPaddingFieldId,
                                                ),
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}

                                <div className="space-y-2 rounded-md border p-2">
                                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                    Elementos de la seccion
                                  </p>

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
                                            event.dataTransfer.dropEffect =
                                              "move";
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
                                            <Badge variant="secondary">
                                              Base
                                            </Badge>
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
                              </>
                            ) : null}

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (!selectedSection) {
                                    return;
                                  }
                                  removeSection(selectedSection.id);
                                }}
                                disabled={
                                  !selectedSection || structure.length <= 1
                                }
                              >
                                {/* <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">
                                      Remove section
                                    </span> */}
                                Eliminar Sección
                              </Button>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => setIsSectionSettingsView(true)}
                            >
                              Ir a configuracion de secciones
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-lg border p-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Navegacion de elementos
                        </p>
                        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2">
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => goToAdjacentItem("prev")}
                            disabled={activeItemIndex <= 0}
                          >
                            <ChevronLeft />
                          </Button>
                          <span className="mx-auto w-40 truncate text-center text-sm text-muted-foreground">
                            {activeItemIndex >= 0
                              ? activeSectionItems[activeItemIndex]?.label
                              : "Sin elemento"}
                          </span>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => goToAdjacentItem("next")}
                            disabled={
                              activeItemIndex < 0 ||
                              activeItemIndex >= activeSectionItems.length - 1
                            }
                          >
                            <ChevronRight />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-lg border p-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Campo seleccionado
                        </p>
                        {selectedFieldContext ? (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {selectedFieldContext.section.name}
                              </p>
                              <p className="text-sm font-semibold">
                                {selectedFieldContext.field.label}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">
                                Texto
                              </label>
                              {selectedFieldContext.field.multiline ? (
                                <Textarea
                                  value={
                                    textMap[selectedFieldContext.key] ?? ""
                                  }
                                  onChange={(event) =>
                                    updateField(
                                      selectedFieldContext.key,
                                      event.target.value,
                                    )
                                  }
                                  rows={4}
                                />
                              ) : (
                                <Input
                                  value={
                                    textMap[selectedFieldContext.key] ?? ""
                                  }
                                  onChange={(event) =>
                                    updateField(
                                      selectedFieldContext.key,
                                      event.target.value,
                                    )
                                  }
                                />
                              )}
                            </div>

                            <div className="grid grid-cols-[1fr_1fr] gap-2">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Tamano (px)
                                </label>
                                <Input
                                  type="number"
                                  min={10}
                                  max={96}
                                  step={1}
                                  value={
                                    textMap[selectedFieldContext.sizeKey] ??
                                    String(
                                      selectedFieldContext.field.defaultSize,
                                    )
                                  }
                                  onChange={(event) =>
                                    updateField(
                                      selectedFieldContext.sizeKey,
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Color
                                </label>
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    className="h-10 w-14 p-1"
                                    value={
                                      textMap[selectedFieldContext.colorKey] ||
                                      "#000000"
                                    }
                                    onChange={(event) =>
                                      updateField(
                                        selectedFieldContext.colorKey,
                                        event.target.value,
                                      )
                                    }
                                  />
                                  <Input
                                    value={
                                      textMap[selectedFieldContext.colorKey] ??
                                      ""
                                    }
                                    placeholder="#000000"
                                    onChange={(event) =>
                                      updateField(
                                        selectedFieldContext.colorKey,
                                        event.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-[1fr_1fr] gap-2">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Fuente
                                </label>
                                <select
                                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  value={
                                    textMap[selectedFieldContext.fontFamilyKey] ??
                                    "montserrat"
                                  }
                                  onChange={(event) =>
                                    updateField(
                                      selectedFieldContext.fontFamilyKey,
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="montserrat">Montserrat</option>
                                  <option value="nunito">Nunito</option>
                                  <option value="fira-sans">Fira Sans</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Weight
                                </label>
                                <select
                                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  value={
                                    textMap[selectedFieldContext.fontWeightKey] ??
                                    "500"
                                  }
                                  onChange={(event) =>
                                    updateField(
                                      selectedFieldContext.fontWeightKey,
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="400">400</option>
                                  <option value="500">500</option>
                                  <option value="600">600</option>
                                  <option value="700">700</option>
                                </select>
                              </div>
                            </div>

                            {(() => {
                              const marginMode = getSpacingModeValue(
                                textMap[selectedFieldContext.marginModeKey],
                              );
                              const paddingMode = getSpacingModeValue(
                                textMap[selectedFieldContext.paddingModeKey],
                              );

                              return (
                                <>
                                  <div className="space-y-2 rounded-md border bg-muted/20 p-2">
                                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                      Margin
                                    </p>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Margin mode
                                      </label>
                                      <div className="flex gap-3 rounded-md border px-3 py-2 text-xs">
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedFieldContext.key}-margin-mode`}
                                            checked={marginMode === "all"}
                                            onChange={() =>
                                              updateField(
                                                selectedFieldContext.marginModeKey,
                                                "all",
                                              )
                                            }
                                          />
                                          All
                                        </label>
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedFieldContext.key}-margin-mode`}
                                            checked={marginMode === "axis"}
                                            onChange={() =>
                                              updateField(
                                                selectedFieldContext.marginModeKey,
                                                "axis",
                                              )
                                            }
                                          />
                                          Axis
                                        </label>
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedFieldContext.key}-margin-mode`}
                                            checked={marginMode === "sides"}
                                            onChange={() =>
                                              updateField(
                                                selectedFieldContext.marginModeKey,
                                                "sides",
                                              )
                                            }
                                          />
                                          Sides
                                        </label>
                                      </div>
                                    </div>

                                    {marginMode === "all" ? (
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Margin
                                        </label>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={120}
                                          step={1}
                                          value={
                                            textMap[
                                              selectedFieldContext.marginKey
                                            ] ?? ""
                                          }
                                          onChange={(event) =>
                                            updateField(
                                              selectedFieldContext.marginKey,
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    ) : null}
                                    {marginMode === "axis" ? (
                                      <div className="grid grid-cols-[1fr_1fr] gap-2">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Margin X
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext.marginXKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.marginXKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Margin Y
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext.marginYKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.marginYKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ) : null}
                                    {marginMode === "sides" ? (
                                      <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Mt
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext
                                                  .marginTopKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.marginTopKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Mr
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext
                                                  .marginRightKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.marginRightKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Mb
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext
                                                  .marginBottomKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.marginBottomKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Ml
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext
                                                  .marginLeftKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.marginLeftKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="space-y-2 rounded-md border bg-muted/20 p-2">
                                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                      Padding
                                    </p>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        Padding mode
                                      </label>
                                      <div className="flex gap-3 rounded-md border px-3 py-2 text-xs">
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedFieldContext.key}-padding-mode`}
                                            checked={paddingMode === "all"}
                                            onChange={() =>
                                              updateField(
                                                selectedFieldContext.paddingModeKey,
                                                "all",
                                              )
                                            }
                                          />
                                          All
                                        </label>
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedFieldContext.key}-padding-mode`}
                                            checked={paddingMode === "axis"}
                                            onChange={() =>
                                              updateField(
                                                selectedFieldContext.paddingModeKey,
                                                "axis",
                                              )
                                            }
                                          />
                                          Axis
                                        </label>
                                        <label className="inline-flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`${selectedFieldContext.key}-padding-mode`}
                                            checked={paddingMode === "sides"}
                                            onChange={() =>
                                              updateField(
                                                selectedFieldContext.paddingModeKey,
                                                "sides",
                                              )
                                            }
                                          />
                                          Sides
                                        </label>
                                      </div>
                                    </div>

                                    {paddingMode === "all" ? (
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">
                                          Padding
                                        </label>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={120}
                                          step={1}
                                          value={
                                            textMap[
                                              selectedFieldContext.paddingKey
                                            ] ?? ""
                                          }
                                          onChange={(event) =>
                                            updateField(
                                              selectedFieldContext.paddingKey,
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </div>
                                    ) : null}
                                    {paddingMode === "axis" ? (
                                      <div className="grid grid-cols-[1fr_1fr] gap-2">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Px
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext.paddingXKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.paddingXKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Py
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext.paddingYKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.paddingYKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ) : null}
                                    {paddingMode === "sides" ? (
                                      <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2">
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Pt
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext
                                                  .paddingTopKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.paddingTopKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Pr
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext
                                                  .paddingRightKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.paddingRightKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Pb
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext
                                                  .paddingBottomKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.paddingBottomKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Pl
                                          </label>
                                          <Input
                                            type="number"
                                            min={0}
                                            max={120}
                                            step={1}
                                            value={
                                              textMap[
                                                selectedFieldContext
                                                  .paddingLeftKey
                                              ] ?? ""
                                            }
                                            onChange={(event) =>
                                              updateField(
                                                selectedFieldContext.paddingLeftKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </>
                              );
                            })()}

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateField(selectedFieldContext.colorKey, "")
                                }
                              >
                                Reset color
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Selecciona un texto en la vista previa para
                            editarlo.
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "absolute inset-0 space-y-4 overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-transform duration-300 ease-out",
                        isSectionSettingsView
                          ? "translate-x-0"
                          : "translate-x-full",
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

                  <div className="border-t p-4">
                    <div className="w-full flex items-center gap-2">
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => goToAdjacentSection("prev")}
                          disabled={activeSectionIndex <= 0}
                        >
                          <ChevronLeft />
                        </Button>
                        <span className="mx-auto w-40 truncate text-center text-sm text-muted-foreground">
                          {activeSectionId
                            ? structure[activeSectionIndex]?.name
                            : "Sin seccion"}
                        </span>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => goToAdjacentSection("next")}
                          disabled={
                            activeSectionIndex < 0 ||
                            activeSectionIndex >= structure.length - 1
                          }
                        >
                          <ChevronRight />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="ml-auto"
                        onClick={handlePublish}
                      >
                        Publicar
                      </Button>
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
