"use server";

import { InventoryMovementType, InventoryRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireOperationsOperator, requireOperationsSuperAdmin, requireOperationsTeacher } from "@/modules/operations/server/operations-access";
import { sendOperationDecisionEmail } from "@/modules/mailing/server/mailing.service";

const requestSchema = z.object({ productId: z.string().min(1), quantity: z.coerce.number().positive() });
const decisionSchema = z.object({ lineId: z.string().min(1), approvedQuantity: z.coerce.number().nonnegative(), reason: z.string().trim().max(500).optional() });
const value = (formData: FormData, name: string) => formData.get(name) ?? "";

export async function submitInventoryRequestAction(formData: FormData) {
  const { teacher } = await requireOperationsTeacher();
  const parsed = requestSchema.safeParse({ productId: value(formData, "productId"), quantity: value(formData, "quantity") });
  if (!parsed.success) return { ok: false, message: "Revisá el producto y la cantidad." };
  await prisma.inventoryRequest.create({ data: { teacherId: teacher.id, lines: { create: { productId: parsed.data.productId, requestedQuantity: parsed.data.quantity } } } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Solicitud enviada." };
}

export async function decideInventoryRequestLineAction(formData: FormData) {
  const operator = await requireOperationsOperator();
  const parsed = decisionSchema.safeParse({ lineId: value(formData, "lineId"), approvedQuantity: value(formData, "approvedQuantity"), reason: value(formData, "reason") || undefined });
  if (!parsed.success) return { ok: false, message: "Revisá la decisión." };
  await prisma.$transaction(async (tx) => {
    const line = await tx.inventoryRequestLine.findUnique({ where: { id: parsed.data.lineId }, include: { product: true, request: true } });
    if (!line || line.request.status !== InventoryRequestStatus.PENDING) throw new Error("La solicitud ya fue resuelta.");
    const stock = await tx.inventoryMovement.aggregate({ where: { productId: line.productId }, _sum: { quantity: true } });
    const available = Number(stock._sum.quantity?.toString() ?? 0);
    if (parsed.data.approvedQuantity > Number(line.requestedQuantity) || parsed.data.approvedQuantity > available) throw new Error("No hay stock suficiente.");
    if (parsed.data.approvedQuantity !== Number(line.requestedQuantity) && !parsed.data.reason) throw new Error("Indicá el motivo de la diferencia.");
    await tx.inventoryRequestLine.update({ where: { id: line.id }, data: { approvedQuantity: parsed.data.approvedQuantity } });
    await tx.inventoryRequest.update({ where: { id: line.requestId }, data: { status: parsed.data.approvedQuantity === Number(line.requestedQuantity) ? InventoryRequestStatus.APPROVED : parsed.data.approvedQuantity === 0 ? InventoryRequestStatus.REJECTED : InventoryRequestStatus.PARTIALLY_APPROVED, decisionReason: parsed.data.reason, decidedById: operator.id, decidedAt: new Date() } });
    if (parsed.data.approvedQuantity > 0) await tx.inventoryMovement.create({ data: { productId: line.productId, requestLineId: line.id, type: InventoryMovementType.REQUEST_FULFILLMENT, quantity: -parsed.data.approvedQuantity, reason: parsed.data.reason, createdById: operator.id } });
  });
  const notification = await prisma.inventoryRequestLine.findUnique({ where: { id: parsed.data.lineId }, include: { product: true, request: { include: { teacher: { include: { user: { select: { email: true, name: true } } } } } } } });
  if (notification?.request.teacher.user) await sendOperationDecisionEmail({ email: notification.request.teacher.user.email, recipientName: notification.request.teacher.user.name, title: "pedido de inventario", status: notification.request.status, detail: `${notification.product.name}: ${Number(notification.approvedQuantity ?? 0)} de ${Number(notification.requestedQuantity)}`, reason: parsed.data.reason, idempotencyKey: `inventory-request-decision-${notification.requestId}-${notification.request.status}` });
  revalidatePath("/dashboard");
  return { ok: true, message: "Solicitud resuelta." };
}

const requestLinesSchema = z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().positive() })).min(1).max(50);

