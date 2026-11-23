import { projectFutureFamilyCharges, type ScheduledFamilyCharge } from "./family-charge-projections.ts";
import { calculateFamilyBalance } from "./family-account-policy.ts";
import { buildAllocationSummary, chargeImputationDate, signedMoneyToCents, type AllocationEntry } from "./payment-allocation.ts";

export function buildFamilyFinancialSummary(entries: AllocationEntry[], schedules: ScheduledFamilyCharge[], now = new Date()) {
  const scheduled = new Map(schedules.map(schedule => [schedule.id, schedule]));
  const normalized = entries.map(entry => {
    const schedule = entry.eventualChargeSchedule ?? scheduled.get(entry.eventualChargeScheduleId ?? "");
    const occurredAt = chargeImputationDate({ ...entry, eventualChargeSchedule: schedule });
    return { ...entry, eventualChargeSchedule: schedule, occurredAt };
  });
  // Include missed accruals at read time: neither cron availability nor a visit
  // precisely on the 25th is required for a correct current balance.
  const projected = projectFutureFamilyCharges(schedules, now, true);
  const all = [...normalized, ...projected.map(entry => ({ ...entry, occurredAt: new Date(entry.occurredAt), allocationsAsCredit: [] }))];
  const summary = buildAllocationSummary(all);
  return {
    balance: calculateFamilyBalance(all, now).toFixed(2),
    pendingCharges: summary.pendingCharges.map(charge => ({ ...charge, isFuture: new Date(charge.occurredAt) > now }))
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id)),
    unallocatedCredits: summary.unallocatedCredits,
    futureCharges: projected.filter(entry => entry.isFuture),
    projectedCharges: projected,
    entries: normalized.map(entry => ({ ...entry, isFuture: signedMoneyToCents(entry.amount.toString()) >= 0 &&
      (entry.type === "MONTHLY_CHARGE" || entry.type === "EVENTUAL_CHARGE") && entry.occurredAt > now })),
  };
}
