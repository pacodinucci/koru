"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Monitor,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  publishCmsAction,
  publishCmsPageAction,
} from "@/modules/cms/server/cms-text.actions";
import {
  publishCmsPageContentAction,
  saveCmsPageDraftImageAction,
} from "@/modules/cms/server/cms-image.actions";
import type {
  CmsImageMap,
  CmsImageValue,
} from "@/modules/cms/server/cms-image.repository";
import {
  comoAcompanamosCmsImageSlots,
  landingCmsImageSlots,
  quienesSomosCmsImageSlots,
  type CmsImageSlot,
} from "@/modules/cms/content-page-config";
import { CmsImageAdjustmentProvider } from "@/modules/cms/components/cms-page-editable-image";
import { CmsTextEditorProvider } from "@/modules/cms/components/cms-text-editor-context";
import {
  CMS_DELETED_TEXT_SLOT_IDS_KEY,
  CMS_INSERTED_TEXT_BLOCKS_KEY,
  CMS_INSERTED_TEXT_BLOCK_ID_PREFIX,
  getCmsDeletedTextSlotIds,
  getCmsInsertedTextBlocks,
  getCmsInsertedTextSlot,
  serializeCmsDeletedTextSlotIds,
  serializeCmsInsertedTextBlocks,
  type CmsInsertedTextBlock,
  type CmsInsertedTextPosition,
} from "@/modules/cms/inserted-text-blocks";
import { CmsPreviewFrame } from "@/modules/dashboard/components/cms-preview-frame";
import { CmsImageField } from "@/modules/dashboard/components/cms-image-field";
import { useDashboardEditorPanel } from "@/modules/dashboard/components/dashboard-editor-panel";
import {
  getLandingContentSlotStyleKeys,
  getLandingContentSlotValue,
  getLandingContentSlots,
  repairLandingContentText,
  type LandingContentSlot,
} from "@/modules/landing/content-slots";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";
import { LandingView } from "@/modules/landing/views/landing-view";
import { getComoAcompanamosContentSlots } from "@/modules/como-acompanamos/content-slots";
import { ComoAcompanamosView } from "@/modules/como-acompanamos/views/como-acompanamos-view";
import { getQuienesSomosContentSlots } from "@/modules/quienes-somos/content-slots";
import { QuienesSomosView } from "@/modules/quienes-somos/views/quienes-somos-view";

const colorOptions = [
  "#111827",
  "#1f2937",
  "#3b2a66",
  "#4d7b53",
  "#2f3f0b",
  "#ffffff",
  "#f5f0df",
  "#dbe78a",
];

const fontOptions = [
  { value: "montserrat", label: "Montserrat" },
  { value: "indie-flower", label: "Indie Flower" },
  { value: "roboto-condensed", label: "Roboto Condensed" },
];

function getLandingEditorFontFamilyValue(value: string | undefined) {
  if (value === "montserrat") {
    return value;
  }

  return "montserrat";
}

const PREVIEW_ZOOM_BASE_SCALE = 0.62;
const PREVIEW_CANVAS_WIDTH = 1440;
const IMAGE_SAVE_DELAY_MS = 1_000;

const previewDevices = [
  { id: "desktop", label: "Desktop", width: PREVIEW_CANVAS_WIDTH, responsiveMode: "large" as const },
  { id: "tablet", label: "768", width: 768, responsiveMode: "tablet" as const },
  { id: "mobile-wide", label: "390", width: 390, responsiveMode: "mobile" as const },
  { id: "mobile", label: "375", width: 375, responsiveMode: "mobile" as const },
  { id: "mobile-compact", label: "320", width: 320, responsiveMode: "mobile" as const },
] as const;

function isSameCmsImageValue(left: CmsImageValue | undefined, right: CmsImageValue | undefined) {
  return left?.url === right?.url && left?.publicId === right?.publicId && left?.cropX === right?.cropX && left?.cropY === right?.cropY && left?.zoom === right?.zoom && left?.fitMode === right?.fitMode && left?.frameSize === right?.frameSize && left?.frameShape === right?.frameShape && left?.frameScale === right?.frameScale && left?.rotation === right?.rotation && left?.frameRounded === right?.frameRounded;
}

