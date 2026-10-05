import "server-only";

import { prisma } from "@/lib/prisma";
import { formatBillingPeriod, getBillingPeriod } from "@/modules/families/lib/monthly-billing";
import { createMonthlyFamilyCharges } from "@/modules/families/server/monthly-family-charge.core";
import { createDueEventualInstallmentCharges } from "@/modules/families/server/eventual-installments.core";

export async function generateMonthlyFamilyCharges(now = new Date()) {
  const billingPeriod = getBillingPeriod(now);
  const monthly = await createMonthlyFamilyCharges(prisma, now, billingPeriod, formatBillingPeriod(billingPeriod));
  const installments = await createDueEventualInstallmentCharges(prisma, now, billingPeriod);
  return { ...monthly, installments };
}
