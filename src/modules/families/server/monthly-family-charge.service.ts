import "server-only";

import { prisma } from "@/lib/prisma";
import { getBillingPeriod } from "@/modules/families/lib/monthly-billing";
import { createDueEventualInstallmentCharges } from "@/modules/families/server/eventual-installments.core";

export async function generateMonthlyFamilyCharges(now = new Date()) {
  const billingPeriod = getBillingPeriod(now);
  // Only explicit assignment/manual schedules accrue debt. Retired plans never generate it.
  const installments = await createDueEventualInstallmentCharges(prisma, now, billingPeriod);
  return { billingPeriod, eligible: 0, created: 0, skipped: 0, installments, studentCharges: { created: 0 } };
}
