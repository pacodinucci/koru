"use client";

import { useId, useState } from "react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
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
  const visibleSelectedUsers = selectedUsers.filter((user) => normalize(`${user.name} ${user.roleLabel}`).includes(query));
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
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Invitados del evento privado</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Agregá personas desde la lista izquierda. A la derecha podés buscar y quitar invitados.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="grid gap-4 md:grid-cols-2">
            <section aria-label="Personas disponibles" className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200">
              <h3 className="border-b bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">Disponibles ({availableUsers.length})</h3>
              <ul className="h-56 space-y-2 overflow-y-auto overscroll-contain p-3 md:h-80">
                {availableUsers.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.roleLabel}</p>
                    </div>
                    <button type="button" aria-label={`Agregar a ${user.name}`} onClick={() => setDraftIds((ids) => ids.includes(user.id) ? ids : [...ids, user.id])} className="shrink-0 rounded-md border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">Agregar →</button>
                  </li>
                ))}
                {!availableUsers.length ? <li className="p-3 text-sm text-slate-500">No quedan personas disponibles.</li> : null}
              </ul>
            </section>
            <section aria-label="Invitados seleccionados" className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-emerald-200">
              <h3 className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" aria-live="polite">Invitados ({selectedUsers.length})</h3>
              <div className="space-y-2 border-b border-slate-100 p-3">
                <label htmlFor={searchId} className="block text-xs font-medium text-slate-700">Buscar entre los invitados</label>
                <input id={searchId} type="search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} placeholder="Nombre o rol" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <ul className="h-56 space-y-2 overflow-y-auto overscroll-contain p-3 md:h-80">
                {visibleSelectedUsers.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                    <button type="button" aria-label={`Quitar a ${user.name}`} onClick={() => setDraftIds((ids) => ids.filter((id) => id !== user.id))} className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">← Quitar</button>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.roleLabel}</p>
                    </div>
                  </li>
                ))}
                {!visibleSelectedUsers.length ? <li className="p-3 text-sm text-slate-500">{selectedUsers.length ? "No hay invitados que coincidan con la búsqueda." : "Todavía no seleccionaste invitados."}</li> : null}
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
