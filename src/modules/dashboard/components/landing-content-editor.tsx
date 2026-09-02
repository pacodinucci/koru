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
import { useEffect, useMemo, useRef, useState } from "react";
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

const fontOptions = [{ value: "montserrat", label: "Montserrat" }];

function getLandingEditorFontFamilyValue(value: string | undefined) {
  if (value === "montserrat") {
    return value;
  }

  return "montserrat";
}

const PREVIEW_ZOOM_BASE_SCALE = 0.62;
const PREVIEW_CANVAS_WIDTH = 1440;

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

  async function updateImage(key: string, image: CmsImageValue) {
    setImageMap((previous) => ({ ...previous, [key]: image }));
    setStatusMessage("Guardando borrador de imagen...");

    const result = await saveCmsPageDraftImageAction(pageSlug, key, image);
    setStatusMessage(
      result.ok
        ? "Borrador de imagen guardado."
        : "No se pudo guardar el borrador de imagen.",
    );
  }

  async function handlePublish() {
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
                width: `${PREVIEW_CANVAS_WIDTH * previewScale}px`,
                minWidth: `${PREVIEW_CANVAS_WIDTH * previewScale}px`,
              }}
              aria-hidden
            />
            <div
              className="origin-top-left bg-white"
              style={{
                zoom: previewScale,
                width: `${PREVIEW_CANVAS_WIDTH}px`,
              }}
            >
              <CmsImageAdjustmentProvider
                adjustingSlotId={adjustingImageSlotId}
                onCommitCrop={(slotId, image) => {
                  void updateImage(slotId, image);
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
      renderPreview={({ textMap, imageMap, selectedSlotId, onSelectSlot }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome>
          <LandingView
            textMap={textMap}
            imageMap={imageMap}
            previewMode
            selectedFieldId={selectedSlotId}
            onSelectField={onSelectSlot}
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
      renderPreview={({ textMap, imageMap, selectedSlotId, onSelectSlot }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome>
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
      renderPreview={({ textMap, imageMap, selectedSlotId, onSelectSlot }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome>
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





