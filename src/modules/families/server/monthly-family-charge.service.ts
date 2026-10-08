import "server-only";

import { synchronizeStudentBilling } from "@/modules/families/server/student-billing.core";
import { prisma } from "@/lib/prisma";
import { formatBillingPeriod, getBillingPeriod } from "@/modules/families/lib/monthly-billing";
import { createMonthlyFamilyCharges } from "@/modules/families/server/monthly-family-charge.core";
import { createDueEventualInstallmentCharges } from "@/modules/families/server/eventual-installments.core";

export async function generateMonthlyFamilyCharges(now = new Date()) {
  const billingPeriod = getBillingPeriod(now);
  const enrolled = await prisma.family.findMany({ where: { status: "ACTIVE", eventualChargeSchedules: { some: { studentId: { not: null }, isBase: true } } }, select: { id: true } });
  let studentChargesCreated = 0;
  for (const family of enrolled) {
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${family.id}))`;
      return synchronizeStudentBilling(tx, family.id, "monthly-billing", now);
    }, { timeout: 30000 });
    studentChargesCreated += result.created ?? 0;
  }
  const monthly = await createMonthlyFamilyCharges(prisma, now, billingPeriod, formatBillingPeriod(billingPeriod));
  const installments = await createDueEventualInstallmentCharges(prisma, now, billingPeriod);
  return { ...monthly, installments, studentCharges: { created: studentChargesCreated } };
}
