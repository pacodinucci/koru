import { installmentImputationDate } from "./eventual-installments.ts";

export type PendingFamilyCharge = {
  id: string;
  description: string;
  occurredAt: string;
  amount: string;
  outstandingAmount: string;
  eventualChargeScheduleId?: string | null;
  installmentNumber?: number | null;
  isFuture?: boolean;
};

export type UnallocatedFamilyCredit = {
  id: string;
  description: string;
  occurredAt: string;
  amount: string;
  unallocatedAmount: string;
  type: "PAYMENT" | "BALANCE_WAIVER";
};

export type AllocationEntry = {
  id: string;
  type: string;
  amount: { toString(): string } | string;
  description: string;
  occurredAt: Date;
  eventualChargeScheduleId?: string | null;
  installmentNumber?: number | null;
  eventualChargeSchedule?: { startPeriod: Date } | null;
  payment?: { status: string } | null;
  allocationsAsCredit: { chargeEntryId: string; amount: { toString(): string } | string }[];
};

export class AllocationInputError extends Error {}

// Decimal(12,2), without floating-point rounding, exponent notation or coercion.
export function moneyToCents(value: string): number {
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(value)) throw new AllocationInputError("Revisá los importes: usá hasta dos decimales y un valor mayor a cero.");
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents <= 0) throw new AllocationInputError("Revisá los importes: usá hasta dos decimales y un valor mayor a cero.");
  return cents;
}

export function signedMoneyToCents(value: string): number {
  if (/^-?0(?:\.0{1,2})?$/.test(value)) return 0;
  return value.startsWith("-") ? -moneyToCents(value.slice(1)) : moneyToCents(value);
}

export function centsToMoney(cents: number): string {
  const absolute = Math.abs(cents);
  return `${cents < 0 ? "-" : ""}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function parseAllocations(json: string): { chargeEntryId: string; cents: number }[] {
  let value: unknown;
  try { value = JSON.parse(json); } catch { throw new AllocationInputError("Seleccioná los conceptos del pago."); }
  if (!Array.isArray(value) || value.length === 0) throw new AllocationInputError("Seleccioná los conceptos del pago.");
  const ids = new Set<string>();
  return value.map((row: unknown) => {
    if (!row || typeof row !== "object" || !("chargeEntryId" in row) || !("amount" in row)
      || typeof row.chargeEntryId !== "string" || !row.chargeEntryId.trim() || typeof row.amount !== "string" || ids.has(row.chargeEntryId)) {
      throw new AllocationInputError("Revisá las asignaciones: no repitas conceptos y usá importes válidos.");
    }
    ids.add(row.chargeEntryId);
    return { chargeEntryId: row.chargeEntryId, cents: moneyToCents(row.amount) };
  });
}

export function argentinaPaymentDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AllocationInputError("Revisá la fecha del pago.");
  // Anchor at Argentina noon: both Argentina and the existing Mexico City receipt
  // formatter retain the selected calendar day. Midnight would drift on receipts.
  const date = new Date(`${value}T15:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AllocationInputError("Revisá la fecha del pago.");
  }
  return date;
}

export function isActiveCredit(entry: AllocationEntry): boolean {
  return signedMoneyToCents(entry.amount.toString()) < 0 &&
    (entry.type === "BALANCE_WAIVER" || (entry.type === "PAYMENT" && entry.payment?.status === "REGISTERED"));
}

export function buildAllocationSummary(entries: AllocationEntry[]): { pendingCharges: PendingFamilyCharge[]; unallocatedCredits: UnallocatedFamilyCredit[] } {
  const allocated = new Map<string, number>();
  const unallocatedCredits: UnallocatedFamilyCredit[] = [];
  for (const entry of entries) {
    if (!isActiveCredit(entry)) continue;
    let assigned = 0;
    for (const row of entry.allocationsAsCredit) {
      const cents = moneyToCents(row.amount.toString());
      assigned += cents;
      allocated.set(row.chargeEntryId, (allocated.get(row.chargeEntryId) ?? 0) + cents);
    }
    const amount = -signedMoneyToCents(entry.amount.toString());
    if (amount > assigned) unallocatedCredits.push({
      id: entry.id, description: entry.description, occurredAt: entry.occurredAt.toISOString(),
      amount: centsToMoney(amount), unallocatedAmount: centsToMoney(amount - assigned), type: entry.type as UnallocatedFamilyCredit["type"],
    });
  }
  const pendingCharges: PendingFamilyCharge[] = [];
  for (const entry of entries) {
    if (entry.type !== "MONTHLY_CHARGE" && entry.type !== "EVENTUAL_CHARGE") continue;
    const amount = signedMoneyToCents(entry.amount.toString());
    const outstanding = amount - (allocated.get(entry.id) ?? 0);
    if (amount > 0 && outstanding > 0) pendingCharges.push({
      id: entry.id, description: entry.description, occurredAt: chargeImputationDate(entry).toISOString(),
      amount: centsToMoney(amount), outstandingAmount: centsToMoney(outstanding),
      ...(entry.eventualChargeScheduleId ? { eventualChargeScheduleId: entry.eventualChargeScheduleId, installmentNumber: entry.installmentNumber } : {}),
    });
  }
  return { pendingCharges, unallocatedCredits };
}

// Derive dates for historical generated charges too, without rewriting the ledger.
export function chargeImputationDate(entry: Pick<AllocationEntry, "occurredAt" | "installmentNumber" | "eventualChargeSchedule">): Date {
  return entry.eventualChargeSchedule && entry.installmentNumber
    ? installmentImputationDate(entry.eventualChargeSchedule.startPeriod, entry.installmentNumber - 1)
    : entry.occurredAt;
}

export const consecutiveInstallmentsMessage = "Seleccioná cuotas correlativas y completá las anteriores antes de adelantar la siguiente.";

export function validateConsecutiveAllocations(rows: { chargeEntryId: string; cents: number }[], pending: Pick<PendingFamilyCharge, "id" | "outstandingAmount" | "eventualChargeScheduleId" | "installmentNumber">[]) {
  const selected = new Map(rows.map(row => [row.chargeEntryId, row.cents]));
  const groups = new Map<string, typeof pending>();
  for (const charge of pending) {
    if (!charge.eventualChargeScheduleId || !charge.installmentNumber) continue;
    const group = groups.get(charge.eventualChargeScheduleId) ?? [];
    group.push(charge);
    groups.set(charge.eventualChargeScheduleId, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.installmentNumber! - b.installmentNumber!);
    const last = group.findLastIndex(charge => selected.has(charge.id));
    for (let index = 0; index < last; index++) {
      if (selected.get(group[index].id) !== moneyToCents(group[index].outstandingAmount)) {
        throw new AllocationInputError(consecutiveInstallmentsMessage);
      }
    }
  }
}
