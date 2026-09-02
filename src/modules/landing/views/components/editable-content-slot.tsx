"use client";

import { ArrowDownToLine, ArrowUpToLine, Trash2 } from "lucide-react";
import type {
  CSSProperties,
  ElementType,
  MouseEvent,
  ReactElement,
  ReactNode,
} from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { useCmsTextEditor } from "@/modules/cms/components/cms-text-editor-context";
import {
  getCmsDeletedTextSlotIds,
  getCmsInsertedTextBlocks,
  getCmsInsertedTextSlot,
  sortCmsInsertedTextBlocks,
  type CmsInsertedTextPosition,
} from "@/modules/cms/inserted-text-blocks";
import {
  getLandingContentSlotStyle,
  getLandingContentSlotValue,
  type LandingContentSlot,
} from "@/modules/landing/content-slots";
import type {
  LandingResponsiveMode,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";

export function EditableContentSlot({
  as,
  slot,
  textMap,
  previewMode,
  selected,
  onSelect,
  responsiveMode,
  className,
  children,
  style,
  stylePriority = "base",
}: {
  as?: ElementType;
  slot: LandingContentSlot;
  textMap: LandingTextMap;
  previewMode?: boolean;
  selected?: boolean;
  onSelect?: (slotId: string) => void;
  responsiveMode?: LandingResponsiveMode;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
  stylePriority?: "base" | "override";
}) {
  const Component = as ?? "span";
  const value = getLandingContentSlotValue(textMap, slot);
  const slotStyle = getLandingContentSlotStyle(textMap, slot, responsiveMode);
  const editor = useCmsTextEditor();
  const isDeleted = getCmsDeletedTextSlotIds(textMap).includes(slot.id);
  const insertedBlocks = getCmsInsertedTextBlocks(textMap);
  const beforeBlocks = sortCmsInsertedTextBlocks(
    insertedBlocks.filter(
      (block) => block.anchorSlotId === slot.id && block.position === "before",
    ),
  );
  const afterBlocks = sortCmsInsertedTextBlocks(
    insertedBlocks.filter(
      (block) => block.anchorSlotId === slot.id && block.position === "after",
    ),
  );

  if (isDeleted) {
    return null;
  }

  const originalElement = (
    <Component
      data-content-slot-id={slot.id}
      className={cn(
        previewMode &&
          "cursor-pointer rounded-sm transition outline-offset-4 hover:outline hover:outline-1 hover:outline-[#3b82f6]",
        selected &&
          "outline outline-2 outline-[#2563eb] shadow-[0_0_0_5px_rgba(37,99,235,0.20)]",
        className,
      )}
      style={
        stylePriority === "override"
          ? { ...slotStyle, ...style, fontFamily: "var(--font-montserrat)" }
          : { ...style, ...slotStyle, fontFamily: "var(--font-montserrat)" }
      }
      onClick={(event: MouseEvent) => {
        if (!previewMode) return;
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(slot.id);
      }}
      onContextMenu={() => {
        if (previewMode) editor?.onSelectSlot(slot.id);
      }}
    >
      {children ?? value}
    </Component>
  );

  return (
    <>
      {beforeBlocks.map((block) => (
        <CmsInsertedText
          key={block.id}
          blockId={block.id}
          textMap={textMap}
          previewMode={previewMode}
          responsiveMode={responsiveMode}
        />
      ))}
      {previewMode && editor ? (
        <CmsInsertContextMenu targetSlotId={slot.id} trigger={originalElement} canDelete />
      ) : (
        originalElement
      )}
      {afterBlocks.map((block) => (
        <CmsInsertedText
          key={block.id}
          blockId={block.id}
          textMap={textMap}
          previewMode={previewMode}
          responsiveMode={responsiveMode}
        />
      ))}
    </>
  );
}

function CmsInsertContextMenu({
  targetSlotId,
  trigger,
  canDelete = false,
}: {
  targetSlotId: string;
  trigger: ReactElement;
  canDelete?: boolean;
}) {
  const editor = useCmsTextEditor();
  if (!editor) return trigger;

  function insert(position: CmsInsertedTextPosition) {
    editor?.onInsertText(targetSlotId, position);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger render={trigger} />
      <ContextMenuContent>
        <ContextMenuItem onClick={() => insert("before")}>
          <ArrowUpToLine />
          Insertar texto arriba
        </ContextMenuItem>
        <ContextMenuItem onClick={() => insert("after")}>
          <ArrowDownToLine />
          Insertar texto abajo
        </ContextMenuItem>
        {canDelete ? (
          <ContextMenuItem
            variant="destructive"
            onClick={() => editor.onDeleteText(targetSlotId)}
          >
            <Trash2 />
            Eliminar texto
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function CmsInsertedText({
  blockId,
  textMap,
  previewMode,
  responsiveMode,
}: {
  blockId: string;
  textMap: LandingTextMap;
  previewMode?: boolean;
  responsiveMode?: LandingResponsiveMode;
}) {
  const editor = useCmsTextEditor();
  const block = getCmsInsertedTextBlocks(textMap).find(
    (item) => item.id === blockId,
  );
  if (!block) return null;

  const dynamicSlot = getCmsInsertedTextSlot(block);
  const value = getLandingContentSlotValue(textMap, dynamicSlot);
  const dynamicStyle = getLandingContentSlotStyle(
    textMap,
    dynamicSlot,
    responsiveMode,
  );
  const element = (
    <span
      data-content-slot-id={block.id}
      className={cn(
        "my-2 block w-full whitespace-pre-wrap",
        previewMode &&
          "cursor-pointer rounded-sm transition outline-offset-4 hover:outline hover:outline-1 hover:outline-[#3b82f6]",
        editor?.selectedSlotId === block.id &&
          "outline outline-2 outline-[#2563eb] shadow-[0_0_0_5px_rgba(37,99,235,0.20)]",
      )}
      style={{ ...dynamicStyle, fontFamily: "var(--font-montserrat)" }}
      onClick={(event) => {
        if (!previewMode) return;
        event.preventDefault();
        event.stopPropagation();
        editor?.onSelectSlot(block.id);
      }}
      onContextMenu={() => {
        if (previewMode) editor?.onSelectSlot(block.id);
      }}
    >
      {value}
    </span>
  );

  return previewMode && editor ? (
    <CmsInsertContextMenu targetSlotId={block.id} trigger={element} canDelete />
  ) : (
    element
  );
}



