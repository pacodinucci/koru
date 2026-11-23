"use client";

import { useId, useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";

type Guest = { id: string; name: string; roleLabel: string };
type Props = {
  users: Guest[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  triggerId: string;
};

export function CalendarEventGuestPicker({ users, selectedIds, onChange, triggerId }: Props) {
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState("");
  const selected = new Set(draftIds);
  const availableUsers = users.filter((user) => !selected.has(user.id));
  const selectedUsers = users.filter((user) => selected.has(user.id));
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const query = normalize(search.trim());
  const visibleAvailableUsers = availableUsers.filter((user) => normalize(`${user.name} ${user.roleLabel}`).includes(query));
  const confirmedNames = users.filter((user) => selectedIds.includes(user.id)).map((user) => user.name);

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraftIds([...new Set(selectedIds)]);
      setSearch("");
    }
    setOpen(next);
  }

  function applySelection() {
    onChange([...new Set(draftIds)]);
    setOpen(false);
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <div className="space-y-2">
        <ResponsiveDialogTrigger render={<button id={triggerId} type="button" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" />}>
          Seleccionar invitados
        </ResponsiveDialogTrigger>
        <p className="text-xs text-slate-500" aria-live="polite">{selectedIds.length} {selectedIds.length === 1 ? "seleccionado" : "seleccionados"}</p>
        {confirmedNames.length ? <p className="break-words text-xs text-slate-600">{confirmedNames.join(", ")}</p> : null}
      </div>
      <ResponsiveDialogContent className="max-h-[95dvh] md:w-[min(calc(100vw-2rem),64rem)] [font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader className="pb-2">
          <ResponsiveDialogTitle>Invitados del evento privado</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            <section aria-label="Personas disponibles" className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200">
              <h3 className="border-b bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">Disponibles ({availableUsers.length})</h3>
              <div className="flex w-full items-center border-b border-slate-100 p-0 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-600">
                <Search className="mx-2 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                <input id={searchId} aria-label="Buscar personas disponibles" type="search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} placeholder="Nombre o rol" className="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none" />
              </div>
              <ul className="h-56 overflow-y-auto overscroll-contain p-0 md:h-80">
                {visibleAvailableUsers.map((user) => (
                  <li key={user.id} className="flex min-h-8 w-full items-center gap-2 border-b border-slate-100 p-0">
                    <div className="min-w-0 flex-1 pl-3">
                      <p className="break-words text-[13px] font-medium leading-4 text-slate-800">{user.name}</p>
                      <p className="text-xs leading-3 text-slate-500">{user.roleLabel}</p>
                    </div>
                    <button type="button" aria-label={`Agregar a ${user.name}`} onClick={() => setDraftIds((ids) => ids.includes(user.id) ? ids : [...ids, user.id])} className="flex size-8 shrink-0 items-center justify-center p-0 text-emerald-700 hover:bg-emerald-50"><ArrowRight className="size-4" aria-hidden="true" /></button>
                  </li>
                ))}
                {!visibleAvailableUsers.length ? <li className="p-3 text-sm text-slate-500">{availableUsers.length ? "No hay personas que coincidan con la búsqueda." : "No quedan personas disponibles."}</li> : null}
              </ul>
            </section>
            <section aria-label="Invitados seleccionados" className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-emerald-200">
              <h3 className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" aria-live="polite">Invitados ({selectedUsers.length})</h3>
              <ul className="h-56 overflow-y-auto overscroll-contain p-0 md:h-80">
                {selectedUsers.map((user) => (
                  <li key={user.id} className="flex min-h-8 w-full items-center gap-2 border-b border-slate-100 p-0">
                    <button type="button" aria-label={`Quitar a ${user.name}`} onClick={() => setDraftIds((ids) => ids.filter((id) => id !== user.id))} className="flex size-8 shrink-0 items-center justify-center p-0 text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-4" aria-hidden="true" /></button>
                    <div className="min-w-0 flex-1 pl-3">
                      <p className="break-words text-[13px] font-medium leading-4 text-slate-800">{user.name}</p>
                      <p className="text-xs leading-3 text-slate-500">{user.roleLabel}</p>
                    </div>
                  </li>
                ))}
                {!selectedUsers.length ? <li className="p-3 text-sm text-slate-500">Todavía no seleccionaste invitados.</li> : null}
              </ul>
            </section>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="button" onClick={applySelection} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Aplicar selección</button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
