import "server-only";

import { prisma } from "@/lib/prisma";
import type { AdmissionOrigin } from "@/modules/families/lib/candidate-family";

export type AdmissionOriginLookup =
  | { status: "available"; origin: AdmissionOrigin }
  | { status: "missing" }
  | { status: "already-linked" };

/**
 * Loads the canonical admission identity on the server.
 *
 * The submitted form values are never the source of the candidate family email or
 * name, and a second family can never be attached to the same admission.
 */
export async function loadAdmissionOrigin(admissionInquiryId: string): Promise<AdmissionOriginLookup> {
  const admission = await prisma.admissionInquiry.findUnique({
    where: { id: admissionInquiryId },
    select: { id: true, guardianNames: true, childName: true, email: true, family: { select: { id: true } } },
  });
  if (!admission) return { status: "missing" };
  if (admission.family) return { status: "already-linked" };
  return {
    status: "available",
    origin: {
      id: admission.id,
      guardianNames: admission.guardianNames,
      childName: admission.childName,
      email: admission.email,
    },
  };
}
