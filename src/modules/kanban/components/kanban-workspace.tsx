"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  createBoardAction, createCardAction, createStatusAction,
  deleteBoardAction, deleteCardAction,
  getBoardAction, listAssigneesAction, listBoardsAction,
  moveCardAction, reorderStatusesAction,
  updateBoardAction, updateCardAction, updateStatusAction,
  setStatusWatchingAction, setStatusHoldEnabledAction, setCardOnHoldAction,
  setStatusLifecycleAction, permanentlyDeleteStatusAction,
  listKanbanNotificationsAction, markKanbanNotificationReadAction,
} from "@/modules/kanban/server/kanban.actions";
import type { KanbanAssignee, KanbanBoard, KanbanBoardSummary, KanbanCard, KanbanStatus, KanbanNotification } from "@/modules/kanban/types";
import { KanbanEditor, selectClass, type KanbanEditorState } from "./kanban-editor";
import { KanbanColumnMenu, type ColumnIntent } from "./kanban-column-menu";
import { KanbanRecoveryPanel, KanbanNotificationsPanel, type KanbanPanel } from "./kanban-panels";

type WorkspaceData = {
  boards: KanbanBoardSummary[];
  board: KanbanBoard | null;
  assignees: KanbanAssignee[];
  notifications: KanbanNotification[];
};
const isActive = (status: KanbanStatus) => !status.archivedAt && !status.trashedAt;
const dragFormat = "application/x-koru-kanban-card";
const columnDragFormat = "application/x-koru-kanban-column";
type ColumnDrag = { boardId: string; id: string; ids: string[]; phase: "dragging" | "saving" };
const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : "No pudimos completar la operación. Intenta nuevamente.";

async function loadWorkspace(preferredId?: string, requirePreferred = false): Promise<WorkspaceData> {
  const [boards, assignees, notifications] = await Promise.all([listBoardsAction(), listAssigneesAction(), listKanbanNotificationsAction()]);
  if (requirePreferred && !boards.some((item) => item.id === preferredId)) throw new Error("El tablero ya no está disponible. Actualiza la lista.");
  const boardId = boards.find((item) => item.id === preferredId)?.id ?? boards[0]?.id;
  const board = boardId ? await getBoardAction(boardId) : null;
  if (boardId && (!board || board.id !== boardId)) throw new Error("El tablero ya no está disponible. Actualiza la lista.");
  return { boards, board, assignees, notifications };
}

type MoveIntent = { boardId: string; cardId: string; targetId: string };

function applyMove(data: WorkspaceData, move: MoveIntent): WorkspaceData {
  const board = data.board;
  if (!board || board.id !== move.boardId) return data;
  const source = board.statuses.find((status) => status.cards.some((card) => card.id === move.cardId));
  const target = board.statuses.find((status) => status.id === move.targetId);
  const card = source?.cards.find((item) => item.id === move.cardId);
  if (!source || !target || !isActive(source) || !isActive(target) || !card || source.id === target.id) return data;
  return { ...data, board: { ...board, statuses: board.statuses.map((status) => {
    if (status.id === source.id) return { ...status, cards: status.cards
      .filter((item) => item.id !== card.id)
      .sort((a, b) => a.position - b.position)
      .map((item, position) => ({ ...item, position })) };
    if (status.id === target.id) return { ...status, cards: [...status.cards, { ...card, position: target.cards.length }] };
    return status;
  }) } };
}

