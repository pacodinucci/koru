import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { legacyRolePermissions } from "@/modules/auth/permissions/permission-catalog";
import { identifierSchema } from "@/modules/kanban/domain/kanban-validation";

export function identifier(value: unknown): string {
  const parsed = identifierSchema.safeParse(value);
  if (!parsed.success) throw new Error("Identificador inválido.");
  return parsed.data;
}

/** Every existing-board mutation takes this same database lock before any reads.
 * ReadCommitted gives waiters a fresh snapshot after the preceding writer commits.
 * A JS mutex would not protect other server instances.
 */
export async function withBoard<T>(boardId: string, operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  const id = identifier(boardId);
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "KanbanBoard" WHERE "id" = ${id} FOR UPDATE`;
    if (!rows.length) throw new Error("El tablero no existe.");
    return operation(tx);
  }, { isolationLevel: "ReadCommitted", maxWait: 5000, timeout: 15000 });
}

export const isActiveStatus = (status: { archivedAt: Date | null; trashedAt: Date | null }) => !status.archivedAt && !status.trashedAt;

export async function requireStatus(tx: Prisma.TransactionClient, boardId: string, id: string, active = true) {
  const status = await tx.kanbanStatus.findFirst({ where: { id: identifier(id), boardId } });
  if (!status) throw new Error("El estado no pertenece a este tablero.");
  if (active && !isActiveStatus(status)) throw new Error("La columna está archivada o en la papelera.");
  return status;
}

export async function requireCard(tx: Prisma.TransactionClient, boardId: string, id: string) {
  const card = await tx.kanbanCard.findFirst({ where: { id: identifier(id), boardId } });
  if (!card) throw new Error("La tarjeta no pertenece a este tablero.");
  await requireStatus(tx, boardId, card.statusId);
  return card;
}

const assigneeSelect = {
  id: true, name: true, role: true, accessRoleId: true,
  accessRole: { select: { isActive: true, permissions: { select: { permission: { select: { key: true } } } } } },
} as const;
type AssigneeRecord = Prisma.UserGetPayload<{ select: typeof assigneeSelect }>;
function hasDashboardAccess(user: AssigneeRecord) {
  if (user.role === "PSYCHOPEDAGOGY_TEACHER") return false;
  // Mirror the Kanban guard: assigned inactive roles do NOT fall back to legacy roles.
  return user.accessRole?.isActive
    ? user.accessRole.permissions.some(({ permission }) => permission.key === "dashboard.access")
    : !user.accessRoleId && legacyRolePermissions[user.role].includes("dashboard.access");
}

export async function listInternalAssignees() {
  const users = await prisma.user.findMany({ select: assigneeSelect, orderBy: [{ name: "asc" }, { id: "asc" }] });
  return users.filter(hasDashboardAccess).map(({ id, name }) => ({ id, name }));
}

export async function requireAssignee(tx: Prisma.TransactionClient, id: string | null) {
  if (id === null) return;
  const user = await tx.user.findUnique({ where: { id }, select: assigneeSelect });
  if (!user || !hasDashboardAccess(user)) throw new Error("La persona responsable debe tener acceso al dashboard.");
}

export const positionOrder = [{ position: "asc" }, { id: "asc" }] satisfies Prisma.KanbanCardOrderByWithRelationInput[];

export async function normalizeCards(tx: Prisma.TransactionClient, boardId: string, statusId: string) {
  const cards = await tx.kanbanCard.findMany({ where: { boardId, statusId }, orderBy: positionOrder });
  for (const [position, card] of cards.entries()) {
    if (card.position !== position) await tx.kanbanCard.update({ where: { id: card.id }, data: { position } });
  }
}
