import { installmentPeriod, splitInstallmentAmounts } from "./eventual-installments.ts";
import { formatBillingPeriod } from "./monthly-billing.ts";
import { centsToMoney, signedMoneyToCents } from "./payment-allocation.ts";

type ScheduledFamilyCharge = {
  id: string;
  familyId: string;
  itemName: string;
  isBase: boolean;
  totalAmount: { toString(): string };
  grossAmount: { toString(): string } | null;
  installmentCount: number;
  startPeriod: Date;
  effectiveFrom: Date | null;
  cancelledFrom: Date | null;
  student: { firstName: string; lastName: string; familyId: string | null } | null;
  accountEntries: { installmentNumber: number | null }[];
};

export type FutureFamilyCharge = {
  id: string;
  type: "MONTHLY_CHARGE" | "EVENTUAL_CHARGE";
  amount: string;
  grossAmount: string | null;
  discountAmount: string | null;
  description: string;
  occurredAt: string;
  payment: null;
  isFuture: true;
};

// Display-only: never feed projected rows into balances, allocations or generation.
export function projectFutureFamilyCharges(schedules: ScheduledFamilyCharge[], currentPeriod: Date): FutureFamilyCharge[] {
  return schedules.flatMap((schedule) => {
    if (schedule.student && schedule.student.familyId !== schedule.familyId) return [];
    const amounts = splitInstallmentAmounts(schedule.totalAmount.toString(), schedule.installmentCount);
    const gross = schedule.grossAmount === null ? null : splitInstallmentAmounts(schedule.grossAmount.toString(), schedule.installmentCount);
    const emitted = new Set(schedule.accountEntries.map((entry) => entry.installmentNumber));
    return amounts.flatMap((amount, index): FutureFamilyCharge[] => {
      const period = installmentPeriod(schedule.startPeriod, index);
      if (period <= currentPeriod || emitted.has(index + 1)
        || (schedule.effectiveFrom && period < schedule.effectiveFrom)
        || (schedule.cancelledFrom && period >= schedule.cancelledFrom)) return [];
      return [{
        id: `future:${schedule.id}:${index + 1}`,
        type: schedule.isBase ? "MONTHLY_CHARGE" : "EVENTUAL_CHARGE",
        amount,
        grossAmount: gross?.[index] ?? null,
        discountAmount: gross ? centsToMoney(signedMoneyToCents(gross[index]) - signedMoneyToCents(amount)) : null,
        description: `${schedule.isBase ? "Cuota del plan anual" : "Cargo eventual"} · ${schedule.itemName} · cuota ${index + 1}/${schedule.installmentCount} · ${formatBillingPeriod(period)}${schedule.student ? ` · ${schedule.student.firstName} ${schedule.student.lastName}` : ""}`,
        occurredAt: period.toISOString(),
        payment: null,
        isFuture: true,
      }];
    });
  }).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
}
