import type { Prisma } from "@prisma/client";
import { lockFamilyBilling } from "./eventual-installments.core.ts";

import {
  AllocationInputError, argentinaPaymentDate, buildAllocationSummary, centsToMoney,
  isActiveCredit, moneyToCents, parseAllocations, signedMoneyToCents,
} from "../lib/payment-allocation.ts";

type TransactionDatabase = {
  $transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>, options: { isolationLevel: "Serializable" }): Promise<T>;
};
type Result = { ok: false; message: string } | { ok: true; message: string; familyId: string; paymentId?: string };
type PaymentInput = { familyId: string; amount: string; method: string; reference?: string; paidAt: string; allocations: string };
type ReconcileInput = { familyId: string; creditEntryId: string; allocations: string };
type WaiverInput = { familyId: string; amount: string; reason: string };
const conflictMessage = "La cuenta cambió mientras guardabas. Actualizá la ficha, revisá los pendientes y volvé a intentar.";
const targetMessage = "Seleccioná cargos pendientes de esta familia y no superes sus importes pendientes.";

function reject(message: string): never { throw new AllocationInputError(message); }
function hasId(value: string) { return typeof value === "string" && value.trim().length > 0; }
function reasonIsValid(value: string) { return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 300; }

function parseInput<T>(parse: () => T, message: string): T {
  try { return parse(); } catch (error) {
    if (error instanceof AllocationInputError) reject(message);
    throw error;
  }
}

async function loadAccount(tx: Prisma.TransactionClient, familyId: string) {
  await lockFamilyBilling(tx, familyId);
  const family = await tx.family.findUnique({ where: { id: familyId }, select: { id: true } });
  if (!family) reject("No encontramos la familia.");
  const entries = await tx.familyAccountEntry.findMany({
    where: { familyId }, include: { payment: true, allocationsAsCredit: true },
  });
  return { entries, ...buildAllocationSummary(entries) };
}

function validateTargets(rows: ReturnType<typeof parseAllocations>, pending: ReturnType<typeof buildAllocationSummary>["pendingCharges"]) {
  const targets = new Map(pending.map((entry) => [entry.id, moneyToCents(entry.outstandingAmount)]));
  for (const row of rows) {
    const outstanding = targets.get(row.chargeEntryId);
    if (outstanding === undefined || row.cents > outstanding) reject(targetMessage);
  }
}

async function appendAllocations(tx: Prisma.TransactionClient, creditEntryId: string, rows: ReturnType<typeof parseAllocations>, createdById: string) {
  await tx.familyPaymentAllocation.createMany({ data: rows.map((row) => ({
    creditEntryId, chargeEntryId: row.chargeEntryId, amount: centsToMoney(row.cents), createdById,
  })) });
}

