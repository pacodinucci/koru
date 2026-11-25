"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/server/auth-guards";

export async function listCandidateAdmissionsAction() {
  await requirePermission("families.manage");
  await requirePermission("contacts.view");
  await requirePermission("contacts.manage");

  return prisma.admissionInquiry.findMany({
    where: { family: { is: null } },
    orderBy: [{ submittedAt: "desc" }, { id: "asc" }],
    select: { id: true, childName: true, guardianNames: true, email: true },
  });
}
