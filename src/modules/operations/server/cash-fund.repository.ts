import "server-only";

import { prisma } from "@/lib/prisma";

export async function getTeacherCashFundBalance(teacherId: string) {
  const result = await prisma.cashFundEntry.aggregate({
    where: { teacherId },
    _sum: { amount: true },
  });

  return Number(result._sum.amount?.toString() ?? 0);
}

export async function listTeacherCashFundEntries(teacherId: string) {
  return prisma.cashFundEntry.findMany({
    where: { teacherId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    include: { report: { include: { category: true } } },
  });
}

export async function listCashFundReportsForReview() {
  return prisma.cashExpenseReport.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: { teacher: true, category: true, attachments: true },
  });
}

export async function listCashFundConfiguration() {
  return prisma.cashFundSettings.findUnique({ where: { id: "default" } });
}

export async function listTeachersWithCashFundBudget() {
  return prisma.teacherProfile.findMany({ where: { isActive: true }, orderBy: { displayName: "asc" }, include: { cashFundBudget: true } });
}

export async function listTeacherCashExpenseReports(teacherId: string) {
  return prisma.cashExpenseReport.findMany({ where: { teacherId }, orderBy: { submittedAt: "desc" }, include: { category: true, attachments: true } });
}

export async function listCashFundCategories() {
  return prisma.cashFundCategory.findMany({ orderBy: { name: "asc" } });
}

export async function listCashFundEntriesForAdmin(limit = 100) {
  const entries = await prisma.cashFundEntry.findMany({ take: limit, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], include: { teacher: true, report: { include: { category: true } } } });
  const reversedIds = entries.length ? await prisma.cashFundEntry.findMany({ where: { reversesId: { in: entries.map((entry) => entry.id) } }, select: { reversesId: true } }) : [];
  const reversed = new Set(reversedIds.flatMap((entry) => entry.reversesId ? [entry.reversesId] : []));
  return entries.map((entry) => ({ ...entry, isReversed: reversed.has(entry.id) }));
}
