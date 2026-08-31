"use client";

import { ChevronLeft, ChevronRight, Monitor, Save } from "lucide-react";
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
import { CmsPreviewFrame } from "@/modules/dashboard/components/cms-preview-frame";
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
  if (
    value === "montserrat" ||
    value === "indie-flower" ||
    value === "roboto-condensed"
  ) {
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
      repairLandingContentText(value),
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
  slots: LandingContentSlot[];
  pageSlug?: string;
  previewLabel: string;
  previewScale?: number;
  renderPreview: (props: {
    textMap: LandingTextMap;
    selectedSlotId: string;
    onSelectSlot: (slotId: string) => void;
  }) => ReactNode;
};

export function PageContentEditor({
  initialTextMap,
  slots: baseSlots,
  pageSlug = "/",
  previewLabel,
  previewScale = PREVIEW_ZOOM_BASE_SCALE,
  renderPreview,
}: PageContentEditorProps) {
  const [textMap, setTextMap] = useState(() =>
    normalizeTextMap(initialTextMap, baseSlots),
  );
  const slots = baseSlots;
  const [selectedSlotId, setSelectedSlotId] = useState(slots[0]?.id ?? "");
  const [statusMessage, setStatusMessage] = useState("");
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const { portalTarget } = useDashboardEditorPanel();

  const validSlotIds = useMemo(() => new Set(slots.map((slot) => slot.id)), [slots]);

  function selectSlot(slotId: string) {
    if (!validSlotIds.has(slotId)) {
      return;
    }

    setSelectedSlotId(slotId);
  }

  const selectedIndex = Math.max(
    0,
    slots.findIndex((slot) => slot.id === selectedSlotId),
  );
  const selectedSlot = slots[selectedIndex] ?? slots[0];

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

  function goToSlot(direction: -1 | 1) {
    if (slots.length === 0) {
      return;
    }
    const nextIndex = (selectedIndex + direction + slots.length) % slots.length;
    setSelectedSlotId(slots[nextIndex]!.id);
  }

  async function handlePublish() {
    const repairedTextMap = Object.fromEntries(
      Object.entries(textMap).map(([key, value]) => [
        key,
        repairLandingContentText(value),
      ]),
    ) as LandingTextMap;
    setTextMap(repairedTextMap);
    const result =
      pageSlug === "/"
        ? await publishCmsAction(repairedTextMap)
        : await publishCmsPageAction(pageSlug, repairedTextMap);
    setStatusMessage(
      result.ok
        ? "Contenido publicado."
        : "No se pudo publicar el contenido.",
    );
  }

  if (!selectedSlot) {
    return null;
  }

  const selector = (
    <div className="flex h-16 items-center border-b bg-white">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => goToSlot(-1)}
        aria-label="Texto anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0 flex-1 px-2 text-center">
        <p className="truncate text-sm font-semibold text-slate-900">
          {selectedSlot.selectorLabel}
        </p>
        <p className="text-[11px] text-slate-500">
          {selectedIndex + 1} de {slots.length}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => goToSlot(1)}
        aria-label="Texto siguiente"
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
        <div className="flex h-full min-h-0 flex-col bg-white">
          {selector}
          {statusMessage ? (
            <p className="border-b bg-slate-50 px-4 py-2 text-xs text-slate-600">
              {statusMessage}
            </p>
          ) : null}
          <LandingContentSidePanel
            textMap={textMap}
            selectedSlot={selectedSlot}
            onChange={updateValue}
          />
        </div>,
        portalTarget,
      )
    : null;

  return (
    <main className="h-full min-h-0 min-w-0 overflow-hidden">
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
              {renderPreview({
                textMap,
                selectedSlotId,
                onSelectSlot: selectSlot,
              })}
            </div>
          </div>
        </div>
      </CmsPreviewFrame>
    </main>
  );
}

export function LandingContentEditor({
  initialTextMap,
}: {
  initialTextMap: LandingTextMap;
}) {
  const slots = useMemo(() => getLandingContentSlots(), []);

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      slots={slots}
      previewLabel="Preview de landing"
      renderPreview={({ textMap, selectedSlotId, onSelectSlot }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome>
          <LandingView
            textMap={textMap}
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
}: {
  initialTextMap: LandingTextMap;
}) {
  const slots = useMemo(() => getQuienesSomosContentSlots(), []);

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      slots={slots}
      pageSlug="/quienes-somos"
      previewLabel="Preview de Quienes Somos"
      renderPreview={({ textMap, selectedSlotId, onSelectSlot }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome>
          <QuienesSomosView
            textMap={textMap}
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
}: {
  initialTextMap: LandingTextMap;
}) {
  const slots = useMemo(() => getComoAcompanamosContentSlots(), []);

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      slots={slots}
      pageSlug="/como-acompanamos"
      previewLabel="Preview de Cómo acompañamos"
      renderPreview={({ textMap, selectedSlotId, onSelectSlot }) => (
        <LandingPageLayout textMap={textMap} previewMode hideChrome>
          <ComoAcompanamosView
            textMap={textMap}
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
  onChange,
}: {
  textMap: LandingTextMap;
  selectedSlot: LandingContentSlot;
  onChange: (key: string, value: string) => void;
}) {
  const styleKeys = getLandingContentSlotStyleKeys(selectedSlot.id);
  const value = getLandingContentSlotValue(textMap, selectedSlot);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="border-b px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Texto seleccionado
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-900">
          {selectedSlot.label}
        </h2>
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
