import "server-only";

import { prisma } from "@/lib/prisma";

export function listBillingRubricsForAdmin() {
  return prisma.billingRubric.findMany({ orderBy: { name: "asc" } });
}

export function listStudentRubricAssignments(familyId: string) {
  return prisma.eventualChargeSchedule.findMany({
    where: { familyId, rubricId: { not: null } },
    orderBy: [{ startPeriod: "asc" }, { createdAt: "asc" }],
  });
}
