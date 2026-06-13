"use client";

import type { ElementType, MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";
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
}) {
  const Component = as ?? "span";
  const value = getLandingContentSlotValue(textMap, slot);
  const style = getLandingContentSlotStyle(textMap, slot, responsiveMode);

  return (
    <Component
      data-content-slot-id={slot.id}
      className={cn(
        previewMode &&
          "cursor-pointer rounded-sm transition outline-offset-4 hover:outline hover:outline-1 hover:outline-[#3b82f6]",
        selected &&
          "outline outline-2 outline-[#2563eb] shadow-[0_0_0_5px_rgba(37,99,235,0.20)]",
        className,
      )}
      style={style}
      onClick={(event: MouseEvent) => {
        if (!previewMode) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        onSelect?.(slot.id);
      }}
    >
      {children ?? value}
    </Component>
  );
}