function normalizeTextMap(textMap: LandingTextMap, slots: LandingContentSlot[]) {
  const next = Object.fromEntries(
    Object.entries(textMap).map(([key, value]) => [
      key,
      (key === CMS_INSERTED_TEXT_BLOCKS_KEY ||
        key === CMS_DELETED_TEXT_SLOT_IDS_KEY)
        ? value
        : repairLandingContentText(value),
    ]),
  ) as LandingTextMap;

  for (const slot of slots) {
    if (next[slot.id] == null) {
      next[slot.id] = slot.defaultValue;
    }
  }
  return next;
}

export type PageContentEditorProps = {
  initialTextMap: LandingTextMap;
  initialImageMap?: CmsImageMap;
  slots: LandingContentSlot[];
  imageSlots?: CmsImageSlot[];
  pageSlug?: string;
  previewLabel: string;
  previewScale?: number;
  renderPreview: (props: {
    textMap: LandingTextMap;
    imageMap: CmsImageMap;
    selectedSlotId: string;
    onSelectSlot: (slotId: string) => void;
    responsiveMode: "large" | "tablet" | "mobile";
  }) => ReactNode;
};

export function PageContentEditor({
  initialTextMap,
  initialImageMap = {},
  slots: baseSlots,
  imageSlots = [],
  pageSlug = "/",
  previewLabel,
  previewScale = PREVIEW_ZOOM_BASE_SCALE,
  renderPreview,
}: PageContentEditorProps) {
  const [textMap, setTextMap] = useState(() =>
    normalizeTextMap(initialTextMap, baseSlots),
  );
  const [imageMap, setImageMap] = useState<CmsImageMap>(initialImageMap);
  const [previewDeviceId, setPreviewDeviceId] = useState<(typeof previewDevices)[number]["id"]>("desktop");
  const [overflowingSlotIds, setOverflowingSlotIds] = useState<string[]>([]);
  const imageSaveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const queuedImageSavesRef = useRef(new Map<string, CmsImageValue>());
  const savedImageMapRef = useRef<CmsImageMap>(initialImageMap);
  const savingImageKeysRef = useRef(new Set<string>());
  const persistQueuedImageRef = useRef<((key: string) => Promise<void>) | null>(null);
  const isMountedRef = useRef(true);
  const insertedBlocks = useMemo(
    () => getCmsInsertedTextBlocks(textMap),
    [textMap],
  );
  const insertedSlots = useMemo(
    () => insertedBlocks.map(getCmsInsertedTextSlot),
    [insertedBlocks],
  );
  const navigationSlots = useMemo(
    () => [
      ...baseSlots.map((slot) => ({
        id: slot.id,
        label: slot.selectorLabel,
        kind: "text" as const,
      })),
      ...insertedSlots.map((slot) => ({
        id: slot.id,
        label: slot.selectorLabel,
        kind: "text" as const,
      })),
      ...imageSlots.map((slot) => ({
        id: slot.key,
        label: slot.label,
        kind: "image" as const,
      })),
    ],
    [baseSlots, imageSlots, insertedSlots],
  );
  const [selectedSlotId, setSelectedSlotId] = useState(
    navigationSlots[0]?.id ?? "",
  );
  const [adjustingImageSlotId, setAdjustingImageSlotId] = useState<
    string | null
  >(null);
  const [statusMessage, setStatusMessage] = useState("");
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const { portalTarget } = useDashboardEditorPanel();
  const previewDevice = previewDevices.find((device) => device.id === previewDeviceId) ?? previewDevices[0];
  const previewCanvasWidth = previewDevice.width;
  const effectivePreviewScale = previewCanvasWidth < 768
    ? Math.max(previewScale, 0.9)
    : previewScale;

  const validSlotIds = useMemo(
    () => new Set(navigationSlots.map((slot) => slot.id)),
    [navigationSlots],
  );

  function selectSlot(slotId: string) {
    if (!validSlotIds.has(slotId)) {
      return;
    }

    setSelectedSlotId(slotId);
    if (slotId !== selectedSlotId) {
      setAdjustingImageSlotId(null);
    }
  }

  const selectedIndex = Math.max(
    0,
    navigationSlots.findIndex((slot) => slot.id === selectedSlotId),
  );
  const selectedNavigationSlot =
    navigationSlots[selectedIndex] ?? navigationSlots[0];
  const selectedInsertedBlock = insertedBlocks.find(
    (block) => block.id === selectedNavigationSlot?.id,
  );
  const selectedTextSlot =
    baseSlots.find((slot) => slot.id === selectedNavigationSlot?.id) ??
    insertedSlots.find((slot) => slot.id === selectedNavigationSlot?.id);
  const selectedImageSlot = imageSlots.find(
    (slot) => slot.key === selectedNavigationSlot?.id,
  );

  useEffect(() => {
    if (!selectedSlotId) {
      return;
    }

    const root = previewScrollRef.current;
    const target = root?.querySelector(
      `[data-content-slot-id="${CSS.escape(selectedSlotId)}"]`,
    );

    if (target instanceof HTMLElement) {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [selectedSlotId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const root = previewScrollRef.current;
      if (!root) return;
      const overflowing = Array.from(
        root.querySelectorAll<HTMLElement>("[data-content-slot-id]"),
      ).flatMap((element) => {
        const slotId = element.dataset.contentSlotId;
        return slotId && element.scrollWidth > element.clientWidth + 1
          ? [slotId]
          : [];
      });
      setOverflowingSlotIds([...new Set(overflowing)]);
    });
    return () => cancelAnimationFrame(frame);
  }, [imageMap, previewDeviceId, textMap]);

  function updateValue(key: string, value: string) {
    setTextMap((previous) => ({ ...previous, [key]: value }));
    setStatusMessage("");
  }

  function insertText(
    targetSlotId: string,
    requestedPosition: CmsInsertedTextPosition,
  ) {
    const blocks = getCmsInsertedTextBlocks(textMap);
    const targetBlock = blocks.find((block) => block.id === targetSlotId);
    const anchorSlotId = targetBlock?.anchorSlotId ?? targetSlotId;
    const position = targetBlock?.position ?? requestedPosition;
    const group = blocks
      .filter(
        (block) =>
          block.anchorSlotId === anchorSlotId && block.position === position,
      )
      .sort((left, right) => left.order - right.order);

    const newBlock: CmsInsertedTextBlock = {
      id: CMS_INSERTED_TEXT_BLOCK_ID_PREFIX + crypto.randomUUID(),
      anchorSlotId,
      position,
      order: 0,
    };

    if (targetBlock) {
      const targetIndex = group.findIndex((block) => block.id === targetBlock.id);
      group.splice(
        requestedPosition === "before" ? targetIndex : targetIndex + 1,
        0,
        newBlock,
      );
    } else {
      group.splice(position === "before" ? group.length : 0, 0, newBlock);
    }

    const normalizedGroup = group.map((block, order) => ({ ...block, order }));
    const groupIds = new Set(normalizedGroup.map((block) => block.id));
    const nextBlocks = [
      ...blocks.filter((block) => !groupIds.has(block.id)),
      ...normalizedGroup,
    ];

    setTextMap((previous) => ({
      ...previous,
      [CMS_INSERTED_TEXT_BLOCKS_KEY]:
        serializeCmsInsertedTextBlocks(nextBlocks),
      [newBlock.id]: "Nuevo texto",
    }));
    setSelectedSlotId(newBlock.id);
    setAdjustingImageSlotId(null);
    setStatusMessage("Texto agregado. Publicá para guardar el cambio.");
  }

  function deleteInsertedText(block: CmsInsertedTextBlock) {
    setTextMap((previous) => {
      const next = Object.fromEntries(
        Object.entries(previous).filter(
          ([key]) => key !== block.id && !key.startsWith(block.id + "__"),
        ),
      ) as LandingTextMap;
      next[CMS_INSERTED_TEXT_BLOCKS_KEY] = serializeCmsInsertedTextBlocks(
        getCmsInsertedTextBlocks(previous).filter(
          (candidate) => candidate.id !== block.id,
        ),
      );
      return next;
    });
    setSelectedSlotId(block.anchorSlotId);
    setStatusMessage("Texto eliminado. Publicá para guardar el cambio.");
  }

  function deleteText(slotId: string) {
    const insertedBlock = getCmsInsertedTextBlocks(textMap).find(
      (block) => block.id === slotId,
    );
    if (insertedBlock) {
      deleteInsertedText(insertedBlock);
      return;
    }

    setTextMap((previous) => ({
      ...previous,
      [CMS_DELETED_TEXT_SLOT_IDS_KEY]: serializeCmsDeletedTextSlotIds([
        ...getCmsDeletedTextSlotIds(previous),
        slotId,
      ]),
    }));
    setSelectedSlotId("");
    setStatusMessage("Texto eliminado. Publicá para guardar el cambio.");
  }

  function moveInsertedText(block: CmsInsertedTextBlock, direction: -1 | 1) {
    const blocks = getCmsInsertedTextBlocks(textMap);
    const group = blocks
      .filter(
        (candidate) =>
          candidate.anchorSlotId === block.anchorSlotId &&
          candidate.position === block.position,
      )
      .sort((left, right) => left.order - right.order);
    const currentIndex = group.findIndex((candidate) => candidate.id === block.id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= group.length) return;

    [group[currentIndex], group[nextIndex]] = [
      group[nextIndex]!,
      group[currentIndex]!,
    ];
    const normalizedGroup = group.map((candidate, order) => ({
      ...candidate,
      order,
    }));
    const groupIds = new Set(normalizedGroup.map((candidate) => candidate.id));
    const nextBlocks = [
      ...blocks.filter((candidate) => !groupIds.has(candidate.id)),
      ...normalizedGroup,
    ];
    setTextMap((previous) => ({
      ...previous,
      [CMS_INSERTED_TEXT_BLOCKS_KEY]:
        serializeCmsInsertedTextBlocks(nextBlocks),
    }));
    setStatusMessage("");
  }

  function goToSlot(direction: -1 | 1) {
    if (navigationSlots.length === 0) {
      return;
    }
    const nextIndex =
      (selectedIndex + direction + navigationSlots.length) %
      navigationSlots.length;
    setSelectedSlotId(navigationSlots[nextIndex]!.id);
    setAdjustingImageSlotId(null);
  }

  const persistQueuedImage = useCallback(async (key: string) => {
    const image = queuedImageSavesRef.current.get(key);
    if (!image || isSameCmsImageValue(savedImageMapRef.current[key], image) || savingImageKeysRef.current.has(key)) return;
    savingImageKeysRef.current.add(key);
    if (isMountedRef.current) setStatusMessage("Guardando borrador de imagen...");
    const result = await saveCmsPageDraftImageAction(pageSlug, key, image);
    if (result.ok) savedImageMapRef.current[key] = image;
    savingImageKeysRef.current.delete(key);
    const latestImage = queuedImageSavesRef.current.get(key);
    if (latestImage && !isSameCmsImageValue(savedImageMapRef.current[key], latestImage)) {
      const timer = setTimeout(() => { imageSaveTimersRef.current.delete(key); void persistQueuedImageRef.current?.(key); }, IMAGE_SAVE_DELAY_MS);
      imageSaveTimersRef.current.set(key, timer);
    } else {
      queuedImageSavesRef.current.delete(key);
    }
    if (isMountedRef.current) setStatusMessage(result.ok ? "Borrador de imagen guardado." : "No se pudo guardar el borrador de imagen.");
  }, [pageSlug]);

  useEffect(() => {
    persistQueuedImageRef.current = persistQueuedImage;
  }, [persistQueuedImage]);

  const queueImageSave = useCallback((key: string, image: CmsImageValue) => {
    if (isSameCmsImageValue(savedImageMapRef.current[key], image)) return;
    queuedImageSavesRef.current.set(key, image);
    const previousTimer = imageSaveTimersRef.current.get(key);
    if (previousTimer) clearTimeout(previousTimer);
    const timer = setTimeout(() => { imageSaveTimersRef.current.delete(key); void persistQueuedImageRef.current?.(key); }, IMAGE_SAVE_DELAY_MS);
    imageSaveTimersRef.current.set(key, timer);
  }, []);

  function updateImage(key: string, image: CmsImageValue) {
    setImageMap((previous) => isSameCmsImageValue(previous[key], image) ? previous : { ...previous, [key]: image });
  }

  async function commitImage(key: string, image: CmsImageValue) {
    updateImage(key, image);
    queueImageSave(key, image);
    if (isMountedRef.current) setStatusMessage("Cambios de imagen pendientes de guardado.");
  }

  useEffect(() => () => {
    isMountedRef.current = false;
    imageSaveTimersRef.current.forEach((timer) => clearTimeout(timer));
    imageSaveTimersRef.current.clear();
  }, []);
  async function handlePublish() {
    if (overflowingSlotIds.length > 0) {
      setStatusMessage("Hay texto que excede el ancho en esta vista. Ajustalo antes de publicar.");
      return;
    }
    const repairedTextMap = Object.fromEntries(
      Object.entries(textMap).map(([key, value]) => [
        key,
        (key === CMS_INSERTED_TEXT_BLOCKS_KEY ||
          key === CMS_DELETED_TEXT_SLOT_IDS_KEY)
          ? value
          : repairLandingContentText(value),
      ]),
    ) as LandingTextMap;
    setTextMap(repairedTextMap);
    const result = imageSlots.length
      ? await publishCmsPageContentAction(pageSlug, repairedTextMap, imageMap)
      : pageSlug === "/"
        ? await publishCmsAction(repairedTextMap)
        : await publishCmsPageAction(pageSlug, repairedTextMap);
    setStatusMessage(
      result.ok
        ? "Contenido publicado."
        : "No se pudo publicar el contenido.",
    );
  }

  if (!selectedNavigationSlot) {
    return null;
  }

  const selector = (
    <div className="flex h-16 items-center border-b bg-white">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => goToSlot(-1)}
        aria-label="Elemento anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0 flex-1 px-2 text-center">
        <p className="truncate text-sm font-semibold text-slate-900">
          {selectedNavigationSlot.label}
        </p>
        <p className="text-[11px] text-slate-500">
          {selectedIndex + 1} de {navigationSlots.length}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => goToSlot(1)}
        aria-label="Elemento siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        className="h-16 rounded-none bg-emerald-600 px-8 text-white hover:bg-emerald-700"
        onClick={handlePublish}
      >
        <Save className="mr-2 h-4 w-4" />
        Publicar
      </Button>
    </div>
  );

  const panelPortal = portalTarget
    ? createPortal(
        <div className="flex h-full min-h-0 flex-col bg-white [font-family:var(--font-montserrat)]">
          {selector}
          {statusMessage ? (
            <p className="border-b bg-slate-50 px-4 py-2 text-xs text-slate-600">
              {statusMessage}
            </p>
          ) : null}
          {overflowingSlotIds.length > 0 ? (
            <p className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900">
              {overflowingSlotIds.length === 1
                ? "Un texto excede el ancho de esta vista."
                : `${overflowingSlotIds.length} textos exceden el ancho de esta vista.`}
            </p>
          ) : null}
          {selectedTextSlot ? (
            <LandingContentSidePanel
              textMap={textMap}
              selectedSlot={selectedTextSlot}
              insertedBlock={selectedInsertedBlock}
              onChange={updateValue}
              onDeleteInserted={deleteInsertedText}
              onMoveInserted={moveInsertedText}
            />
          ) : null}
          {selectedImageSlot ? (
            <CmsImageField
              slot={selectedImageSlot}
              value={imageMap[selectedImageSlot.key]}
              isAdjusting={adjustingImageSlotId === selectedImageSlot.key}
              onAdjustingChange={(adjusting) =>
                setAdjustingImageSlotId(
                  adjusting ? selectedImageSlot.key : null,
                )
              }
              onChange={(image) => updateImage(selectedImageSlot.key, image)}
                onCommit={(image) => commitImage(selectedImageSlot.key, image)}
            />
          ) : null}
        </div>,
        portalTarget,
      )
    : null;

  return (
    <main className="h-full min-h-0 min-w-0 overflow-hidden [font-family:var(--font-montserrat)]">
      <CmsPreviewFrame
        title="Editor de contenido"
        frameVariant="flush"
        scrollRef={previewScrollRef}
        actions={
          <>
                        <div className="flex items-center rounded-lg border bg-white p-1">
              {previewDevices.map((device) => (
                <Button
                  key={device.id}
                  type="button"
                  size="sm"
                  variant={previewDevice.id === device.id ? "default" : "ghost"}
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setPreviewDeviceId(device.id)}
                >
                  {device.label}
                </Button>
              ))}
            </div>
            <Link
              href={pageSlug}
              target="_blank"
              rel="noreferrer"
              className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Monitor className="h-4 w-4" />
              {previewLabel}
            </Link>
            {panelPortal}
          </>
        }
      >
        <div className="flex w-full justify-center p-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className="pointer-events-none relative h-6 rounded-md border bg-background/95 shadow-sm"
              style={{
                width: `${previewCanvasWidth * effectivePreviewScale}px`,
                minWidth: `${previewCanvasWidth * effectivePreviewScale}px`,
              }}
              aria-hidden
            />
            <div
              className="origin-top-left bg-white"
              style={{
                zoom: effectivePreviewScale,
                width: `${previewCanvasWidth}px`,
              }}
            >
              <CmsImageAdjustmentProvider
                adjustingSlotId={adjustingImageSlotId}
                onCommitCrop={(slotId, image) => {
                  void commitImage(slotId, image);
                }}
              >
                <CmsTextEditorProvider
                  value={{
                    selectedSlotId,
                    onSelectSlot: selectSlot,
                    onInsertText: insertText,
                    onDeleteText: deleteText,
                  }}
                >
                  {renderPreview({
                    textMap,
                    imageMap,
                    selectedSlotId,
                    onSelectSlot: selectSlot,
                    responsiveMode: previewDevice.responsiveMode,
                  })}
                </CmsTextEditorProvider>
              </CmsImageAdjustmentProvider>
            </div>
          </div>
        </div>
      </CmsPreviewFrame>
    </main>
  );
}

