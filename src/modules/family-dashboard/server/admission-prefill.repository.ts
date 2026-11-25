import "server-only";

import { prisma } from "@/lib/prisma";
import { buildAdmissionPrefill, matchesAdmissionStudent, type AdmissionStudent } from "@/modules/family-dashboard/lib/admission-prefill";

/** Call only with the family ID returned by requireFamilyDashboardAccess. */
export async function getAdmissionPrefill(familyId: string | null, student?: AdmissionStudent) {
  if (!familyId) return null;
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { admissionInquiry: { select: { childName: true, guardianNames: true, phone: true, email: true, answers: true } } },
  });
  const origin = family?.admissionInquiry ?? null;
  if (!origin || (student && !matchesAdmissionStudent(origin, student))) return null;
  return buildAdmissionPrefill(origin);
}
