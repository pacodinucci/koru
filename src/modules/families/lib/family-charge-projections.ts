import { installmentImputationDate, installmentPeriod, splitInstallmentAmounts } from "./eventual-installments.ts";
import { formatBillingPeriod } from "./monthly-billing.ts";
import { centsToMoney, signedMoneyToCents } from "./payment-allocation.ts";

export type ScheduledFamilyCharge = {
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
  isFuture: boolean;
  eventualChargeScheduleId: string;
  installmentNumber: number;
  outstandingAmount: string;
};

// Virtual IDs are resolved under the family lock before persisting an allocation.
export function projectFutureFamilyCharges(schedules: ScheduledFamilyCharge[], now: Date, includeDue = false): FutureFamilyCharge[] {
  return schedules.flatMap((schedule) => {
    if (schedule.student && schedule.student.familyId !== schedule.familyId) return [];
    const emitted = new Set(schedule.accountEntries.map((entry) => entry.installmentNumber));
    if (Array.from({ length: schedule.installmentCount }, (_, index) => index + 1).every(number => emitted.has(number))) return [];
    const amounts = splitInstallmentAmounts(schedule.totalAmount.toString(), schedule.installmentCount);
    const gross = schedule.grossAmount === null ? null : splitInstallmentAmounts(schedule.grossAmount.toString(), schedule.installmentCount);
    return amounts.flatMap((amount, index): FutureFamilyCharge[] => {
      const period = installmentPeriod(schedule.startPeriod, index);
      const imputationDate = installmentImputationDate(schedule.startPeriod, index);
      if ((!includeDue && imputationDate <= now) || emitted.has(index + 1)
        || (schedule.effectiveFrom && period < schedule.effectiveFrom)
        || (schedule.cancelledFrom && period >= schedule.cancelledFrom)) return [];
      return [{
        id: `future:${schedule.id}:${index + 1}`,
        type: schedule.isBase ? "MONTHLY_CHARGE" : "EVENTUAL_CHARGE",
        amount,
        grossAmount: gross?.[index] ?? null,
        discountAmount: gross ? centsToMoney(signedMoneyToCents(gross[index]) - signedMoneyToCents(amount)) : null,
        description: `${schedule.isBase ? "Cuota del plan anual" : "Cargo eventual"} · ${schedule.itemName} · cuota ${index + 1}/${schedule.installmentCount} · ${formatBillingPeriod(period)}${schedule.student ? ` · ${schedule.student.firstName} ${schedule.student.lastName}` : ""}`,
        occurredAt: imputationDate.toISOString(),
        payment: null,
        isFuture: imputationDate > now,
        eventualChargeScheduleId: schedule.id,
        installmentNumber: index + 1,
        outstandingAmount: amount,
      }];
    });
  }).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
}