export function LandingContentEditor({
  initialTextMap,
  initialImageMap,
}: {
  initialTextMap: LandingTextMap;
  initialImageMap: CmsImageMap;
}) {
  const slots = useMemo(() => getLandingContentSlots(), []);

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      initialImageMap={initialImageMap}
      slots={slots}
      imageSlots={landingCmsImageSlots}
      previewLabel="Preview de landing"
      renderPreview={({ textMap, imageMap, selectedSlotId, onSelectSlot, responsiveMode }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome responsiveMode={responsiveMode}>
          <LandingView
            textMap={textMap}
            imageMap={imageMap}
            previewMode
            selectedFieldId={selectedSlotId}
            onSelectField={onSelectSlot}
            responsiveMode={responsiveMode}
            selectedContentSlotId={selectedSlotId}
            onSelectContentSlot={onSelectSlot}
          />
        </LandingPageLayout>
      )}
    />
  );
}

export function QuienesSomosContentEditor({
  initialTextMap,
  initialImageMap,
}: {
  initialTextMap: LandingTextMap;
  initialImageMap: CmsImageMap;
}) {
  const slots = useMemo(() => getQuienesSomosContentSlots(), []);

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      initialImageMap={initialImageMap}
      slots={slots}
      imageSlots={quienesSomosCmsImageSlots}
      pageSlug="/quienes-somos"
      previewLabel="Preview de Quienes Somos"
      renderPreview={({ textMap, imageMap, selectedSlotId, onSelectSlot, responsiveMode }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome responsiveMode={responsiveMode}>
          <QuienesSomosView
            textMap={textMap}
            imageMap={imageMap}
            previewMode
            selectedContentSlotId={selectedSlotId}
            onSelectContentSlot={onSelectSlot}
          />
        </LandingPageLayout>
      )}
    />
  );
}

