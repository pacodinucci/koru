"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader,
  ResponsiveDialogTitle, ResponsiveDialogDescription, ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog";
import type { KanbanAssignee, KanbanBoard, KanbanCard, KanbanStatus } from "@/modules/kanban/types";

export type KanbanEditorState =
  | { kind: "board"; board?: KanbanBoard }
  | { kind: "status"; status?: KanbanStatus }
  | { kind: "card"; statusId: string; card?: KanbanCard }
  | { kind: "deleteBoard"; board: KanbanBoard }
  | { kind: "deleteStatus"; status: KanbanStatus }
  | { kind: "deleteCard"; card: KanbanCard };

export const selectClass = "h-10 w-full rounded-md border border-input bg-white px-3 text-sm disabled:opacity-50";
const textareaClass = "w-full rounded-md border border-input bg-white px-3 py-2 text-sm";

export function editorTitle(editor: KanbanEditorState) {
  switch (editor.kind) {
    case "board": return editor.board ? "Editar tablero" : "Crear tablero";
    case "status": return editor.status ? "Editar columna" : "Crear columna";
    case "card": return editor.card ? "Editar tarjeta" : "Crear tarjeta";
    case "deleteBoard": return "Eliminar tablero";
    case "deleteStatus": return "Eliminar columna";
    case "deleteCard": return "Eliminar tarjeta";
  }
}

export function KanbanEditor({ editor, statuses, assignees, pending, error, onSubmit, onCancel }: {
  editor: KanbanEditorState;
  statuses: KanbanStatus[];
  assignees: KanbanAssignee[];
  pending: boolean;
  error?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
}) {
  const title = editorTitle(editor);
  const deleting = editor.kind === "deleteBoard" || editor.kind === "deleteStatus" || editor.kind === "deleteCard";
  const occupied = editor.kind === "deleteStatus" && editor.status.cards.length > 0;
  const destinations = editor.kind === "deleteStatus" ? statuses.filter((status) => status.id !== editor.status.id) : [];
  const card = editor.kind === "card" ? editor.card : undefined;

  const creating = (editor.kind === "board" && !editor.board)
    || (editor.kind === "status" && !editor.status)
    || (editor.kind === "card" && !editor.card);
  const form = (
      <form aria-label={title} onSubmit={onSubmit}>
        {creating && error ? <p role="alert" className="mb-4 text-sm text-red-700">{error}</p> : null}
        <fieldset disabled={pending} className="space-y-4">
          <legend className="sr-only">{title}</legend>
          {editor.kind === "board" || editor.kind === "status" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="kanban-name">Nombre</Label>
                <Input id="kanban-name" name="name" required defaultValue={editor.kind === "board" ? editor.board?.name : editor.status?.name} />
              </div>
              {editor.kind === "board" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="kanban-description">Descripción (opcional)</Label>
                  <textarea id="kanban-description" name="description" rows={3} defaultValue={editor.board?.description ?? ""} className={textareaClass} />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="kanban-color">Color</Label>
                  <Input id="kanban-color" name="color" type="color" required defaultValue={editor.status?.color ?? "#64748b"} className="h-10 w-24 p-1" />
                </div>
              )}
            </>
          ) : null}
          {editor.kind === "card" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="kanban-title">Título</Label>
                <Input id="kanban-title" name="title" required defaultValue={card?.title ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kanban-description">Descripción (opcional)</Label>
                <textarea id="kanban-description" name="description" rows={4} defaultValue={card?.description ?? ""} className={textareaClass} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="kanban-assignee">Responsable (opcional)</Label>
                  <select id="kanban-assignee" name="assigneeId" defaultValue={card?.assigneeId ?? ""} className={selectClass}>
                    <option value="">Sin responsable</option>
                    {card?.assigneeId && !assignees.some((user) => user.id === card.assigneeId) ? <option value={card.assigneeId}>Responsable no disponible</option> : null}
                    {assignees.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kanban-due-date">Vencimiento (opcional)</Label>
                  <Input id="kanban-due-date" name="dueDate" type="date" defaultValue={card?.dueDate?.slice(0, 10) ?? ""} />
                </div>
              </div>
            </>
          ) : null}
          {editor.kind === "deleteBoard" ? <p className="text-sm text-slate-700">¿Eliminar el tablero «{editor.board.name}» y todas sus tarjetas? Esta acción no se puede deshacer.</p> : null}
          {editor.kind === "deleteCard" ? <p className="text-sm text-slate-700">¿Eliminar la tarjeta «{editor.card.title}»? Esta acción no se puede deshacer.</p> : null}
          {editor.kind === "deleteStatus" ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p>¿Eliminar la columna «{editor.status.name}»? Esta acción no se puede deshacer.</p>
              {occupied ? (
                <>
                  <p>Sus {editor.status.cards.length} tarjetas se moverán a la columna que elijas al confirmar.</p>
                  {destinations.length === 0 ? <p>Creá otra columna antes de eliminar esta columna con tarjetas.</p> : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="kanban-destination">Destino de las tarjetas</Label>
                    <select id="kanban-destination" name="destinationStatusId" required defaultValue="" className={selectClass}>
                      <option value="" disabled>Elegí una columna de destino</option>
                      {destinations.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
                    </select>
                  </div>
                </>
              ) : <p>La columna está vacía.</p>}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>Cancelar</Button>
            <Button type="submit" variant={deleting ? "destructive" : "default"} disabled={pending || (occupied && destinations.length === 0)}>
              {pending ? "Guardando…" : deleting ? "Confirmar eliminación" : "Guardar"}
            </Button>
          </div>
        </fieldset>
      </form>
  );

  if (creating) {
    return (
      <ResponsiveDialog open onOpenChange={(open) => { if (!open && !pending) onCancel(); }}>
        <ResponsiveDialogContent
          showCloseButton={!pending}
          className="md:w-[min(calc(100vw-2rem),36rem)] [font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]"
        >
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Completá los datos y guardá para confirmar la creación.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>{form}</ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }

  return (
    <section aria-labelledby="kanban-editor-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm [font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
      <h2 id="kanban-editor-heading" className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      {form}
    </section>
  );
}
