import { chargeImputationDate, isActiveCredit, signedMoneyToCents, type AllocationEntry } from "./payment-allocation.ts";

export type AccountMovement = { amount: number | string | { toString(): string } } & Partial<Omit<AllocationEntry, "amount">>;

export function calculateFamilyBalance(entries: AccountMovement[], now = new Date()) {
  const futureIds = new Set(entries.filter(entry =>
    (entry.type === "MONTHLY_CHARGE" || entry.type === "EVENTUAL_CHARGE") && entry.eventualChargeScheduleId && entry.occurredAt &&
    chargeImputationDate({ ...entry, occurredAt: entry.occurredAt }) > now,
  ).map(entry => entry.id));
  let cents = 0;
  for (const entry of entries) {
    if (!futureIds.has(entry.id)) cents += signedMoneyToCents(entry.amount.toString());
    // The payment remains in the ledger on its actual date. Its future portion
    // stays attached to those installments instead of offsetting current debt.
    if (entry.type && entry.occurredAt && entry.allocationsAsCredit && isActiveCredit(entry as AllocationEntry)) {
      for (const row of entry.allocationsAsCredit) {
        if (futureIds.has(row.chargeEntryId)) cents += signedMoneyToCents(row.amount.toString());
      }
    }
  }
  return cents / 100;
}

export function canWaiveFamilyBalance({ outstanding, amount }: { outstanding: number; amount: number }) {
  return amount > 0 && amount <= outstanding;
}