export function KanbanWorkspace() {
  const { toast } = useToast();
  const [data, setData] = useState<WorkspaceData>({ boards: [], board: null, assignees: [], notifications: [] });
  const [menuId, setMenuId] = useState<string | null>(null);
  const [paletteId, setPaletteId] = useState<string | null>(null);
  const [panel, setPanel] = useState<KanbanPanel | null>(null);
  const [editor, setEditor] = useState<KanbanEditorState | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ boardId: string; cardId: string } | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  const [columnDrag, setColumnDrag] = useState<ColumnDrag | null>(null);
  const currentData = useRef(data);
  const moves = useRef<MoveIntent[]>([]);
  const queue = useRef<{ run: () => void | Promise<void>; resolve: () => void }[]>([]);
  const running = useRef(false);
  const mounted = useRef(false);
  const version = useRef(0);
  const submissions = useRef(new Set<number>());
  // Only initial loading disables controls. Subsequent intents enter the FIFO queue.
  const pending = loading;
  const { board, boards, assignees, notifications } = data;
  const activeStatuses = (board?.statuses ?? []).filter(isActive).sort((a, b) => a.position - b.position);
  const validColumnDrag = columnDrag?.boardId === board?.id && activeStatuses.length === columnDrag?.ids.length
    && activeStatuses.every((status) => columnDrag?.ids.includes(status.id)) ? columnDrag : null;
  const statuses = validColumnDrag
    ? [...activeStatuses].sort((a, b) => validColumnDrag.ids.indexOf(a.id) - validColumnDrag.ids.indexOf(b.id))
    : activeStatuses;
  const dragSource = dragging?.boardId === board?.id
    ? statuses.find((status) => status.cards.some((card) => card.id === dragging?.cardId))
    : undefined;
  const draggedCard = dragSource?.cards.find((card) => card.id === dragging?.cardId);

  function clearDrag() {
    setDragging(null);
    setDragTargetId(null);
  }

  function publish(next = currentData.current) {
    currentData.current = next;
    if (mounted.current) setData(moves.current.reduce(applyMove, next));
  }

  function changeEditor(next: KanbanEditorState | null) {
    version.current += 1;
    setEditorVersion(version.current);
    setEditor(next);
  }

  function enqueue(run: () => void | Promise<void>): Promise<void> {
    if (!mounted.current) return Promise.resolve();
    if (!running.current) setError(null);
    return new Promise((resolve) => {
      queue.current.push({ run, resolve });
      void drain();
    });
  }

  async function drain() {
    if (running.current) return;
    running.current = true;
    setSaving(true);
    while (mounted.current && queue.current.length) {
      const job = queue.current.shift()!;
      try { await job.run(); }
      catch (cause) {
        if (mounted.current) setError((previous) => previous ? `${previous}\n${errorMessage(cause)}` : errorMessage(cause));
      } finally { job.resolve(); }
    }
    running.current = false;
    if (mounted.current) setSaving(false);
  }

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    loadWorkspace().then((result) => {
      if (!cancelled) publish(result);
    }).catch((cause: unknown) => {
      if (!cancelled) setError(errorMessage(cause));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      mounted.current = false;
      // Never start deferred writes after leaving the workspace.
      queue.current.splice(0).forEach((job) => job.resolve());
    };
    // Initial loading only; queued operations use refs rather than render closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requireBoard(boardId?: string) {
    const latest = currentData.current.board;
    if (!latest || latest.id !== boardId) throw new Error("El tablero cambió o ya no está disponible. Vuelve a elegir la acción.");
    return latest;
  }

  function requireStatus(boardId: string, id: string, state: "active" | "archived" | "trashed" = "active") {
    const status = requireBoard(boardId).statuses.find((item) => item.id === id);
    const matches = status && (state === "active" ? isActive(status) : state === "trashed" ? Boolean(status.trashedAt) : Boolean(status.archivedAt) && !status.trashedAt);
    if (!status || !matches) throw new Error("La columna ya no está disponible para esta acción. Actualiza el tablero.");
    return status;
  }

  function changeMenu(boardId: string, id: string, open: boolean) {
    return enqueue(() => {
      if (open) { requireStatus(boardId, id); setMenuId(id); setPaletteId(null); }
      else setMenuId((previous) => previous === id ? null : previous);
    });
  }

  function changePalette(boardId: string, id: string, open: boolean) {
    return enqueue(() => {
      if (open) requireStatus(boardId, id);
      setPaletteId((previous) => open ? id : previous === id ? null : previous);
    });
  }

  function openPanel(next: KanbanPanel) {
    const boardId = board?.id;
    return enqueue(() => {
      if (next !== "notifications") requireBoard(boardId);
      setMenuId(null);
      setPanel((previous) => previous === next ? null : next);
    });
  }

  function columnIntent(boardId: string, id: string, intent: ColumnIntent) {
    return enqueue(async () => {
      const status = requireStatus(boardId, id);
      setMenuId(null);
      switch (intent) {
        case "watch": return persist(() => setStatusWatchingAction({ boardId, id, watching: !status.watching }));
        case "hold": return persist(() => setStatusHoldEnabledAction({ boardId, id, enabled: !status.holdEnabled }));
        case "archive": return persist(() => setStatusLifecycleAction({ boardId, id, state: "archived" }));
        case "add": return changeEditor({ kind: "card", statusId: id });
        case "rename": return changeEditor({ kind: "status", status });
        case "trash": return changeEditor({ kind: "trashStatus", status });
      }
    });
  }

  function colorStatus(boardId: string, id: string, color: string) {
    return enqueue(() => {
      const status = requireStatus(boardId, id);
      setMenuId(null);
      return persist(() => updateStatusAction({ boardId, id, name: status.name, color }));
    });
  }

  function restoreStatus(boardId: string, id: string, state: "archived" | "trashed") {
    return enqueue(async () => {
      requireStatus(boardId, id, state);
      await persist(() => setStatusLifecycleAction({ boardId, id, state: "active" }));
      if (mounted.current) setPanel(null);
    });
  }

  function toggleCardHold(boardId: string, id: string) {
    return enqueue(() => {
      const latest = requireBoard(boardId);
      const source = latest.statuses.find((status) => status.cards.some((card) => card.id === id));
      const card = source?.cards.find((card) => card.id === id);
      if (!source || !isActive(source) || !card) throw new Error("La tarjeta ya no está disponible. Actualiza el tablero.");
      if (!source.holdEnabled && !card.onHold) throw new Error("Habilita las tareas en espera en esta columna antes de marcar una tarjeta.");
      return persist(() => setCardOnHoldAction({ boardId, id, onHold: !card.onHold }));
    });
  }

  function markRead(id: string) {
    return enqueue(() => {
      const notice = currentData.current.notifications.find((notice) => notice.id === id);
      if (!notice) throw new Error("El aviso ya no está disponible. Actualiza la lista.");
      if (!notice.readAt) return persist(() => markKanbanNotificationReadAction({ id }));
    });
  }

  function resolveEditor(next: KanbanEditorState, boardId?: string): KanbanEditorState {
    if (next.kind === "board" && !next.board) return next;
    const latest = requireBoard(boardId);
    if (next.kind === "board" || next.kind === "deleteBoard") return { ...next, board: latest };
    if (next.kind === "status" && !next.status) return next;
    if (next.kind === "status" || next.kind === "trashStatus" || next.kind === "permanentDeleteStatus") {
      const status = requireStatus(latest.id, next.status!.id, next.kind === "permanentDeleteStatus" ? "trashed" : "active");
      return { ...next, status };
    }
    if (next.kind === "card" && !next.card) {
      requireStatus(latest.id, next.statusId);
      return next;
    }
    const source = latest.statuses.find((item) => item.cards.some((card) => card.id === next.card!.id));
    const card = source?.cards.find((item) => item.id === next.card!.id);
    if (!source || !isActive(source) || !card) throw new Error("La tarjeta ya no está disponible. Actualiza el tablero.");
    return next.kind === "card" ? { ...next, card, statusId: source.id } : { ...next, card };
  }

  function reload(preferredId?: string) {
    return enqueue(async () => {
      publish(await loadWorkspace(preferredId ?? currentData.current.board?.id, preferredId !== undefined));
      changeEditor(null);
      setMenuId(null);
      setPanel(null);
    });
  }

  async function persist(action: () => Promise<void | { id: string }>, closeEditor = false, removeBoard = false, submittedVersion = version.current) {
    let persisted = false;
    toast("Guardando…", "info");
    try {
      const result = await action();
      persisted = true;
      if (closeEditor && version.current === submittedVersion) changeEditor(null);
      const preferredId = result ? result.id : removeBoard ? undefined : currentData.current.board?.id;
      publish(await loadWorkspace(preferredId));
      if (mounted.current) toast("Cambios guardados.", "success");
    } catch (cause) {
      throw persisted
        ? new Error(`Los cambios se guardaron, pero no pudimos actualizar la vista. Usa Reintentar. ${errorMessage(cause)}`)
        : cause;
    }
  }

  function openEditor(next: KanbanEditorState) {
    const boardId = board?.id;
    return enqueue(() => { changeEditor(resolveEditor(next, boardId)); });
  }

  function cancelEditor() {
    const requestedVersion = editorVersion;
    return enqueue(() => { if (version.current === requestedVersion) changeEditor(null); });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || version.current !== editorVersion || submissions.current.has(editorVersion)) return;
    // Snapshot form values before the queued event's DOM can disappear.
    const form = new FormData(event.currentTarget);
    const requestedEditor = editor;
    const submittedVersion = editorVersion;
    const originId = board?.id;
    submissions.current.add(submittedVersion);
    return enqueue(async () => {
      if (version.current !== submittedVersion) throw new Error("El formulario cambió. Vuelve a abrirlo para continuar.");
      const editor = resolveEditor(requestedEditor, originId);
      const save = (action: () => Promise<void | { id: string }>, removeBoard = false) => persist(action, true, removeBoard, submittedVersion);
      const value = (name: string) => String(form.get(name) ?? "").trim();
      const description = value("description");
      if ((editor.kind === "board" || editor.kind === "status") && !value("name")) {
        throw new Error("Ingresa un nombre.");
      }
      if (editor.kind === "card" && !value("title")) {
        throw new Error("Ingresa un título.");
      }
      if (editor.kind === "board") {
        const input = { name: value("name"), description };
        return save(() => editor.board ? updateBoardAction({ id: editor.board.id, ...input }) : createBoardAction(input));
      }
      if (editor.kind === "deleteBoard") return save(() => deleteBoardAction({ id: editor.board.id }), true);
      const boardId = requireBoard(originId).id;
      switch (editor.kind) {
        case "status": {
          const input = { boardId, name: value("name"), color: editor.status ? editor.status.color : value("color") };
          return save(() => editor.status ? updateStatusAction({ id: editor.status.id, ...input }) : createStatusAction(input));
        }
        case "trashStatus": return save(() => setStatusLifecycleAction({ boardId, id: editor.status.id, state: "trashed" }));
        case "permanentDeleteStatus": return save(() => permanentlyDeleteStatusAction({ boardId, id: editor.status.id }));
        case "card": {
          const input = { boardId, title: value("title"), description,
            assigneeId: value("assigneeId") || null, dueDate: value("dueDate") || null,
          };
          return save(() => editor.card ? updateCardAction({ id: editor.card.id, ...input }) : createCardAction({ statusId: editor.statusId, ...input }));
        }
        case "deleteCard": return save(() => deleteCardAction({ boardId, id: editor.card.id }));
      }
    }).finally(() => { submissions.current.delete(submittedVersion); });
  }

  function moveCard(card: KanbanCard, targetId: string, originId = data.board?.id) {
    const visible = moves.current.reduce(applyMove, currentData.current);
    const board = visible.board;
    const source = board?.statuses.find((status) => status.cards.some((item) => item.id === card.id));
    if (!board || board.id !== originId || !source || !isActive(source) || source.id === targetId || !board.statuses.some((status) => status.id === targetId && isActive(status))) return Promise.resolve();
    const move = { boardId: board.id, cardId: card.id, targetId };
    moves.current.push(move);
    publish();
    return enqueue(async () => {
      let persisted = false;
      try {
        const latest = requireBoard(move.boardId);
        const target = latest.statuses.find((status) => status.id === targetId);
        const source = latest.statuses.find((status) => status.cards.some((item) => item.id === card.id));
        if (!target || !source || !isActive(target) || !isActive(source)) throw new Error("La tarjeta o la columna ya no están disponibles. Actualiza el tablero.");
        if (source.id !== target.id) {
          toast("Guardando…", "info");
          await moveCardAction({ boardId: latest.id, id: card.id, statusId: target.id, position: target.cards.length });
        }
        persisted = true;
        // Confirm only this move, then replay later drops over the fresh snapshot.
        const confirmed = applyMove(currentData.current, move);
        moves.current = moves.current.filter((item) => item !== move);
        publish(confirmed);
        publish(await loadWorkspace(latest.id));
        if (mounted.current) toast("Cambios guardados.", "success");
      } catch (cause) {
        moves.current = moves.current.filter((item) => item !== move);
        publish();
        throw persisted
          ? new Error(`Los cambios se guardaron, pero no pudimos actualizar la vista. Usa Reintentar. ${errorMessage(cause)}`)
          : cause;
      }
    });
  }

  function startColumnDrag(id: string) {
    if (!board || pending) return;
    clearDrag();
    setColumnDrag({ boardId: board.id, id, ids: statuses.map((status) => status.id), phase: "dragging" });
  }

  function cancelColumnDrag() {
    setColumnDrag((previous) => previous?.phase === "dragging" ? null : previous);
  }

  function previewColumnPosition(targetId: string) {
    setColumnDrag((previous) => {
      if (!previous || previous.phase !== "dragging" || previous.boardId !== board?.id) return previous;
      const source = previous.ids.indexOf(previous.id);
      const target = previous.ids.indexOf(targetId);
      if (source < 0 || target < 0 || source === target) return previous;
      const ids = [...previous.ids];
      ids.splice(source, 1);
      ids.splice(target, 0, previous.id);
      return { ...previous, ids };
    });
  }

  function confirmColumnOrder() {
    if (!validColumnDrag || validColumnDrag.phase !== "dragging") return;
    const commit: ColumnDrag = { ...validColumnDrag, phase: "saving" };
    if (commit.ids.every((id, index) => id === activeStatuses[index]?.id)) {
      setColumnDrag(null);
      return;
    }
    setColumnDrag(commit);
    return enqueue(async () => {
      try {
        const latest = requireBoard(commit.boardId);
        const active = latest.statuses.filter(isActive);
        if (active.length !== commit.ids.length || active.some((status) => !commit.ids.includes(status.id))) {
          throw new Error("Las columnas cambiaron. Actualiza el tablero antes de reordenar.");
        }
        await persist(() => reorderStatusesAction({ boardId: latest.id, statusIds: commit.ids }));
      } finally {
        setColumnDrag((previous) => previous === commit ? null : previous);
      }
    });
  }

  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]" aria-busy={loading || saving}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Kanban</h1>
          <p className="mt-1 text-sm text-slate-600">Tableros compartidos entre todos los usuarios internos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending} onClick={() => openPanel("notifications")} aria-label={`Mis avisos (${notifications.filter((notice) => !notice.readAt).length} sin leer)`}>Mis avisos ({notifications.filter((notice) => !notice.readAt).length})</Button>
          <Button variant="outline" disabled={pending} onClick={() => reload()}>Actualizar</Button>
          <Button disabled={pending} onClick={() => openEditor({ kind: "board" })}>Nuevo tablero</Button>
        </div>
      </header>
      {loading ? <p role="status" aria-live="polite" className="text-sm text-slate-600">Cargando tableros…</p> : null}
      {error ? <div className="space-y-2"><p role="alert" className="text-sm text-red-700">{error}</p><Button variant="outline" disabled={pending} onClick={() => reload()}>Reintentar</Button></div> : null}
      <nav aria-label="Tableros" className="flex flex-wrap gap-2">
        {boards.map((item) => (
          <Button key={item.id} variant={board?.id === item.id ? "default" : "outline"} disabled={pending}
            aria-label={`Abrir ${item.name}`} aria-pressed={board?.id === item.id} onClick={() => reload(item.id)}>
            {item.name} <span className="text-xs">({item.cardCount})</span>
          </Button>
        ))}
      </nav>
      {panel === "notifications" ? <KanbanNotificationsPanel notifications={notifications} onRead={markRead} /> : null}
      {editor ? <KanbanEditor key={editorVersion} editor={editor} assignees={assignees} pending={pending} error={error} onSubmit={submit} onCancel={cancelEditor} /> : null}
      {!loading && !error && boards.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Todavía no hay tableros. Crea el primero para organizar el trabajo del equipo.</p> : null}
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
              <Button variant="outline" disabled={pending} onClick={() => openPanel("archived")}>Archivados</Button>
              <Button variant="outline" disabled={pending} onClick={() => openPanel("trashed")}>Papelera</Button>
              <Button disabled={pending} onClick={() => openEditor({ kind: "status" })}>Nueva columna</Button>
            </div>
          </div>
          {panel === "archived" || panel === "trashed" ? <KanbanRecoveryPanel state={panel} statuses={board.statuses}
            onRestore={(status) => restoreStatus(board.id, status.id, panel)}
            onDelete={(status) => openEditor({ kind: "permanentDeleteStatus", status })} /> : null}
          <p className="text-sm text-slate-500">Arrastra las tarjetas a otra columna o abre «⋯» en la tarjeta para usar «Mover».</p>
          {statuses.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Este tablero no tiene columnas. Agrega una para empezar a crear tarjetas.</p> : null}
          <p id="kanban-column-drag-help" className="sr-only">Arrastra el encabezado para reordenar las columnas. Con teclado, usa Espacio para tomar la columna, las flechas para moverla, Enter para confirmar o Escape para cancelar.</p>
          <div className="flex items-start gap-2 overflow-x-auto pb-4">
            {statuses.map((status) => (
              <section key={status.id} aria-label={`Columna ${status.name}`}
                className={`w-80 max-w-[85vw] shrink-0 space-y-1.5 rounded border-t-4 border-slate-200 bg-slate-50 p-2${validColumnDrag?.phase === "dragging" && validColumnDrag.id === status.id ? " outline-2 outline-dashed -outline-offset-2 outline-slate-400 opacity-60" : ""}`}
                style={{ borderTopColor: status.color || undefined, backgroundColor: status.color ? `color-mix(in srgb, ${status.color} 8%, white)` : undefined }}
                onDragOver={(event) => {
                  if (pending) return;
                  if (validColumnDrag?.phase === "dragging") {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    const source = statuses.findIndex((item) => item.id === validColumnDrag.id);
                    const target = statuses.findIndex((item) => item.id === status.id);
                    const rect = event.currentTarget.getBoundingClientRect();
                    const midpoint = rect.left + rect.width / 2;
                    if ((source < target && event.clientX >= midpoint) || (source > target && event.clientX <= midpoint)) {
                      previewColumnPosition(status.id);
                    }
                    return;
                  }
                  if (!draggedCard) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragTargetId(dragSource?.id === status.id ? null : status.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setDragTargetId((previous) => previous === status.id ? null : previous);
                  }
                }}
                onDrop={async (event) => {
                  event.preventDefault();
                  if (validColumnDrag?.phase === "dragging") {
                    if (event.dataTransfer.getData(columnDragFormat) === validColumnDrag.id && !pending) {
                      await confirmColumnOrder();
                    } else cancelColumnDrag();
                    return;
                  }
                  clearDrag();
                  if (pending) return;
                  const cardId = event.dataTransfer.getData(dragFormat);
                  const source = statuses.find((item) => item.cards.some((card) => card.id === cardId));
                  const card = source?.cards.find((item) => item.id === cardId);
                  if (source && card) await moveCard(card, status.id);
                }}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-800">
                    <button type="button" draggable={!pending} disabled={pending} aria-label={`Arrastrar columna ${status.name}`}
                      aria-describedby="kanban-column-drag-help"
                      className="w-full cursor-grab rounded text-left active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-slate-500"
                      onDragStart={(event) => {
                        event.dataTransfer.setData(columnDragFormat, status.id);
                        event.dataTransfer.effectAllowed = "move";
                        startColumnDrag(status.id);
                      }}
                      onDragEnd={cancelColumnDrag}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") { event.preventDefault(); cancelColumnDrag(); }
                        else if (event.key === " " || event.key === "Enter") {
                          event.preventDefault();
                          if (validColumnDrag?.phase === "dragging" && validColumnDrag.id === status.id) void confirmColumnOrder();
                          else startColumnDrag(status.id);
                        } else if (validColumnDrag?.phase === "dragging" && validColumnDrag.id === status.id && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
                          event.preventDefault();
                          const index = statuses.findIndex((item) => item.id === status.id);
                          const target = statuses[index + (event.key === "ArrowLeft" ? -1 : 1)];
                          if (target) previewColumnPosition(target.id);
                        }
                      }}>
                      {status.name} <span className="text-sm font-normal">({status.cards.length})</span>
                    </button>
                  </h3>
                  <div className="flex gap-1">
                    <KanbanColumnMenu status={status} open={menuId === status.id} paletteOpen={paletteId === status.id}
                      onOpenChange={(open) => changeMenu(board.id, status.id, open)}
                      onPaletteChange={(open) => changePalette(board.id, status.id, open)}
                      onIntent={(intent) => columnIntent(board.id, status.id, intent)}
                      onColor={(color) => colorStatus(board.id, status.id, color)} />
                  </div>
                </div>
                <p className="text-xs text-slate-500">Seguidores: {(status.watchers ?? []).map((user) => user.name).join(", ") || "Nadie todavía"}</p>
                {status.holdEnabled ? <p className="text-xs text-slate-500">Puedes marcar tarjetas individuales en espera.</p> : null}
                {[...status.cards].sort((a, b) => a.position - b.position).map((card) => (
                  <article key={card.id} draggable={!pending}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(dragFormat, card.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDragging({ boardId: board.id, cardId: card.id });
                      setDragTargetId(null);
                    }}
                    onDragEnd={clearDrag}
                    className={`relative rounded bg-white p-2${draggedCard?.id === card.id ? " opacity-40" : ""}`}>
                    <h4 className="break-words pr-7 text-sm font-medium leading-5 text-slate-900">{card.title}</h4>
                    {card.onHold ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">En espera</span> : null}
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs leading-4 text-slate-500">
                      <span><span className="sr-only">Responsable: </span> {assignees.find((user) => user.id === card.assigneeId)?.name ?? (card.assigneeId ? "No disponible" : "Sin responsable")}</span>
                      {card.dueDate ? <span>Vence: <time dateTime={card.dueDate.slice(0, 10)}>{card.dueDate.slice(0, 10).split("-").reverse().join("/")}</time></span> : null}
                    </div>
                    <details aria-label={`Opciones de ${card.title}`}>
                      <summary aria-label={`Opciones de ${card.title}`} className="absolute right-1 top-1 flex size-7 cursor-pointer list-none items-center justify-center rounded text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-500 [&::-webkit-details-marker]:hidden">⋯</summary>
                      <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                        {card.description ? <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{card.description}</p> : null}
                        <select aria-label={`Mover ${card.title}`} className={selectClass} value={status.id} disabled={pending}
                          onChange={(event) => moveCard(card, event.target.value)}>
                          {statuses.map((target) => <option key={target.id} value={target.id}>{target.id === status.id ? `Mover: ${target.name}` : target.name}</option>)}
                        </select>
                        <div className="flex flex-wrap gap-2">
                          {status.holdEnabled || card.onHold ? <Button size="sm" variant="outline" aria-label={card.onHold ? `Quitar espera de ${card.title}` : `Poner en espera ${card.title}`} onClick={() => toggleCardHold(board.id, card.id)}>{card.onHold ? "Quitar espera" : "Poner en espera"}</Button> : null}
                          <Button size="sm" variant="outline" disabled={pending} aria-label={`Editar tarjeta ${card.title}`} onClick={() => openEditor({ kind: "card", statusId: status.id, card })}>Editar</Button>
                          <Button size="sm" variant="outline" disabled={pending} aria-label={`Eliminar tarjeta ${card.title}`} onClick={() => openEditor({ kind: "deleteCard", card })}>Eliminar</Button>
                        </div>
                      </div>
                    </details>
                  </article>
                ))}
                {draggedCard && dragTargetId === status.id ? (
                  <div data-kanban-drop-preview aria-hidden={true} className="pointer-events-none rounded border border-dashed border-slate-300 bg-white/30 p-1">
                    <div className="translate-x-1 -translate-y-1 rotate-1 rounded bg-white p-2 opacity-90 shadow-lg ring-1 ring-black/5 motion-safe:transition-transform">
                      <p className="break-words text-sm font-medium leading-5 text-slate-900">{draggedCard.title}</p>
                      {draggedCard.onHold ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">En espera</span> : null}
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs leading-4 text-slate-500">
                        <span>{assignees.find((user) => user.id === draggedCard.assigneeId)?.name ?? (draggedCard.assigneeId ? "No disponible" : "Sin responsable")}</span>
                        {draggedCard.dueDate ? <span>Vence: {draggedCard.dueDate.slice(0, 10).split("-").reverse().join("/")}</span> : null}
                      </div>
                    </div>
                  </div>
                ) : status.cards.length === 0 ? (
                  <p className="relative rounded p-2">
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded border border-dashed border-slate-300/70" />
                    <span aria-hidden="true" className="block h-5" />
                    <span aria-hidden="true" className="mt-0.5 block h-4" />
                    <span className="sr-only">Sin tarjetas.</span>
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
