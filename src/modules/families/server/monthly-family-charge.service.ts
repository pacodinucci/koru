import "server-only";

import { AccountEntryType, FamilyStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatBillingPeriod, getBillingPeriod } from "@/modules/families/lib/monthly-billing";

export async function generateMonthlyFamilyCharges(now = new Date()) {
  const billingPeriod = getBillingPeriod(now);
  const families = await prisma.family.findMany({
    where: { status: FamilyStatus.ACTIVE, plan: { is: { isActive: true } } },
    select: { id: true, plan: { select: { name: true, monthlyFee: true } } },
  });

  const eligibleFamilies = families.filter((family): family is typeof family & { plan: NonNullable<typeof family.plan> } => Boolean(family.plan));
  const result = await prisma.familyAccountEntry.createMany({
    data: eligibleFamilies.map((family) => ({
      familyId: family.id,
      type: AccountEntryType.MONTHLY_CHARGE,
      amount: family.plan.monthlyFee,
      description: `Cuota mensual · ${family.plan.name} · ${formatBillingPeriod(billingPeriod)}`,
      occurredAt: now,
      billingPeriod,
    })),
    skipDuplicates: true,
  });

  return { billingPeriod, eligible: eligibleFamilies.length, created: result.count, skipped: eligibleFamilies.length - result.count };
}