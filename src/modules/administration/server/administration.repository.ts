import "server-only";

import {
  AccountEntryType,
  CashExpenseReportStatus,
  PaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildFamilyFinancialSummary } from "@/modules/families/lib/family-financial-summary";

export type AdministrationPeriod = {
  from: Date;
  to: Date;
};

const asNumber = (value: { toString(): string } | null | undefined) =>
  Number(value?.toString() ?? "0");

export async function getAdministrationOverview(period: AdministrationPeriod) {
  const occurredAt = { gte: period.from, lt: period.to };

  const [
    collected,
    voidedPayments,
    waivers,
    families,
    recentPayments,
    cashBalance,
    cashEntriesInPeriod,
    pendingReports,
    configuredBudgets,
    recentCashEntries,
  ] = await Promise.all([
    prisma.familyPayment.aggregate({
      where: { status: PaymentStatus.REGISTERED, paidAt: occurredAt },
      _sum: { amount: true },
    }),
    prisma.familyPayment.aggregate({
      where: { status: PaymentStatus.VOIDED, voidedAt: occurredAt },
      _sum: { amount: true },
    }),
    prisma.familyAccountEntry.aggregate({
      where: { type: AccountEntryType.BALANCE_WAIVER, occurredAt },
      _sum: { amount: true },
    }),
    prisma.family.findMany({ select: { id: true, name: true,
      eventualChargeSchedules: { include: { student: { select: { firstName: true, lastName: true, familyId: true } }, accountEntries: { select: { installmentNumber: true } } } },
      accountEntries: { include: { allocationsAsCredit: true, payment: { select: { status: true } } } },
    } }),
    prisma.familyPayment.findMany({
      where: { paidAt: occurredAt },
      orderBy: { paidAt: "desc" },
      take: 8,
      select: { id: true, amount: true, method: true, status: true, paidAt: true, family: { select: { name: true } } },
    }),
    prisma.cashFundEntry.aggregate({ where: { groupId: { not: null } }, _sum: { amount: true } }),
    prisma.cashFundEntry.findMany({
      where: { groupId: { not: null }, occurredAt },
      select: { amount: true },
    }),
    prisma.cashExpenseReport.aggregate({
      where: { groupId: { not: null }, status: CashExpenseReportStatus.PENDING },
      _count: { id: true },
      _sum: { requestedAmount: true },
    }),
    prisma.cashFundGroupBudget.count(),
    prisma.cashFundEntry.findMany({
      where: { groupId: { not: null } },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: { id: true, amount: true, description: true, occurredAt: true, type: true, group: { select: { name: true } } },
    }),
  ]);

  const summaries = families.map(family => ({ family, summary: buildFamilyFinancialSummary(family.accountEntries, family.eventualChargeSchedules) }));
  const charged = summaries.reduce((total, { summary }) => total + [...summary.entries, ...summary.projectedCharges.map(entry => ({ ...entry, occurredAt: new Date(entry.occurredAt) }))]
    .filter(entry => entry.type === AccountEntryType.MONTHLY_CHARGE && entry.occurredAt >= period.from && entry.occurredAt < period.to && entry.occurredAt <= new Date())
    .reduce((sum, entry) => sum + asNumber(entry.amount), 0), 0);
  const overdueFamilies = summaries
    .map(({ family, summary }) => ({ name: family.name, balance: Number(summary.balance) }))
    .filter((family) => family.balance > 0)
    .sort((left, right) => right.balance - left.balance);

  const cashPeriodMovement = cashEntriesInPeriod.reduce(
    (total, entry) => total + asNumber(entry.amount),
    0,
  );

  return {
    familyFinance: {
      charged,
      collected: asNumber(collected._sum.amount),
      voided: asNumber(voidedPayments._sum.amount),
      waived: Math.abs(asNumber(waivers._sum.amount)),
      outstanding: overdueFamilies.reduce((total, family) => total + family.balance, 0),
      overdueFamilies: overdueFamilies.length,
      largestDebts: overdueFamilies.slice(0, 5),
      recentPayments: recentPayments.map((payment) => ({
        ...payment,
        amount: asNumber(payment.amount),
      })),
    },
    cashFund: {
      balance: asNumber(cashBalance._sum.amount),
      periodMovement: cashPeriodMovement,
      pendingReports: pendingReports._count.id,
      pendingAmount: asNumber(pendingReports._sum.requestedAmount),
      configuredBudgets,
      recentEntries: recentCashEntries.map((entry) => ({ ...entry, amount: asNumber(entry.amount) })),
    },
  };
}
