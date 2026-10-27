import "server-only";

import { prisma } from "@/lib/prisma";
import { buildFamilyFinancialSummary } from "@/modules/families/lib/family-financial-summary";

export async function getFamilyAccountForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      family: {
        select: {
          id: true,
          name: true,
          students: { select: { id: true, firstName: true, lastName: true, plan: { select: { name: true, annualFee: true, installmentCount: true, startMonth: true, discountPercent: true, isActive: true } } } },
          eventualChargeSchedules: { include: { student: { select: { firstName: true, lastName: true, familyId: true } }, accountEntries: { select: { installmentNumber: true } } } },
          accountEntries: {
            orderBy: { occurredAt: "desc" },
            include: {
              allocationsAsCredit: true,
              payment: {
                select: {
                  method: true,
                  reference: true,
                  status: true,
                  receipt: { select: { id: true, number: true, status: true, pdfUrl: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.family) return null;

  const summary = buildFamilyFinancialSummary(user.family.accountEntries, user.family.eventualChargeSchedules);
  const dates = new Map(summary.entries.map(entry => [entry.id, entry.occurredAt]));
  return { ...user.family, balance: Number(summary.balance), accountEntries: user.family.accountEntries.map(entry => ({ ...entry, occurredAt: dates.get(entry.id)! })) };
}
