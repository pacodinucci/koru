import "server-only";

import { prisma } from "@/lib/prisma";

export async function getCashFundGroupBalance(groupId: string) {
  const result = await prisma.cashFundEntry.aggregate({ where: { groupId }, _sum: { amount: true } });
  return Number(result._sum.amount?.toString() ?? 0);
}

export async function listCashFundGroupsWithBudget() {
  return prisma.studentGroup.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      cashFundBudget: true,
      teacherResponsibilities: { where: { teacher: { is: { isActive: true, user: { is: { role: { in: ["TEACHER", "ADMIN_TEACHER"] } } } } } }, include: { teacher: { select: { id: true, displayName: true } } } },
      cashFundEntries: { where: { groupId: { not: null } }, select: { amount: true, type: true } },
      cashExpenseReports: { where: { status: "PENDING", groupId: { not: null } }, select: { requestedAmount: true } },
    },
  });
}

export async function listTeacherCashFundGroups(teacherId: string) {
  return prisma.studentGroup.findMany({
    where: { isActive: true, teacherResponsibilities: { some: { teacherId } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { cashFundBudget: true, cashFundEntries: { where: { groupId: { not: null } }, select: { amount: true } } },
  });
}

export async function listTeacherCashExpenseReports(teacherId: string) {
  return prisma.cashExpenseReport.findMany({ where: { teacherId, groupId: { not: null } }, orderBy: { submittedAt: "desc" }, include: { group: true, category: true, attachments: true } });
}

export async function listCashFundReportsForReview() {
  return prisma.cashExpenseReport.findMany({ where: { status: "PENDING", groupId: { not: null } }, orderBy: { submittedAt: "asc" }, include: { teacher: true, group: true, category: true, attachments: true } });
}

export async function listCashFundConfiguration() {
  return prisma.cashFundSettings.findUnique({ where: { id: "default" } });
}

export async function listCashFundCategories() {
  return prisma.cashFundCategory.findMany({ orderBy: { name: "asc" } });
}

export async function listCashFundEntriesForAdmin(limit = 100) {
  const entries = await prisma.cashFundEntry.findMany({ where: { groupId: { not: null } }, take: limit, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], include: { group: true, report: { include: { category: true } } } });
  const reversedIds = entries.length ? await prisma.cashFundEntry.findMany({ where: { reversesId: { in: entries.map((entry) => entry.id) } }, select: { reversesId: true } }) : [];
  const reversed = new Set(reversedIds.flatMap((entry) => entry.reversesId ? [entry.reversesId] : []));
  return entries.map((entry) => ({ ...entry, isReversed: reversed.has(entry.id) }));
}