export function ComoAcompanamosContentEditor({
  initialTextMap,
  initialImageMap,
}: {
  initialTextMap: LandingTextMap;
  initialImageMap: CmsImageMap;
}) {
  const slots = useMemo(() => getComoAcompanamosContentSlots(), []);

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      initialImageMap={initialImageMap}
      slots={slots}
      imageSlots={comoAcompanamosCmsImageSlots}
      pageSlug="/como-acompanamos"
      previewLabel="Preview de Cómo acompañamos"
      renderPreview={({ textMap, imageMap, selectedSlotId, onSelectSlot, responsiveMode }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome responsiveMode={responsiveMode}>
          <ComoAcompanamosView
            textMap={textMap}
            imageMap={imageMap}
            previewMode
            selectedContentSlotId={selectedSlotId}
            onSelectContentSlot={onSelectSlot}
          />
        </LandingPageLayout>
      )}
    />
  );
}
export function LandingContentSidePanel({
  textMap,
  selectedSlot,
  insertedBlock,
  onChange,
  onDeleteInserted,
  onMoveInserted,
}: {
  textMap: LandingTextMap;
  selectedSlot: LandingContentSlot;
  insertedBlock?: CmsInsertedTextBlock;
  onChange: (key: string, value: string) => void;
  onDeleteInserted?: (block: CmsInsertedTextBlock) => void;
  onMoveInserted?: (block: CmsInsertedTextBlock, direction: -1 | 1) => void;
}) {
  const styleKeys = getLandingContentSlotStyleKeys(selectedSlot.id);
  const value = getLandingContentSlotValue(textMap, selectedSlot);
  const siblingBlocks = insertedBlock
    ? getCmsInsertedTextBlocks(textMap)
        .filter(
          (block) =>
            block.anchorSlotId === insertedBlock.anchorSlotId &&
            block.position === insertedBlock.position,
        )
        .sort((left, right) => left.order - right.order)
    : [];
  const insertedIndex = insertedBlock
    ? siblingBlocks.findIndex((block) => block.id === insertedBlock.id)
    : -1;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Texto seleccionado
          </p>
          <h2 className="mt-1 truncate text-sm font-semibold text-slate-900">
            {selectedSlot.label}
          </h2>
        </div>
        {insertedBlock ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={insertedIndex <= 0}
              onClick={() => onMoveInserted?.(insertedBlock, -1)}
              aria-label="Mover texto hacia arriba"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={
                insertedIndex < 0 || insertedIndex >= siblingBlocks.length - 1
              }
              onClick={() => onMoveInserted?.(insertedBlock, 1)}
              aria-label="Mover texto hacia abajo"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDeleteInserted?.(insertedBlock)}
              aria-label="Eliminar texto agregado"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
      <div className="space-y-5 p-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">
            Contenido
          </label>
          {selectedSlot.multiline ? (
            <Textarea
              value={value}
              rows={6}
              onChange={(event) => onChange(selectedSlot.id, event.target.value)}
            />
          ) : (
            <Input
              value={value}
              onChange={(event) => onChange(selectedSlot.id, event.target.value)}
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Fuente</label>
          <select
            className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm"
            value={getLandingEditorFontFamilyValue(textMap[styleKeys.fontFamily])}
            onChange={(event) => onChange(styleKeys.fontFamily, event.target.value)}
          >
            {fontOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Color</label>
          <div className="flex items-center gap-2">
            <Input
              value={textMap[styleKeys.color] ?? ""}
              placeholder="#111827"
              onChange={(event) => onChange(styleKeys.color, event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                className="h-6 w-6 rounded-md border border-slate-300 ring-offset-2"
                style={{ backgroundColor: color }}
                onClick={() => onChange(styleKeys.color, color)}
                aria-label={`Usar color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Tamaño</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="120"
              value={Number(textMap[styleKeys.size] ?? selectedSlot.defaultSize)}
              onChange={(event) => onChange(styleKeys.size, event.target.value)}
              className="w-full"
            />
            <Input
              className="w-20"
              type="number"
              value={textMap[styleKeys.size] ?? String(selectedSlot.defaultSize)}
              onChange={(event) => onChange(styleKeys.size, event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Peso</label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm"
              value={textMap[styleKeys.fontWeight] ?? ""}
              onChange={(event) => onChange(styleKeys.fontWeight, event.target.value)}
            >
              <option value="">Default</option>
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">
              Alineación
            </label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm"
              value={textMap[styleKeys.align] ?? ""}
              onChange={(event) => onChange(styleKeys.align, event.target.value)}
            >
              <option value="">Default</option>
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
              <option value="justify">Justificado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">
              Interlineado
            </label>
            <Input
              type="number"
              step="0.05"
              min="0.8"
              max="3"
              value={textMap[styleKeys.lineHeight] ?? ""}
              placeholder="Default"
              onChange={(event) => onChange(styleKeys.lineHeight, event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">
              Tracking
            </label>
            <Input
              type="number"
              min="-10"
              max="40"
              value={textMap[styleKeys.letterSpacing] ?? ""}
              placeholder="Default"
              onChange={(event) =>
                onChange(styleKeys.letterSpacing, event.target.value)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
