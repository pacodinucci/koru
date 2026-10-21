"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  createBoardAction, createCardAction, createStatusAction,
  deleteBoardAction, deleteCardAction, deleteStatusAction,
  getBoardAction, listAssigneesAction, listBoardsAction,
  moveCardAction, reorderStatusesAction,
  updateBoardAction, updateCardAction, updateStatusAction,
} from "@/modules/kanban/server/kanban.actions";
import type { KanbanAssignee, KanbanBoard, KanbanBoardSummary, KanbanCard } from "@/modules/kanban/types";
import { KanbanEditor, selectClass, type KanbanEditorState } from "./kanban-editor";

type WorkspaceData = {
  boards: KanbanBoardSummary[];
  board: KanbanBoard | null;
  assignees: KanbanAssignee[];
};
const dragFormat = "application/x-koru-kanban-card";
const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : "No pudimos completar la operación. Intentá nuevamente.";

async function loadWorkspace(preferredId?: string): Promise<WorkspaceData> {
  const [boards, assignees] = await Promise.all([listBoardsAction(), listAssigneesAction()]);
  const boardId = boards.find((item) => item.id === preferredId)?.id ?? boards[0]?.id;
  const board = boardId ? await getBoardAction(boardId) : null;
  if (boardId && !board) throw new Error("El tablero ya no está disponible. Actualizá la lista.");
  return { boards, board, assignees };
}

