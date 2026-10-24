"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDashboardUser as requireDashboardAccess } from "@/modules/auth/server/auth-guards";
import { boardSchema, cardSchema, parseDueDate, statusSchema } from "@/modules/kanban/domain/kanban-validation";
import { identifier, isActiveStatus, listInternalAssignees, normalizeCards, positionOrder, requireAssignee, requireCard, requireStatus, withBoard } from "@/modules/kanban/server/kanban.repository";
import { notifyCardMove, notifyColumn } from "@/modules/kanban/server/kanban-notifications";
import type { KanbanAssignee, KanbanBoard, KanbanBoardSummary, KanbanNotification } from "@/modules/kanban/types";

// Keep every action behind the Kanban-specific scope, including notifications.
const requireDashboardUser = () => requireDashboardAccess(undefined, "kanban");
const refresh = () => revalidatePath("/dashboard/kanban");
const defaultStatuses = [
  { name: "Pendiente", color: "#64748b", position: 0 },
  { name: "En curso", color: "#3b82f6", position: 1 },
  { name: "Hecho", color: "#22c55e", position: 2 },
];
type BoardInput = { name: string; description?: string };
type StatusInput = { boardId: string; name: string; color: string };
type CardInput = { boardId: string; title: string; description?: string; assigneeId?: string | null; dueDate?: string | null };

export async function listBoardsAction(): Promise<KanbanBoardSummary[]> {
  await requireDashboardUser();
  const boards = await prisma.kanbanBoard.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }], include: { _count: { select: { cards: true } } } });
  return boards.map(({ id, name, description, _count }) => ({ id, name, description, cardCount: _count.cards }));
}

export async function getBoardAction(boardId: string): Promise<KanbanBoard | null> {
  const actor = await requireDashboardUser();
  const board = await prisma.kanbanBoard.findUnique({
    where: { id: identifier(boardId) },
    include: {
      statuses: {
        orderBy: positionOrder,
        include: {
          cards: { orderBy: positionOrder },
          watches: { include: { user: { select: { id: true, name: true } } }, orderBy: { userId: "asc" } },
        },
      },
    },
  });
  if (!board) return null;
  return {
    id: board.id, name: board.name, description: board.description,
    statuses: board.statuses.map((status) => ({
      id: status.id, name: status.name, color: status.color, position: status.position,
      archivedAt: status.archivedAt?.toISOString() ?? null, trashedAt: status.trashedAt?.toISOString() ?? null,
      holdEnabled: status.holdEnabled, watching: status.watches.some(({ userId }) => userId === actor.id),
      watchers: status.watches.map(({ user }) => ({ id: user.id, name: user.name })),
      cards: status.cards.map(({ id, title, description, assigneeId, dueDate, position, onHold }) => ({ id, title, description, assigneeId, dueDate: dueDate?.toISOString() ?? null, position, onHold })),
    })),
  };
}

export async function listAssigneesAction(): Promise<KanbanAssignee[]> {
  await requireDashboardUser();
  return listInternalAssignees();
}

export async function createBoardAction(input: BoardInput): Promise<{ id: string }> {
  await requireDashboardUser();
  const parsed = boardSchema.safeParse(input);
  if (!parsed.success) throw new Error("Revisá el nombre y la descripción del tablero.");
  const board = await prisma.$transaction(async (tx) => {
    const board = await tx.kanbanBoard.create({ data: parsed.data });
    for (const status of defaultStatuses) await tx.kanbanStatus.create({ data: { ...status, boardId: board.id } });
    return board;
  }, { isolationLevel: "ReadCommitted" });
  refresh();
  return { id: board.id };
}

export async function updateBoardAction(input: BoardInput & { id: string }): Promise<void> {
  await requireDashboardUser();
  const parsed = boardSchema.safeParse(input);
  if (!parsed.success) throw new Error("Revisá el nombre y la descripción del tablero.");
  await withBoard(input.id, (tx) => tx.kanbanBoard.update({ where: { id: identifier(input.id) }, data: parsed.data }));
  refresh();
}

