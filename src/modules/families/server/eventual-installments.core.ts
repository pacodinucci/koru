import { AccountEntryType, Prisma, type PrismaClient } from "@prisma/client";

import { formatBillingPeriod } from "../lib/monthly-billing.ts";
import { dueInstallmentIndexes, installmentPeriod, splitInstallmentAmounts } from "../lib/eventual-installments.ts";

type InstallmentDatabase = Pick<PrismaClient, "eventualChargeSchedule" | "familyAccountEntry"> & Partial<Pick<PrismaClient, "$transaction">>;

export async function lockFamilyBilling(tx: Pick<Prisma.TransactionClient, "$queryRaw">, familyId: string) {
  // SELECT 1 avoids returning PostgreSQL's void type through the PrismaPg adapter.
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${familyId}))`;
}

export async function createDueEventualInstallmentCharges(prisma: InstallmentDatabase, now: Date, currentPeriod: Date, scheduleId?: string): Promise<{ due: number; created: number }> {
  if (prisma.$transaction) {
    // Discovery is only a work list. Never use its terms after waiting for a lock:
    // an editor may have changed or removed the schedule in the meantime.
    const candidates = await prisma.eventualChargeSchedule.findMany({
      where: { startPeriod: { lte: currentPeriod }, ...(scheduleId ? { id: scheduleId } : {}) },
      select: { id: true, familyId: true },
      orderBy: [{ familyId: "asc" }, { id: "asc" }],
    });
    const total = { due: 0, created: 0 };
    for (const candidate of candidates) {
      const result = await prisma.$transaction(async tx => {
        await lockFamilyBilling(tx, candidate.familyId);
        return createDueEventualInstallmentCharges(tx, now, currentPeriod, candidate.id);
      }, { isolationLevel: "Serializable", timeout: 30000 });
      total.due += result.due;
      total.created += result.created;
    }
    return total;
  }
  // Transaction callers own the family lock for the entire read/write operation.
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
