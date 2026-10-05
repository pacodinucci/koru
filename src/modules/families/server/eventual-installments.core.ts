import { AccountEntryType, Prisma, type PrismaClient } from "@prisma/client";

import { formatBillingPeriod } from "../lib/monthly-billing.ts";
import { dueInstallmentIndexes, eventualInstallmentDescription, installmentPeriod, splitInstallmentAmounts } from "../lib/eventual-installments.ts";

export async function createDueEventualInstallmentCharges(prisma: PrismaClient, now: Date, currentPeriod: Date) {
  const schedules = await prisma.eventualChargeSchedule.findMany({
    where: { startPeriod: { lte: currentPeriod } },
    include: { accountEntries: { select: { installmentNumber: true } } },
  });
  const entries = schedules.flatMap((schedule) => {
    const amounts = splitInstallmentAmounts(schedule.totalAmount.toString(), schedule.installmentCount);
    const grossAmounts = schedule.grossAmount === null ? null : splitInstallmentAmounts(schedule.grossAmount.toString(), schedule.installmentCount);
    const emitted = new Set(schedule.accountEntries.flatMap((entry) => entry.installmentNumber === null ? [] : [entry.installmentNumber]));
    return dueInstallmentIndexes(schedule.startPeriod, schedule.installmentCount, currentPeriod, emitted).map((index) => {
      const amount = amounts[index];
      const number = index + 1;
      const duePeriod = installmentPeriod(schedule.startPeriod, index);
      return {
        familyId: schedule.familyId,
        type: AccountEntryType.EVENTUAL_CHARGE,
        amount,
        grossAmount: grossAmounts?.[index] ?? null,
        discountAmount: grossAmounts ? new Prisma.Decimal(grossAmounts[index]).minus(amount) : null,
        description: `${eventualInstallmentDescription(schedule.itemName, number, schedule.installmentCount)} · ${formatBillingPeriod(duePeriod)}`,
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