/** Explicit destructive action; the caller must ask for confirmation before invoking it. */
export async function deleteBoardAction(input: { id: string }): Promise<void> {
  await requireDashboardUser();
  await withBoard(input?.id, async (tx) => {
    // Explicit cleanup also makes the recipient/history lifetime clear; FKs cascade as a backstop.
    await tx.kanbanNotification.deleteMany({ where: { boardId: input.id } });
    await tx.kanbanStatusWatch.deleteMany({ where: { boardId: input.id } });
    // Cards first: status composite FK intentionally restricts accidental card loss.
    await tx.kanbanCard.deleteMany({ where: { boardId: input.id } });
    await tx.kanbanStatus.deleteMany({ where: { boardId: input.id } });
    await tx.kanbanBoard.delete({ where: { id: input.id } });
  });
  refresh();
}

export async function createStatusAction(input: StatusInput): Promise<void> {
  await requireDashboardUser();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) throw new Error("Revisá el nombre y el color del estado.");
  await withBoard(input.boardId, async (tx) => {
    const position = await tx.kanbanStatus.count({ where: { boardId: input.boardId } });
    await tx.kanbanStatus.create({ data: { ...parsed.data, boardId: input.boardId, position } });
  });
  refresh();
}

export async function updateStatusAction(input: StatusInput & { id: string }): Promise<void> {
  await requireDashboardUser();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) throw new Error("Revisá el nombre y el color del estado.");
  await withBoard(input.boardId, async (tx) => {
    const status = await requireStatus(tx, input.boardId, input.id);
    await tx.kanbanStatus.update({ where: { id: status.id }, data: parsed.data });
  });
  refresh();
}

export async function reorderStatusesAction(input: { boardId: string; statusIds: string[] }): Promise<void> {
  await requireDashboardUser();
  const ids = input?.statusIds;
  const invalid = () => { throw new Error("Incluí todos los estados del tablero una sola vez."); };
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) invalid();
  await withBoard(input.boardId, async (tx) => {
    const statuses = (await tx.kanbanStatus.findMany({ where: { boardId: input.boardId }, orderBy: positionOrder })).filter(isActiveStatus);
    if (ids.length !== statuses.length || statuses.some((status) => !ids.includes(status.id))) invalid();
    // Keep inactive positions untouched; the active permutation uses only active slots.
    for (const [index, id] of ids.entries()) await tx.kanbanStatus.update({ where: { id }, data: { position: statuses[index].position } });
  });
  refresh();
}

export async function deleteStatusAction(input: { boardId: string; id: string; destinationStatusId?: string }): Promise<void> {
  await requireDashboardUser();
  await withBoard(input?.boardId, async (tx) => {
    const source = await requireStatus(tx, input.boardId, input.id);
    const statuses = await tx.kanbanStatus.findMany({ where: { boardId: input.boardId }, orderBy: positionOrder });
    if (statuses.filter(isActiveStatus).length <= 1) throw new Error("El tablero debe conservar al menos un estado.");
    const cards = await tx.kanbanCard.findMany({ where: { boardId: input.boardId, statusId: source.id }, orderBy: positionOrder });
    if (cards.length && !input.destinationStatusId) throw new Error("Elegí un estado de destino para las tarjetas.");
    if (input.destinationStatusId !== undefined) {
      const destination = statuses.find((status) => status.id === input.destinationStatusId && status.id !== source.id && isActiveStatus(status));
      if (!destination) throw new Error("Elegí otro estado del mismo tablero como destino.");
      const offset = await tx.kanbanCard.count({ where: { boardId: input.boardId, statusId: destination.id } });
      for (const [index, card] of cards.entries()) {
        await tx.kanbanCard.update({ where: { id: card.id }, data: { statusId: destination.id, position: offset + index } });
        await notifyCardMove(tx, source, destination, card);
      }
    }
    await tx.kanbanStatusWatch.deleteMany({ where: { boardId: input.boardId, statusId: source.id } });
    await tx.kanbanStatus.delete({ where: { id: source.id } });
    for (const [position, status] of statuses.filter((status) => status.id !== source.id).entries()) {
      if (status.position !== position) await tx.kanbanStatus.update({ where: { id: status.id }, data: { position } });
    }
  });
  refresh();
}

