import "server-only";
import { prisma } from "@/lib/prisma";

export function getFamilyFinancialRecord(familyId: string) {
  return prisma.family.findUniqueOrThrow({ where: { id: familyId }, include: { plan: true, users: { select: { id: true, name: true, email: true } }, students: { include: { group: { select: { id: true, name: true } }, guardians: { include: { user: { select: { id: true, name: true } } } }, responsibles: true } }, accountEntries: { orderBy: { occurredAt: "desc" }, include: { payment: { include: { receipt: { include: { deliveries: true } } } } } } } });
}
