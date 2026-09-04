import "server-only";

import { prisma } from "@/lib/prisma";
import { calculateFamilyBalance } from "@/modules/families/lib/family-account-policy";

export async function getFamilyAccountForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      family: {
        select: {
          id: true,
          name: true,
          plan: { select: { name: true, monthlyFee: true } },
          accountEntries: {
            orderBy: { occurredAt: "desc" },
            include: {
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

  const balance = calculateFamilyBalance(user.family.accountEntries);
  return { ...user.family, balance };
}