export async function setStatusWatchingAction(input: { boardId: string; id: string; watching: boolean }): Promise<void> {
  const actor = await requireDashboardUser();
  if (typeof input?.watching !== "boolean") throw new Error("Indica si quieres seguir la columna.");
  await withBoard(input.boardId, async (tx) => {
    const status = await requireStatus(tx, input.boardId, input.id);
    const where = { boardId: input.boardId, statusId: status.id, userId: actor.id };
    if (!input.watching) await tx.kanbanStatusWatch.deleteMany({ where });
    else if (!await tx.kanbanStatusWatch.findFirst({ where })) await tx.kanbanStatusWatch.create({ data: where });
  });
  refresh();
}

export async function setStatusHoldEnabledAction(input: { boardId: string; id: string; enabled: boolean }): Promise<void> {
  await requireDashboardUser();
  if (typeof input?.enabled !== "boolean") throw new Error("Indica si quieres habilitar las tareas en espera.");
  await withBoard(input.boardId, async (tx) => {
    const status = await requireStatus(tx, input.boardId, input.id);
    // Disabling the option must not silently rewrite existing per-card metadata.
    await tx.kanbanStatus.update({ where: { id: status.id }, data: { holdEnabled: input.enabled } });
  });
  refresh();
}

export async function setCardOnHoldAction(input: { boardId: string; id: string; onHold: boolean }): Promise<void> {
  await requireDashboardUser();
  if (typeof input?.onHold !== "boolean") throw new Error("Indica si la tarjeta está en espera.");
  await withBoard(input.boardId, async (tx) => {
    const card = await requireCard(tx, input.boardId, input.id);
    const status = await requireStatus(tx, input.boardId, card.statusId);
    if (input.onHold && !status.holdEnabled) throw new Error("Primero habilita las tareas en espera en esta columna.");
    if (card.onHold === input.onHold) return;
    await tx.kanbanCard.update({ where: { id: card.id }, data: { onHold: input.onHold } });
    await notifyColumn(tx, status, card, input.onHold
      ? `La tarjeta "${card.title}" quedó en espera en "${status.name}".`
      : `La tarjeta "${card.title}" dejó de estar en espera en "${status.name}".`);
  });
  refresh();
}

export async function setStatusLifecycleAction(input: { boardId: string; id: string; state: "active" | "archived" | "trashed" }): Promise<void> {
  await requireDashboardUser();
  if (!["active", "archived", "trashed"].includes(input?.state)) throw new Error("Elige un estado válido para la columna.");
  await withBoard(input.boardId, async (tx) => {
    const status = await requireStatus(tx, input.boardId, input.id, false);
    if (input.state !== "active" && isActiveStatus(status)) {
      const statuses = await tx.kanbanStatus.findMany({ where: { boardId: input.boardId } });
      if (statuses.filter(isActiveStatus).length <= 1) throw new Error("El tablero debe conservar al menos un estado.");
    }
    // Idempotent transitions preserve the original timestamp and never touch cards/settings.
    const archivedAt = input.state === "archived" ? status.archivedAt ?? new Date() : null;
    const trashedAt = input.state === "trashed" ? status.trashedAt ?? new Date() : null;
    await tx.kanbanStatus.update({ where: { id: status.id }, data: { archivedAt, trashedAt } });
  });
  refresh();
}

/** Irreversible: the UI must separately confirm; this is never a trash operation. */
export async function permanentlyDeleteStatusAction(input: { boardId: string; id: string }): Promise<void> {
  await requireDashboardUser();
  await withBoard(input?.boardId, async (tx) => {
    const status = await requireStatus(tx, input.boardId, input.id, false);
    if (!status.trashedAt) throw new Error("Primero mueve la columna a la papelera.");
    await tx.kanbanCard.deleteMany({ where: { boardId: input.boardId, statusId: status.id } });
    await tx.kanbanStatusWatch.deleteMany({ where: { boardId: input.boardId, statusId: status.id } });
    await tx.kanbanStatus.delete({ where: { id: status.id } });
    const statuses = await tx.kanbanStatus.findMany({ where: { boardId: input.boardId }, orderBy: positionOrder });
    for (const [position, item] of statuses.entries()) {
      if (item.position !== position) await tx.kanbanStatus.update({ where: { id: item.id }, data: { position } });
    }
  });
  refresh();
}

