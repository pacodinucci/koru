import "server-only";
import { prisma } from "@/lib/prisma";

export function getFamilyFinancialRecord(familyId: string) {
  return prisma.family.findUniqueOrThrow({ where: { id: familyId }, include: { eventualChargeSchedules: { include: { student: { select: { firstName: true, lastName: true, familyId: true } }, accountEntries: { select: { installmentNumber: true } } } }, users: { select: { id: true, name: true, email: true } }, students: { include: { plan: { include: { eventualChargeItems: { where: { isActive: true }, orderBy: { name: "asc" } } } }, group: { select: { id: true, name: true } }, guardians: { include: { user: { select: { id: true, name: true } } } }, responsibles: true } }, accountEntries: { orderBy: { occurredAt: "desc" }, include: { allocationsAsCredit: true, payment: { include: { receipt: { include: { deliveries: true } } } } } } } });
}