export function KanbanWorkspace() {
  const [data, setData] = useState<WorkspaceData>({ boards: [], board: null, assignees: [] });
  const [editor, setEditor] = useState<KanbanEditorState | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  // A synchronous lock also rejects duplicate events before React renders disabled controls.
  const locked = useRef(true);
  const pending = loading || saving;
  const { board, boards, assignees } = data;
  const statuses = [...(board?.statuses ?? [])].sort((a, b) => a.position - b.position);

  useEffect(() => {
    let cancelled = false;
    loadWorkspace().then((result) => {
      if (!cancelled) setData(result);
    }).catch((cause: unknown) => {
      if (!cancelled) setError(errorMessage(cause));
    }).finally(() => {
      if (!cancelled) { locked.current = false; setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  async function reload(preferredId = board?.id) {
    if (locked.current) return;
    locked.current = true;
    setLoading(true);
    setError(null);
    setNotice("");
    try {
      setData(await loadWorkspace(preferredId));
      setEditor(null);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
      locked.current = false;
    }
  }

  async function persist(action: () => Promise<void | { id: string }>, closeEditor = false, removeBoard = false) {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    setError(null);
    setNotice("");
    let persisted = false;
    try {
      const result = await action();
      persisted = true;
      if (closeEditor) setEditor(null);
      const preferredId = result ? result.id : removeBoard ? undefined : board?.id;
      setData(await loadWorkspace(preferredId));
      setNotice("Cambios guardados.");
    } catch (cause) {
      setError(persisted
        ? `Los cambios se guardaron, pero no pudimos actualizar la vista. Usá Reintentar. ${errorMessage(cause)}`
        : errorMessage(cause));
    } finally {
      setSaving(false);
      locked.current = false;
    }
  }

  function openEditor(next: KanbanEditorState) {
    if (locked.current) return;
    setError(null);
    setNotice("");
    setEditorVersion((version) => version + 1);
    setEditor(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || locked.current) return;
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const description = value("description");
    if ((editor.kind === "board" || editor.kind === "status") && !value("name")) {
      setError("Ingresá un nombre."); return;
    }
    if (editor.kind === "card" && !value("title")) {
      setError("Ingresá un título."); return;
    }
    if (editor.kind === "board") {
      const input = { name: value("name"), description };
      return persist(() => editor.board ? updateBoardAction({ id: editor.board.id, ...input }) : createBoardAction(input), true);
    }
    if (editor.kind === "deleteBoard") return persist(() => deleteBoardAction({ id: editor.board.id }), true, true);
    if (!board) return;
    const boardId = board.id;
    switch (editor.kind) {
      case "status": {
        const input = { boardId, name: value("name"), color: value("color") };
        return persist(() => editor.status ? updateStatusAction({ id: editor.status.id, ...input }) : createStatusAction(input), true);
      }
      case "deleteStatus": {
        const destinationStatusId = value("destinationStatusId");
        if (editor.status.cards.length > 0 && !statuses.some((status) => status.id === destinationStatusId && status.id !== editor.status.id)) {
          setError("Elegí una columna de destino para las tarjetas."); return;
        }
        return persist(() => deleteStatusAction({ boardId, id: editor.status.id,
          ...(editor.status.cards.length > 0 ? { destinationStatusId } : {}),
        }), true);
      }
      case "card": {
        const input = { boardId, title: value("title"), description,
          assigneeId: value("assigneeId") || null, dueDate: value("dueDate") || null,
        };
        return persist(() => editor.card ? updateCardAction({ id: editor.card.id, ...input }) : createCardAction({ statusId: editor.statusId, ...input }), true);
      }
      case "deleteCard": return persist(() => deleteCardAction({ boardId, id: editor.card.id }), true);
    }
  }

  async function moveCard(card: KanbanCard, sourceId: string, targetId: string) {
    const target = statuses.find((status) => status.id === targetId);
    if (!board || !target || sourceId === targetId) return;
    return persist(() => moveCardAction({ boardId: board.id, id: card.id, statusId: target.id, position: target.cards.length }));
  }

  async function reorderStatus(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!board || target < 0 || target >= statuses.length) return;
    const statusIds = statuses.map((status) => status.id);
    [statusIds[index], statusIds[target]] = [statusIds[target], statusIds[index]];
    return persist(() => reorderStatusesAction({ boardId: board.id, statusIds }));
  }

  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]" aria-busy={pending}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Kanban</h1>
          <p className="mt-1 text-sm text-slate-600">Tableros compartidos entre todos los usuarios internos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending} onClick={() => reload()}>Actualizar</Button>
          <Button disabled={pending} onClick={() => openEditor({ kind: "board" })}>Nuevo tablero</Button>
        </div>
      </header>
      <p role="status" aria-live="polite" className="text-sm text-slate-600">
        {saving ? "Guardando…" : loading ? "Cargando tableros…" : notice}
      </p>
      {error ? <div className="space-y-2"><p role="alert" className="text-sm text-red-700">{error}</p><Button variant="outline" disabled={pending} onClick={() => reload()}>Reintentar</Button></div> : null}
      <nav aria-label="Tableros" className="flex flex-wrap gap-2">
        {boards.map((item) => (
          <Button key={item.id} variant={board?.id === item.id ? "default" : "outline"} disabled={pending}
            aria-label={`Abrir ${item.name}`} aria-pressed={board?.id === item.id} onClick={() => reload(item.id)}>
            {item.name} <span className="text-xs">({item.cardCount})</span>
          </Button>
        ))}
      </nav>
      {editor ? <KanbanEditor key={editorVersion} editor={editor} statuses={statuses} assignees={assignees} pending={pending} error={error} onSubmit={submit} onCancel={() => { setEditor(null); setError(null); }} /> : null}
      {!loading && !error && boards.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Todavía no hay tableros. Creá el primero para organizar el trabajo del equipo.</p> : null}
      {board ? (
        <section aria-label={`Tablero ${board.name}`} className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-semibold text-slate-900">{board.name}</h2>
              {board.description ? <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{board.description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={pending} onClick={() => openEditor({ kind: "board", board })}>Editar tablero</Button>
              <Button variant="outline" disabled={pending} onClick={() => openEditor({ kind: "deleteBoard", board })}>Eliminar tablero</Button>
              <Button disabled={pending} onClick={() => openEditor({ kind: "status" })}>Nueva columna</Button>
            </div>
          </div>
          <p className="text-sm text-slate-500">Arrastrá las tarjetas a otra columna o usá el selector «Mover» de cada tarjeta.</p>
          {statuses.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Este tablero no tiene columnas. Agregá una para empezar a crear tarjetas.</p> : null}
          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {statuses.map((status, index) => (
              <section key={status.id} aria-label={`Columna ${status.name}`}
                className="w-80 shrink-0 space-y-3 rounded-xl border border-slate-200 border-t-4 bg-slate-50 p-3"
                style={{ borderTopColor: status.color }}
                onDragOver={(event) => { if (!pending) event.preventDefault(); }}
                onDrop={async (event) => {
                  event.preventDefault();
                  if (pending) return;
                  const cardId = event.dataTransfer.getData(dragFormat);
                  const source = statuses.find((item) => item.cards.some((card) => card.id === cardId));
                  const card = source?.cards.find((item) => item.id === cardId);
                  if (source && card) await moveCard(card, source.id, status.id);
                }}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words font-semibold text-slate-800">{status.name} <span className="text-sm font-normal">({status.cards.length})</span></h3>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" disabled={pending || index === 0} aria-label={`Mover ${status.name} a la izquierda`} onClick={() => reorderStatus(index, -1)}>←</Button>
                    <Button size="icon" variant="ghost" disabled={pending || index === statuses.length - 1} aria-label={`Mover ${status.name} a la derecha`} onClick={() => reorderStatus(index, 1)}>→</Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={pending} aria-label={`Editar columna ${status.name}`} onClick={() => openEditor({ kind: "status", status })}>Editar</Button>
                  <Button size="sm" variant="outline" disabled={pending} aria-label={`Eliminar columna ${status.name}`} onClick={() => openEditor({ kind: "deleteStatus", status })}>Eliminar</Button>
                </div>
                {[...status.cards].sort((a, b) => a.position - b.position).map((card) => (
                  <article key={card.id} draggable={!pending}
                    onDragStart={(event) => { event.dataTransfer.setData(dragFormat, card.id); event.dataTransfer.effectAllowed = "move"; }}
                    className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <h4 className="break-words font-medium text-slate-900">{card.title}</h4>
                    {card.description ? <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{card.description}</p> : null}
                    <p className="text-xs text-slate-500">Responsable: {assignees.find((user) => user.id === card.assigneeId)?.name ?? (card.assigneeId ? "No disponible" : "Sin responsable")}</p>
                    {card.dueDate ? <p className="text-xs text-slate-500">Vence: <time dateTime={card.dueDate.slice(0, 10)}>{card.dueDate.slice(0, 10).split("-").reverse().join("/")}</time></p> : null}
                    <select aria-label={`Mover ${card.title}`} className={selectClass} value={status.id} disabled={pending}
                      onChange={(event) => moveCard(card, status.id, event.target.value)}>
                      {statuses.map((target) => <option key={target.id} value={target.id}>{target.id === status.id ? `Mover: ${target.name}` : target.name}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={pending} aria-label={`Editar tarjeta ${card.title}`} onClick={() => openEditor({ kind: "card", statusId: status.id, card })}>Editar</Button>
                      <Button size="sm" variant="outline" disabled={pending} aria-label={`Eliminar tarjeta ${card.title}`} onClick={() => openEditor({ kind: "deleteCard", card })}>Eliminar</Button>
                    </div>
                  </article>
                ))}
                {status.cards.length === 0 ? <p className="text-sm text-slate-500">Sin tarjetas.</p> : null}
                <Button variant="outline" className="w-full" disabled={pending} aria-label={`Nueva tarjeta en ${status.name}`} onClick={() => openEditor({ kind: "card", statusId: status.id })}>Nueva tarjeta</Button>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