export async function listKanbanNotificationsAction(): Promise<KanbanNotification[]> {
  const actor = await requireDashboardUser();
  const notifications = await prisma.kanbanNotification.findMany({ where: { userId: actor.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
  return notifications.map(({ id, boardId, statusId, cardId, message, createdAt, readAt }) => ({
    id, boardId, statusId, cardId, message, createdAt: createdAt.toISOString(), readAt: readAt?.toISOString() ?? null,
  }));
}

export async function markKanbanNotificationReadAction(input: { id: string }): Promise<void> {
  const actor = await requireDashboardUser();
  const where = { id: identifier(input?.id), userId: actor.id };
  const notification = await prisma.kanbanNotification.findFirst({ where });
  if (!notification) throw new Error("El aviso no existe.");
  await withBoard(notification.boardId, async (tx) => {
    // Recheck under the same lock as board deletion; never mutate another recipient's row.
    const current = await tx.kanbanNotification.findFirst({ where });
    if (!current) throw new Error("El aviso no existe.");
    if (!current.readAt) await tx.kanbanNotification.update({ where: { id: current.id, userId: actor.id }, data: { readAt: new Date() } });
  });
  refresh();
}

function parseCard(input: CardInput) {
  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) throw new Error("Revisá el título y la descripción de la tarjeta.");
  return { ...parsed.data, dueDate: parseDueDate(input.dueDate) };
}

export async function createCardAction(input: CardInput & { statusId: string }): Promise<void> {
  await requireDashboardUser();
  const data = parseCard(input);
  await withBoard(input.boardId, async (tx) => {
    const status = await requireStatus(tx, input.boardId, input.statusId);
    await requireAssignee(tx, data.assigneeId);
    const position = await tx.kanbanCard.count({ where: { boardId: input.boardId, statusId: status.id } });
    const card = await tx.kanbanCard.create({ data: { ...data, boardId: input.boardId, statusId: status.id, position } });
    await notifyColumn(tx, status, card, `Se agregó la tarjeta "${card.title}" a "${status.name}".`);
  });
  refresh();
}

export async function updateCardAction(input: CardInput & { id: string }): Promise<void> {
  await requireDashboardUser();
  const data = parseCard(input);
  await withBoard(input.boardId, async (tx) => {
    const card = await requireCard(tx, input.boardId, input.id);
    await requireAssignee(tx, data.assigneeId);
    const updated = await tx.kanbanCard.update({ where: { id: card.id }, data });
    const status = await requireStatus(tx, input.boardId, card.statusId);
    await notifyColumn(tx, status, updated, `Se actualizó la tarjeta "${updated.title}" en "${status.name}".`);
  });
  refresh();
}

export async function deleteCardAction(input: { boardId: string; id: string }): Promise<void> {
  await requireDashboardUser();
  await withBoard(input?.boardId, async (tx) => {
    const card = await requireCard(tx, input.boardId, input.id);
    await tx.kanbanCard.delete({ where: { id: card.id } });
    await normalizeCards(tx, input.boardId, card.statusId);
  });
  refresh();
}

export async function moveCardAction(input: { boardId: string; id: string; statusId: string; position: number }): Promise<void> {
  await requireDashboardUser();
  if (!Number.isSafeInteger(input?.position) || input.position < 0) throw new Error("Indicá una posición válida para la tarjeta.");
  await withBoard(input.boardId, async (tx) => {
    const card = await requireCard(tx, input.boardId, input.id);
    const target = await requireStatus(tx, input.boardId, input.statusId);
    const cards = await tx.kanbanCard.findMany({ where: { boardId: input.boardId, statusId: target.id, id: { not: card.id } }, orderBy: positionOrder });
    if (input.position > cards.length) throw new Error("Indicá una posición válida para la tarjeta.");
    if (card.statusId === target.id && card.position === input.position) return;
    const source = await requireStatus(tx, input.boardId, card.statusId);
    // Position denotes the final index after removing the moved card from its old position.
    cards.splice(input.position, 0, { ...card, statusId: target.id });
    for (const [position, item] of cards.entries()) {
      if (item.id === card.id || item.position !== position) await tx.kanbanCard.update({ where: { id: item.id }, data: { statusId: target.id, position } });
    }
    if (card.statusId !== target.id) await normalizeCards(tx, input.boardId, card.statusId);
    await notifyCardMove(tx, source, target, card);
  });
  refresh();
}
