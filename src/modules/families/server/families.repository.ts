import "server-only";

import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function listFamiliesForAdmin() {
  return Promise.all([
    prisma.family.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        plan: { select: { id: true, name: true, monthlyFee: true, isActive: true } },
        _count: { select: { users: true, students: true } },
      },
    }),
    prisma.familyAccountEntry.groupBy({
      by: ["familyId"],
      _sum: { amount: true },
    }),
  ]).then(([families, balances]) => {
    const balancesByFamilyId = new Map(
      balances.map((balance) => [
        balance.familyId,
        balance._sum.amount?.toString() ?? "0",
      ]),
    );

    return families.map((family) => ({
      ...family,
      balance: balancesByFamilyId.get(family.id) ?? "0",
    }));
  });
}

export function getFamilyDetailForAdmin(familyId: string) {
  return prisma.family.findUnique({
    where: { id: familyId },
    include: {
      accountEntries: {
        orderBy: { occurredAt: "desc" },
        include: {
          payment: {
            select: {
              id: true,
              method: true,
              reference: true,
              status: true,
              receipt: {
                select: { id: true, status: true, pdfUrl: true, number: true },
              },
            },
          },
        },
      },
    },
  });
}

export function listPlansForAdmin() {
  return prisma.plan.findMany({ orderBy: { name: "asc" } });
}

export function listFamilyMembersForAssignment() {
  return Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.PARENT },
      select: { id: true, name: true, email: true, familyId: true },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      select: { id: true, firstName: true, lastName: true, familyId: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);
}