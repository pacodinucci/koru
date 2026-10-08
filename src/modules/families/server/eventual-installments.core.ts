import { AccountEntryType, Prisma, type PrismaClient } from "@prisma/client";

import { formatBillingPeriod } from "../lib/monthly-billing.ts";
import { dueInstallmentIndexes, installmentPeriod, splitInstallmentAmounts } from "../lib/eventual-installments.ts";

export async function createDueEventualInstallmentCharges(prisma: Pick<PrismaClient, "eventualChargeSchedule" | "familyAccountEntry">, now: Date, currentPeriod: Date, scheduleId?: string) {
  const schedules = await prisma.eventualChargeSchedule.findMany({
    where: { startPeriod: { lte: currentPeriod }, ...(scheduleId ? { id: scheduleId } : {}) },
    include: { student: { select: { firstName: true, lastName: true, familyId: true } }, accountEntries: { select: { installmentNumber: true } } },
  });
  const entries = schedules.flatMap((schedule) => {
    if (schedule.student && schedule.student.familyId !== schedule.familyId) return [];
    const amounts = splitInstallmentAmounts(schedule.totalAmount.toString(), schedule.installmentCount);
    const grossAmounts = schedule.grossAmount === null ? null : splitInstallmentAmounts(schedule.grossAmount.toString(), schedule.installmentCount);
    const emitted = new Set(schedule.accountEntries.flatMap((entry) => entry.installmentNumber === null ? [] : [entry.installmentNumber]));
    return dueInstallmentIndexes(schedule.startPeriod, schedule.installmentCount, currentPeriod, emitted).filter(index => {
      const period = installmentPeriod(schedule.startPeriod, index);
      return (!schedule.effectiveFrom || period >= schedule.effectiveFrom) && (!schedule.cancelledFrom || period < schedule.cancelledFrom);
    }).map((index) => {
      const amount = amounts[index];
      const number = index + 1;
      const duePeriod = installmentPeriod(schedule.startPeriod, index);
      return {
        familyId: schedule.familyId,
        type: schedule.isBase ? AccountEntryType.MONTHLY_CHARGE : AccountEntryType.EVENTUAL_CHARGE,
        amount,
        grossAmount: grossAmounts?.[index] ?? null,
        discountAmount: grossAmounts ? new Prisma.Decimal(grossAmounts[index]).minus(amount) : null,
        description: `${schedule.isBase ? "Cuota del plan anual" : "Cargo eventual"} · ${schedule.itemName} · cuota ${number}/${schedule.installmentCount} · ${formatBillingPeriod(duePeriod)}${schedule.student ? ` · ${schedule.student.firstName} ${schedule.student.lastName}` : ""}`,
        occurredAt: now,
        eventualChargeItemId: schedule.eventualChargeItemId,
        eventualChargeScheduleId: schedule.id,
        installmentNumber: number,
        createdById: schedule.createdById,
      };
    });
  });
  if (entries.length === 0) return { due: 0, created: 0 };
  const result = await prisma.familyAccountEntry.createMany({ data: entries, skipDuplicates: true });
  return { due: entries.length, created: result.count };
}