// Dependency injection keeps the financial entry points testable without a live database.
// The shared family lock coordinates schedule edits/generation with allocations;
// serializable predicates also cover stale snapshots and phantom credits.
// Never retry blindly: the operator must review the refreshed debt before trying again.
export function createFamilyPaymentService(db: TransactionDatabase) {
  async function transaction(work: (tx: Prisma.TransactionClient) => Promise<Result>): Promise<Result> {
    try { return await db.$transaction(work, { isolationLevel: "Serializable" }); } catch (error) {
      if (error instanceof AllocationInputError) return { ok: false, message: error.message };
      if (error && typeof error === "object" && "code" in error && (error.code === "P2034" || error.code === "P2003")) return { ok: false, message: conflictMessage };
      throw error;
    }
  }

  return {
    register(input: PaymentInput, actorId: string): Promise<Result> {
      return transaction(async (tx) => {
        const invalid = "Revisá los datos del pago y sus asignaciones.";
        const { cents, rows, paidAt } = parseInput(() => {
          if (!hasId(input.familyId) || !["CASH", "BANK_TRANSFER", "CARD", "OTHER"].includes(input.method)
            || (input.reference !== undefined && (typeof input.reference !== "string" || input.reference.trim().length > 160))) reject(invalid);
          return { cents: moneyToCents(input.amount), rows: parseAllocations(input.allocations), paidAt: argentinaPaymentDate(input.paidAt) };
        }, invalid);
        const account = await loadAccount(tx, input.familyId);
        if (account.unallocatedCredits.length) reject("Conciliá los pagos y condonaciones pendientes antes de registrar un nuevo pago.");
        const assigned = rows.reduce((sum, row) => sum + row.cents, 0);
        if (!Number.isSafeInteger(assigned) || assigned !== cents) reject("Asigná el total del pago a los conceptos seleccionados; el restante debe ser cero.");
        validateTargets(rows, account.pendingCharges);
        const payment = await tx.familyPayment.create({ data: {
          familyId: input.familyId, amount: centsToMoney(cents), method: input.method as "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER",
          reference: input.reference?.trim() || null, paidAt, createdById: actorId,
        } });
        const entry = await tx.familyAccountEntry.create({ data: {
          familyId: input.familyId, type: "PAYMENT", amount: centsToMoney(-cents), description: "Pago registrado",
          occurredAt: paidAt, paymentId: payment.id, createdById: actorId,
        } });
        await appendAllocations(tx, entry.id, rows, actorId);
        return { ok: true, message: "Pago registrado.", familyId: input.familyId, paymentId: payment.id };
      });
    },

    reconcile(input: ReconcileInput, actorId: string, authorizeWaiver: () => Promise<unknown>): Promise<Result> {
      return transaction(async (tx) => {
        const rows = parseInput(() => {
          if (!hasId(input.familyId) || !hasId(input.creditEntryId)) reject("Revisá los datos de la conciliación.");
          return parseAllocations(input.allocations);
        }, "Revisá los datos de la conciliación.");
        const account = await loadAccount(tx, input.familyId);
        const credit = account.entries.find((entry) => entry.id === input.creditEntryId);
        if (!credit || !isActiveCredit(credit)) reject("Seleccioná un pago o una condonación vigente de esta familia.");
        if (credit.type === "BALANCE_WAIVER") await authorizeWaiver();
        const remainder = account.unallocatedCredits.find((entry) => entry.id === credit.id);
        const assigned = rows.reduce((sum, row) => sum + row.cents, 0);
        if (!Number.isSafeInteger(assigned) || !remainder || assigned > moneyToCents(remainder.unallocatedAmount)) reject("La asignación supera el crédito disponible.");
        validateTargets(rows, account.pendingCharges);
        await appendAllocations(tx, credit.id, rows, actorId);
        return { ok: true, message: "Crédito conciliado.", familyId: input.familyId };
      });
    },

    voidPayment(input: { paymentId: string; reason: string }, actorId: string): Promise<Result> {
      return transaction(async (tx) => {
        if (!hasId(input.paymentId) || !reasonIsValid(input.reason)) reject("Indicá el motivo de la anulación.");
        const payment = await tx.familyPayment.findUnique({ where: { id: input.paymentId } });
        if (!payment) reject("No encontramos el pago.");
        await lockFamilyBilling(tx, payment.familyId);
        if (payment.status !== "VOIDED") {
          await tx.familyPayment.update({ where: { id: payment.id }, data: { status: "VOIDED", voidedAt: new Date(), voidReason: input.reason.trim() } });
          await tx.paymentReceipt.updateMany({ where: { paymentId: payment.id }, data: { status: "VOIDED" } });
          await tx.familyAccountEntry.create({ data: {
            familyId: payment.familyId, type: "PAYMENT_REVERSAL", amount: payment.amount,
            description: `Anulación de pago: ${input.reason.trim()}`, createdById: actorId,
          } });
        }
        // Allocation rows are immutable history. Voided credits no longer reduce debt.
        return { ok: true, message: "Pago anulado y saldo revertido.", familyId: payment.familyId };
      });
    },

    waive(input: WaiverInput, actorId: string): Promise<Result> {
      return transaction(async (tx) => {
        const cents = parseInput(() => {
          if (!hasId(input.familyId) || !reasonIsValid(input.reason)) reject("Revisá el importe y el motivo de la condonación.");
          return moneyToCents(input.amount);
        }, "Revisá el importe y el motivo de la condonación.");
        const account = await loadAccount(tx, input.familyId);
        const balance = account.entries.reduce((sum, entry) => sum + BigInt(signedMoneyToCents(entry.amount.toString())), BigInt(0));
        if (BigInt(cents) > balance) reject("La condonación no puede superar el saldo pendiente.");
        // No targets are collected by the waiver form; require explicit manual reconciliation.
        await tx.familyAccountEntry.create({ data: {
          familyId: input.familyId, type: "BALANCE_WAIVER", amount: centsToMoney(-cents),
          description: `Condonación: ${input.reason.trim()}`, createdById: actorId,
        } });
        return { ok: true, message: "Saldo condonado.", familyId: input.familyId };
      });
    },
  };
}
