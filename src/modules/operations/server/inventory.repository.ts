import "server-only";

import { prisma } from "@/lib/prisma";

export async function listInventoryProductsWithStock() {
  const products = await prisma.inventoryProduct.findMany({ orderBy: { name: "asc" }, include: { movements: { select: { quantity: true } } } });
  return products.map((product) => ({ ...product, stock: product.movements.reduce((total, movement) => total + Number(movement.quantity), 0) }));
}

export async function listInventoryRequestsForReview() {
  return prisma.inventoryRequest.findMany({ where: { status: "PENDING" }, orderBy: { submittedAt: "asc" }, include: { teacher: true, lines: { include: { product: true } } } });
}

export async function listInventoryProductsBelowMinimum() {
  const products = await listInventoryProductsWithStock();
  return products.filter((product) => product.stock <= Number(product.minimumStock));
}

export async function listTeacherInventoryRequests(teacherId: string) {
  return prisma.inventoryRequest.findMany({ where: { teacherId }, orderBy: { submittedAt: "desc" }, include: { lines: { include: { product: true } } } });
}

export async function listInventoryMovementsForAdmin(limit = 100) {
  const movements = await prisma.inventoryMovement.findMany({ take: limit, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], include: { product: true, requestLine: { include: { request: { include: { teacher: true } } } } } });
  const reversedIds = movements.length ? await prisma.inventoryMovement.findMany({ where: { reversesId: { in: movements.map((movement) => movement.id) } }, select: { reversesId: true } }) : [];
  const reversed = new Set(reversedIds.flatMap((movement) => movement.reversesId ? [movement.reversesId] : []));
  return movements.map((movement) => ({ ...movement, isReversed: reversed.has(movement.id) }));
}