export async function submitMultiItemInventoryRequestAction(lines: Array<{ productId: string; quantity: number }>) {
  const { teacher } = await requireOperationsTeacher();
  const parsed = requestLinesSchema.safeParse(lines);
  if (!parsed.success) return { ok: false, message: "Revisá los productos y las cantidades." };
  const productIds = parsed.data.map((line) => line.productId);
  if (new Set(productIds).size !== productIds.length) return { ok: false, message: "No repitas un producto en la solicitud." };
  const products = await prisma.inventoryProduct.count({ where: { id: { in: productIds } } });
  if (products !== productIds.length) return { ok: false, message: "Uno de los productos ya no existe." };
  await prisma.inventoryRequest.create({ data: { teacherId: teacher.id, lines: { create: parsed.data.map((line) => ({ productId: line.productId, requestedQuantity: line.quantity })) } } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Solicitud enviada." };
}

const requestDecisionLinesSchema = z.array(z.object({ lineId: z.string().min(1), approvedQuantity: z.coerce.number().nonnegative(), reason: z.string().trim().max(500).optional() })).min(1);

export async function decideWholeInventoryRequestAction(requestId: string, decisions: Array<{ lineId: string; approvedQuantity: number; reason?: string }>) {
  const operator = await requireOperationsOperator();
  const parsed = requestDecisionLinesSchema.safeParse(decisions);
  if (!parsed.success) return { ok: false, message: "Revisá las cantidades aprobadas." };
  await prisma.$transaction(async (tx) => {
    const request = await tx.inventoryRequest.findUnique({ where: { id: requestId }, include: { lines: { include: { product: true } } } });
    if (!request || request.status !== "PENDING" || request.lines.length !== parsed.data.length) throw new Error("La solicitud ya fue resuelta o está incompleta.");
    const decisionByLine = new Map(parsed.data.map((decision) => [decision.lineId, decision]));
    for (const line of request.lines) {
      const decision = decisionByLine.get(line.id);
      if (!decision || decision.approvedQuantity > Number(line.requestedQuantity)) throw new Error("Decisión inválida.");
      const balance = await tx.inventoryMovement.aggregate({ where: { productId: line.productId }, _sum: { quantity: true } });
      if (decision.approvedQuantity > Number(balance._sum.quantity?.toString() ?? 0)) throw new Error(`Stock insuficiente para ${line.product.name}.`);
    }
    const approved = parsed.data.reduce((total, decision) => total + decision.approvedQuantity, 0);
    const requested = request.lines.reduce((total, line) => total + Number(line.requestedQuantity), 0);
    const status = approved === 0 ? "REJECTED" : approved === requested ? "APPROVED" : "PARTIALLY_APPROVED";
    for (const line of request.lines) { const decision = decisionByLine.get(line.id)!; await tx.inventoryRequestLine.update({ where: { id: line.id }, data: { approvedQuantity: decision.approvedQuantity } }); if (decision.approvedQuantity > 0) await tx.inventoryMovement.create({ data: { productId: line.productId, requestLineId: line.id, type: "REQUEST_FULFILLMENT", quantity: -decision.approvedQuantity, reason: decision.reason, createdById: operator.id } }); }
    await tx.inventoryRequest.update({ where: { id: request.id }, data: { status, decidedById: operator.id, decidedAt: new Date() } });
  });
  const notification = await prisma.inventoryRequest.findUnique({ where: { id: requestId }, include: { teacher: { include: { user: { select: { email: true, name: true } } } }, lines: { include: { product: true } } } });
  if (notification?.teacher.user) await sendOperationDecisionEmail({ email: notification.teacher.user.email, recipientName: notification.teacher.user.name, title: "pedido de inventario", status: notification.status, detail: notification.lines.map((line) => `${line.product.name}: ${Number(line.approvedQuantity ?? 0)} de ${Number(line.requestedQuantity)}`).join(" · "), idempotencyKey: `inventory-request-decision-${notification.id}-${notification.status}` });
  revalidatePath("/dashboard");
  return { ok: true, message: "Solicitud resuelta." };
}

const stockMovementSchema = z.object({ productId: z.string().min(1), quantity: z.coerce.number().positive(), unitCost: z.coerce.number().nonnegative().optional(), reason: z.string().trim().min(2).max(500) });

export async function registerInventoryStockMovementAction(formData: FormData) {
  const operator = await requireOperationsOperator();
  const parsed = stockMovementSchema.safeParse({ productId: value(formData, "productId"), quantity: value(formData, "quantity"), unitCost: value(formData, "unitCost") || undefined, reason: value(formData, "reason") });
  if (!parsed.success) return { ok: false, message: "Revisá los datos del movimiento." };
  await prisma.inventoryMovement.create({ data: { productId: parsed.data.productId, type: InventoryMovementType.STOCK_IN, quantity: parsed.data.quantity, unitCost: parsed.data.unitCost, reason: parsed.data.reason, createdById: operator.id } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Ingreso de stock registrado." };
}

const adjustmentSchema = z.object({ productId: z.string().min(1), quantity: z.coerce.number().refine((value) => value !== 0), reason: z.string().trim().min(2).max(500) });

export async function adjustInventoryStockAction(formData: FormData) {
  const operator = await requireOperationsOperator();
  const parsed = adjustmentSchema.safeParse({ productId: value(formData, "productId"), quantity: value(formData, "quantity"), reason: value(formData, "reason") });
  if (!parsed.success) return { ok: false, message: "Indicá un ajuste y su motivo." };
  const current = await prisma.inventoryMovement.aggregate({ where: { productId: parsed.data.productId }, _sum: { quantity: true } });
  if (Number(current._sum.quantity?.toString() ?? 0) + parsed.data.quantity < 0) return { ok: false, message: "El ajuste no puede dejar el stock negativo." };
  await prisma.inventoryMovement.create({ data: { productId: parsed.data.productId, type: InventoryMovementType.MANUAL_ADJUSTMENT, quantity: parsed.data.quantity, reason: parsed.data.reason, createdById: operator.id } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Ajuste de stock registrado." };
}

export async function reverseInventoryMovementAction(movementId: string) {
  const operator = await requireOperationsOperator();
  const movement = await prisma.inventoryMovement.findUnique({ where: { id: movementId } });
  if (!movement) return { ok: false, message: "Movimiento inexistente." };
  const existing = await prisma.inventoryMovement.findUnique({ where: { reversesId: movementId } });
  if (existing) return { ok: false, message: "El movimiento ya fue revertido." };
  const balance = await prisma.inventoryMovement.aggregate({ where: { productId: movement.productId }, _sum: { quantity: true } });
  if (Number(balance._sum.quantity?.toString() ?? 0) - Number(movement.quantity) < 0) return { ok: false, message: "La reversión dejaría el stock negativo." };
  await prisma.inventoryMovement.create({ data: { productId: movement.productId, type: InventoryMovementType.REVERSAL, quantity: -Number(movement.quantity), reason: `Reversión de ${movement.id}`, createdById: operator.id, reversesId: movement.id } });
  revalidatePath("/dashboard");
  return { ok: true, message: "Movimiento revertido." };
}

const productSchema = z.object({ name: z.string().trim().min(2).max(120), unit: z.string().trim().min(1).max(30), minimumStock: z.coerce.number().nonnegative() });

export async function createInventoryProductAction(formData: FormData) {
  await requireOperationsSuperAdmin();
  const parsed = productSchema.safeParse({ name: value(formData, "name"), unit: value(formData, "unit"), minimumStock: value(formData, "minimumStock") });
  if (!parsed.success) return { ok: false, message: "Revisá los datos del producto." };
  try { await prisma.inventoryProduct.create({ data: parsed.data }); } catch { return { ok: false, message: "Ya existe un producto con esa unidad." }; }
  revalidatePath("/dashboard/operaciones");
  return { ok: true, message: "Producto creado." };
}

const minimumStockSchema = z.object({ productId: z.string().min(1), minimumStock: z.coerce.number().nonnegative() });

export async function setInventoryMinimumStockAction(formData: FormData) {
  await requireOperationsSuperAdmin();
  const parsed = minimumStockSchema.safeParse({ productId: value(formData, "productId"), minimumStock: value(formData, "minimumStock") });
  if (!parsed.success) return { ok: false, message: "Indicá un stock mínimo válido." };
  await prisma.inventoryProduct.update({ where: { id: parsed.data.productId }, data: { minimumStock: parsed.data.minimumStock } });
  revalidatePath("/dashboard/operaciones");
  return { ok: true, message: "Stock mínimo actualizado." };
}

export async function cancelInventoryRequestAction(requestId: string) {
  const { teacher } = await requireOperationsTeacher();
  const result = await prisma.inventoryRequest.updateMany({ where: { id: requestId, teacherId: teacher.id, status: InventoryRequestStatus.PENDING }, data: { status: InventoryRequestStatus.CANCELED, canceledAt: new Date() } });
  if (result.count === 0) return { ok: false, message: "La solicitud no puede cancelarse." };
  revalidatePath("/dashboard/operaciones");
  return { ok: true, message: "Solicitud cancelada." };
}
