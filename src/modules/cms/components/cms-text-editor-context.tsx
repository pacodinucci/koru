"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { CmsInsertedTextPosition } from "@/modules/cms/inserted-text-blocks";

type CmsTextEditorContextValue = {
  selectedSlotId: string;
  onSelectSlot: (slotId: string) => void;
  onInsertText: (targetSlotId: string, position: CmsInsertedTextPosition) => void;
  onDeleteText: (slotId: string) => void;
};

const CmsTextEditorContext = createContext<CmsTextEditorContextValue | null>(null);

export function CmsTextEditorProvider({
  value,
  children,
}: {
  value: CmsTextEditorContextValue;
  children: ReactNode;
}) {
  return (
    <CmsTextEditorContext.Provider value={value}>
      {children}
    </CmsTextEditorContext.Provider>
  );
}

export function useCmsTextEditor() {
  return useContext(CmsTextEditorContext);
}


