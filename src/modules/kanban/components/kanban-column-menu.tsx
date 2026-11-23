"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { KanbanStatus } from "@/modules/kanban/types";

export type ColumnIntent = "watch" | "hold" | "add" | "rename" | "archive" | "trash";
const palette = [
  ["", "Sin color"], ["#64748b", "Gris"], ["#3b82f6", "Azul"],
  ["#22c55e", "Verde"], ["#eab308", "Amarillo"], ["#f97316", "Naranja"],
  ["#ef4444", "Rojo"], ["#a855f7", "Morado"], ["#ec4899", "Rosa"],
];

export function KanbanColumnMenu({ status, open, paletteOpen, onOpenChange, onPaletteChange, onIntent, onColor }: {
  status: KanbanStatus;
  open: boolean;
  paletteOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPaletteChange: (open: boolean) => void;
  onIntent: (intent: ColumnIntent) => void;
  onColor: (color: string) => void;
}) {
  // Include legacy/custom colors so the selected marker always has a matching item.
  const colors = palette.some(([color]) => color === status.color)
    ? palette : [...palette, [status.color, "Color actual"]];
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger render={<Button size="icon" variant="ghost" aria-label={`Opciones de ${status.name}`} />}>⋯</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => onIntent("watch")}>{status.watching ? "Dejar de seguir esta columna" : "Seguir esta columna"}</DropdownMenuItem>
        <DropdownMenuSub open={paletteOpen} onOpenChange={onPaletteChange}>
          <DropdownMenuSubTrigger>Color de la columna</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={status.color || ""}>
              {colors.map(([color, label]) => (
                <DropdownMenuRadioItem key={color} value={color} aria-label={label} aria-checked={(status.color || "") === color} onClick={() => onColor(color)}>
                  <span aria-hidden="true" className="size-4 rounded-full border border-slate-300" style={{ backgroundColor: color || "transparent" }} />{label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => onIntent("add")}>Agregar tarjeta</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onIntent("hold")}>{status.holdEnabled ? "Deshabilitar tareas en espera" : "Habilitar tareas en espera"}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onIntent("rename")}>Cambiar nombre</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onIntent("archive")}>Archivar columna</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onIntent("trash")}>Mover a la papelera</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
