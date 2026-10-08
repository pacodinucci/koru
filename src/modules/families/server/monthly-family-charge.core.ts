import { AccountEntryType, FamilyStatus, Prisma, type PrismaClient } from "@prisma/client";
import { annualPlanInstallment, annualPlanInstallmentIndex } from "../lib/annual-plan.ts";

export async function createMonthlyFamilyCharges(prisma: PrismaClient, now: Date, billingPeriod: Date, periodLabel: string) {
  const families = await prisma.family.findMany({
    where: { eventualChargeSchedules: { none: { studentId: { not: null }, isBase: true } }, status: FamilyStatus.ACTIVE, students: { some: { plan: { is: { isActive: true } } } } },
    select: {
      id: true,
      students: {
        where: { plan: { is: { isActive: true } } },
        select: { firstName: true, lastName: true, plan: { select: { name: true, annualFee: true, installmentCount: true, startMonth: true, discountPercent: true } } },
      },
    },
  });

  const data = families.flatMap((family) => {
      const charges = family.students.flatMap((student) => {
        if (!student.plan) return [];
        const index = annualPlanInstallmentIndex(billingPeriod.getUTCMonth() + 1, student.plan.startMonth, student.plan.installmentCount);
        if (index === null) return [];
        return [{ student, plan: student.plan, amounts: annualPlanInstallment(student.plan.annualFee.toString(), student.plan.discountPercent.toString(), student.plan.installmentCount, index) }];
      });
      if (!charges.length) return [];
      return [{
        familyId: family.id,
        type: AccountEntryType.MONTHLY_CHARGE,
        amount: charges.reduce((total, charge) => total.plus(charge.amounts.netAmount), new Prisma.Decimal(0)),
        grossAmount: charges.reduce((total, charge) => total.plus(charge.amounts.grossAmount), new Prisma.Decimal(0)),
        discountAmount: charges.reduce((total, charge) => total.plus(charge.amounts.discountAmount), new Prisma.Decimal(0)),
        description: `Cuota del plan anual · ${periodLabel} · ${charges.map(({ student, plan }) => `${student.firstName} ${student.lastName}: ${plan.name}${plan.discountPercent.isZero() ? "" : ` (${plan.discountPercent}% desc.)`}`).join("; ")}`,
        occurredAt: now,
        billingPeriod,
      }];
    });
  const result = await prisma.familyAccountEntry.createMany({ data, skipDuplicates: true });

  return { billingPeriod, eligible: data.length, created: result.count, skipped: data.length - result.count };
}
