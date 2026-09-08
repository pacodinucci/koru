import "server-only";

import { CashFundEntryType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function getAllocationPeriod(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Creates at most one monthly allocation per teacher and calendar month. */
export async function generateMonthlyCashFundAllocations(now = new Date()) {
  const allocationPeriod = getAllocationPeriod(now);
  const [settings, teachers] = await Promise.all([
    prisma.cashFundSettings.findUnique({ where: { id: "default" } }),
    prisma.teacherProfile.findMany({
      where: { isActive: true },
      select: { id: true, displayName: true, cashFundBudget: { select: { monthlyAmount: true } } },
    }),
  ]);

  if (!settings) return { allocationPeriod, eligible: 0, created: 0, skipped: 0 };

  const result = await prisma.cashFundEntry.createMany({
    data: teachers.map((teacher) => ({
      teacherId: teacher.id,
      type: CashFundEntryType.MONTHLY_ALLOCATION,
      amount: teacher.cashFundBudget?.monthlyAmount ?? settings.defaultMonthlyAmount,
      description: `Acreditación mensual · ${teacher.displayName}`,
      occurredAt: now,
      allocationPeriod,
    })),
    skipDuplicates: true,
  });

  return { allocationPeriod, eligible: teachers.length, created: result.count, skipped: teachers.length - result.count };
}