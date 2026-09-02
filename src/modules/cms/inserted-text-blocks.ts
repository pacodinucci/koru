import type { LandingContentSlot } from "@/modules/landing/content-slots";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

export const CMS_INSERTED_TEXT_BLOCKS_KEY = "__cms_inserted_text_blocks";
export const CMS_DELETED_TEXT_SLOT_IDS_KEY = "__cms_deleted_text_slot_ids";
export const CMS_INSERTED_TEXT_BLOCK_ID_PREFIX = "cms.inserted.";

export type CmsInsertedTextPosition = "before" | "after";

export type CmsInsertedTextBlock = {
  id: string;
  anchorSlotId: string;
  position: CmsInsertedTextPosition;
  order: number;
};

function isInsertedTextBlock(value: unknown): value is CmsInsertedTextBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Partial<CmsInsertedTextBlock>;
  return (
    typeof block.id === "string" &&
    block.id.startsWith(CMS_INSERTED_TEXT_BLOCK_ID_PREFIX) &&
    typeof block.anchorSlotId === "string" &&
    (block.position === "before" || block.position === "after") &&
    typeof block.order === "number" &&
    Number.isFinite(block.order)
  );
}

export function getCmsInsertedTextBlocks(
  textMap: LandingTextMap,
): CmsInsertedTextBlock[] {
  const raw = textMap[CMS_INSERTED_TEXT_BLOCKS_KEY];
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isInsertedTextBlock);
  } catch {
    return [];
  }
}

export function getCmsDeletedTextSlotIds(textMap: LandingTextMap) {
  const raw = textMap[CMS_DELETED_TEXT_SLOT_IDS_KEY];
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function serializeCmsDeletedTextSlotIds(slotIds: string[]) {
  return JSON.stringify([...new Set(slotIds)]);
}
export function serializeCmsInsertedTextBlocks(
  blocks: CmsInsertedTextBlock[],
) {
  return JSON.stringify(blocks);
}

export function getCmsInsertedTextSlot(
  block: CmsInsertedTextBlock,
): LandingContentSlot {
  return {
    id: block.id,
    label: block.position === "before" ? "Texto agregado arriba" : "Texto agregado abajo",
    selectorLabel:
      block.position === "before" ? "Texto agregado arriba" : "Texto agregado abajo",
    defaultValue: "Nuevo texto",
    defaultSize: 16,
    multiline: true,
    styleControls: [
      "font",
      "size",
      "color",
      "align",
      "weight",
      "lineHeight",
      "letterSpacing",
    ],
  };
}

export function sortCmsInsertedTextBlocks(blocks: CmsInsertedTextBlock[]) {
  return [...blocks].sort((left, right) => left.order - right.order);
}

export function isCmsInsertedTextBlockId(slotId: string) {
  return slotId.startsWith(CMS_INSERTED_TEXT_BLOCK_ID_PREFIX);
}

