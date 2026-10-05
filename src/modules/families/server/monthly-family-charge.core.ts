import { AccountEntryType, FamilyStatus, Prisma, type PrismaClient } from "@prisma/client";
import { calculatePlanDiscount } from "../lib/plan-discounts.ts";

export async function createMonthlyFamilyCharges(prisma: PrismaClient, now: Date, billingPeriod: Date, periodLabel: string) {
  const families = await prisma.family.findMany({
    where: { status: FamilyStatus.ACTIVE, students: { some: { plan: { is: { isActive: true } } } } },
    select: {
      id: true,
      students: {
        where: { plan: { is: { isActive: true } } },
        select: { firstName: true, lastName: true, plan: { select: { name: true, basicMonthlyFee: true, discountPercent: true } } },
      },
    },
  });

  const result = await prisma.familyAccountEntry.createMany({
    data: families.map((family) => {
      const charges = family.students.flatMap((student) => student.plan ? [{
        student,
        plan: student.plan,
        amounts: calculatePlanDiscount(student.plan.basicMonthlyFee.toString(), student.plan.discountPercent.toString()),
      }] : []);
      return {
        familyId: family.id,
        type: AccountEntryType.MONTHLY_CHARGE,
        amount: charges.reduce((total, charge) => total.plus(charge.amounts.netAmount), new Prisma.Decimal(0)),
        grossAmount: charges.reduce((total, charge) => total.plus(charge.amounts.grossAmount), new Prisma.Decimal(0)),
        discountAmount: charges.reduce((total, charge) => total.plus(charge.amounts.discountAmount), new Prisma.Decimal(0)),
        description: `Cuota básica mensual · ${periodLabel} · ${charges.map(({ student, plan }) => `${student.firstName} ${student.lastName}: ${plan.name}${plan.discountPercent.isZero() ? "" : ` (${plan.discountPercent}% desc.)`}`).join("; ")}`,
        occurredAt: now,
        billingPeriod,
      };
    }),
    skipDuplicates: true,
  });

  return { billingPeriod, eligible: families.length, created: result.count, skipped: families.length - result.count };
}
