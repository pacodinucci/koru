import "server-only";

import type { Prisma } from "@prisma/client";

type Column = { id: string; boardId: string; name: string };
type Card = { id: string; title: string };

/** Always called inside the card mutation's board-locked transaction, never fire-and-forget. */
export async function notifyColumn(tx: Prisma.TransactionClient, column: Column, card: Card, message: string) {
  const watches = await tx.kanbanStatusWatch.findMany({ where: { boardId: column.boardId, statusId: column.id } });
  for (const { userId } of watches) {
    await tx.kanbanNotification.create({ data: { boardId: column.boardId, statusId: column.id, cardId: card.id, userId, message } });
  }
}

export async function notifyCardMove(tx: Prisma.TransactionClient, source: Column, target: Column, card: Card) {
  if (source.id === target.id) {
    await notifyColumn(tx, source, card, `Se cambió de lugar la tarjeta "${card.title}" en "${source.name}".`);
  } else {
    await notifyColumn(tx, source, card, `La tarjeta "${card.title}" salió de "${source.name}" hacia "${target.name}".`);
    await notifyColumn(tx, target, card, `La tarjeta "${card.title}" llegó a "${target.name}" desde "${source.name}".`);
  }
}
