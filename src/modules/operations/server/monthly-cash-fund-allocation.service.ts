import "server-only";

import { CashFundEntryType, CashFundRenewalFrequency } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const BIWEEKLY_ANCHOR = Date.UTC(1970, 0, 5);

function startOfUtcWeek(now: Date) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date;
}

function getAllocationPeriod(now: Date, frequency: CashFundRenewalFrequency) {
  if (frequency === CashFundRenewalFrequency.MONTHLY) return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const weekStart = startOfUtcWeek(now);
  if (frequency === CashFundRenewalFrequency.WEEKLY) return weekStart;
  const elapsedDays = Math.floor((weekStart.getTime() - BIWEEKLY_ANCHOR) / DAY_MS);
  return new Date(BIWEEKLY_ANCHOR + Math.floor(elapsedDays / 14) * 14 * DAY_MS);
}

function frequencyLabel(frequency: CashFundRenewalFrequency) {
  return frequency === CashFundRenewalFrequency.WEEKLY ? "semanal" : frequency === CashFundRenewalFrequency.BIWEEKLY ? "quincenal" : "mensual";
}

/** Creates at most one allocation per active group and configured renewal period. */
export async function generateMonthlyCashFundAllocations(now = new Date()) {
  const [settings, groups] = await Promise.all([
    prisma.cashFundSettings.findUnique({ where: { id: "default" } }),
    prisma.studentGroup.findMany({ where: { isActive: true, cashFundBudget: { isNot: null } }, select: { id: true, name: true, cashFundBudget: { select: { amountPerPeriod: true } } } }),
  ]);
  const frequency = settings?.renewalFrequency ?? CashFundRenewalFrequency.MONTHLY;
  const allocationPeriod = getAllocationPeriod(now, frequency);
  const result = await prisma.cashFundEntry.createMany({
    data: groups.flatMap((group) => group.cashFundBudget ? [{ groupId: group.id, type: CashFundEntryType.PERIODIC_ALLOCATION, amount: group.cashFundBudget.amountPerPeriod, description: `Acreditación ${frequencyLabel(frequency)} · ${group.name}`, occurredAt: now, allocationPeriod }] : []),
    skipDuplicates: true,
  });
  return { allocationPeriod, frequency, eligible: groups.length, created: result.count, skipped: groups.length - result.count };
}
