import "server-only";

import {
  AccountEntryType,
  CashExpenseReportStatus,
  PaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdministrationPeriod = {
  from: Date;
  to: Date;
};

const asNumber = (value: { toString(): string } | null | undefined) =>
  Number(value?.toString() ?? "0");

export async function getAdministrationOverview(period: AdministrationPeriod) {
  const occurredAt = { gte: period.from, lt: period.to };

  const [
    charges,
    collected,
    voidedPayments,
    waivers,
    familyBalances,
    families,
    recentPayments,
    cashBalance,
    cashEntriesInPeriod,
    pendingReports,
    configuredBudgets,
    recentCashEntries,
  ] = await Promise.all([
    prisma.familyAccountEntry.aggregate({
      where: { type: AccountEntryType.MONTHLY_CHARGE, occurredAt },
      _sum: { amount: true },
    }),
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
    prisma.familyAccountEntry.groupBy({ by: ["familyId"], _sum: { amount: true } }),
    prisma.family.findMany({ select: { id: true, name: true } }),
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

  const familyNames = new Map(families.map((family) => [family.id, family.name]));
  const overdueFamilies = familyBalances
    .map((balance) => ({ name: familyNames.get(balance.familyId) ?? "Familia eliminada", balance: asNumber(balance._sum.amount) }))
    .filter((family) => family.balance > 0)
    .sort((left, right) => right.balance - left.balance);

  const cashPeriodMovement = cashEntriesInPeriod.reduce(
    (total, entry) => total + asNumber(entry.amount),
    0,
  );

  return {
    familyFinance: {
      charged: asNumber(charges._sum.amount),
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
