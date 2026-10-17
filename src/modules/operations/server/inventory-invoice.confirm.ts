import "server-only";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { InvoiceConfirmation } from "@/modules/operations/domain/inventory-invoice";

export class InvoiceConflict extends Error {}
export class InvoiceProductMissing extends Error {}

/** The purchase UUID and deterministic movement IDs serialize equal and conflicting retries. */
export async function commitInvoice(input: InvoiceConfirmation, actorId: string): Promise<void> {
  const prefix = `invoice:${input.batchId}:`;
  // The confirmation schema normalizes UUID, trimmed fields and absent costs before this boundary.
  const digest = createHash("sha256").update(JSON.stringify({ actorId, ...input })).digest("hex");
  const occurredAt = new Date(`${input.date}T12:00:00.000Z`);
  const purchase = {
    id: input.batchId, supplier: input.supplier, occurredAt, totalAmount: input.totalAmount,
    invoiceNumber: input.invoiceNumber, fingerprint: digest, createdById: actorId,
  };
  const rows = input.lines.map((line, index) => ({
    id: `${prefix}${index}`, purchaseId: input.batchId, productId: line.productId, type: "STOCK_IN" as const,
    quantity: line.quantity, unitCost: line.unitCost, createdById: actorId, occurredAt,
    reason: `Factura ${input.invoiceNumber ?? "sin número"} · ${input.supplier} · ${line.description}\n[invoice-sha256:${digest}]`,
  }));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const previousPurchase = await tx.inventoryPurchase.findUnique({ where: { id: input.batchId } });
        // Include both fixed IDs (legacy/orphaned rows) and all linked rows (unexpected extra rows).
        const previous = await tx.inventoryMovement.findMany({ where: {
          OR: [{ id: { startsWith: prefix } }, { purchaseId: input.batchId }],
        } });
        if (previousPurchase) {
          const exact = previousPurchase.fingerprint === digest
            && previousPurchase.supplier === purchase.supplier
            && previousPurchase.occurredAt.getTime() === occurredAt.getTime()
            && Number(previousPurchase.totalAmount) === purchase.totalAmount
            && previousPurchase.invoiceNumber === purchase.invoiceNumber
            && previousPurchase.createdById === actorId
            && previous.length === rows.length && rows.every((row) => previous.some((old) =>
              old.id === row.id && old.purchaseId === row.purchaseId
              && old.reason === row.reason && old.createdById === actorId
              && old.productId === row.productId && old.type === row.type
              && old.occurredAt.getTime() === row.occurredAt.getTime()
              && Number(old.quantity) === row.quantity
              && (old.unitCost === null ? null : Number(old.unitCost)) === row.unitCost));
          if (!exact) throw new InvoiceConflict();
          return;
        }
        // Previous versions stored only movements: never guess a total or add their stock again.
        if (previous.length) throw new InvoiceConflict();
        const ids = [...new Set(input.lines.map((line) => line.productId))];
        const products = await tx.inventoryProduct.findMany({ where: { id: { in: ids } }, select: { id: true } });
        if (ids.some((id) => !products.some((product) => product.id === id))) throw new InvoiceProductMissing();
        await tx.inventoryPurchase.create({ data: purchase });
        await tx.inventoryMovement.createMany({ data: rows });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return;
    } catch (error) {
      // Retry only known key/serialization conflicts, never an uncertain commit outcome.
      // The next transaction checks the committed purchase and its complete set of rows.
      const code = error && typeof error === "object" && "code" in error ? error.code : null;
      if ((code === "P2002" || code === "P2034") && attempt < 2) continue;
      throw error;
    }
  }
}
