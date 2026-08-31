"use client";

import type { CSSProperties, ElementType } from "react";

import { getCmsContentSlots, type CmsContentPageKey } from "@/modules/cms/content-page-config";
import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";

const slotMaps = new Map<CmsContentPageKey, Map<string, ReturnType<typeof getCmsContentSlots>[number]>>();

function getSlot(page: CmsContentPageKey, slotId: string) {
  let map = slotMaps.get(page);
  if (!map) {
    map = new Map(getCmsContentSlots(page).map((slot) => [slot.id, slot]));
    slotMaps.set(page, map);
  }
  const slot = map.get(slotId);
  if (!slot) throw new Error(`Unknown ${page} content slot: ${slotId}`);
  return slot;
}

type CmsPageEditableCopyProps = {
  page: CmsContentPageKey;
  slotId: string;
  textMap: LandingTextMap;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  stylePriority?: "base" | "override";
} & Pick<LandingPreviewBindings, "previewMode" | "selectedContentSlotId" | "onSelectContentSlot">;

export function CmsPageEditableCopy({
  page,
  slotId,
  textMap,
  as,
  className,
  style,
  stylePriority,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: CmsPageEditableCopyProps) {
  return (
    <EditableContentSlot
      as={as}
      slot={getSlot(page, slotId)}
      textMap={textMap}
      previewMode={previewMode}
      selected={selectedContentSlotId === slotId}
      onSelect={onSelectContentSlot}
      className={className}
      style={style}
      stylePriority={stylePriority}
    />
  );
}