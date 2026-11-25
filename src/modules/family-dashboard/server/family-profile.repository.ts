import "server-only";

import { prisma } from "@/lib/prisma";
import { getAdmissionPrefill } from "@/modules/family-dashboard/server/admission-prefill.repository";
import type { FamilyProfileInput } from "@/modules/family-dashboard/schemas/family-profile.schema";

export async function getFamilyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      familyId: true,
      family: { select: { streetAndNumber: true, neighborhood: true, cityAndState: true, postalCode: true } },
      familyProfile: true,
    },
  });

  const profile = user?.family ?? user?.familyProfile ?? null;
  const prefill = await getAdmissionPrefill(user?.familyId ?? null);
  return profile ? { ...profile, cityAndState: profile.cityAndState ?? prefill?.identity.cityAndState ?? null } : null;
}

export async function saveFamilyProfile(userId: string, input: FamilyProfileInput) {
  const address = {
    streetAndNumber: input.streetAndNumber || null,
    neighborhood: input.neighborhood || null,
    // null means not supplied yet; an explicit blank must suppress admission defaults.
    cityAndState: input.cityAndState,
    postalCode: input.postalCode || null,
  };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { familyId: true } });

  if (user?.familyId) {
    return prisma.family.update({ where: { id: user.familyId }, data: address });
  }

  return prisma.familyProfile.upsert({
    where: { userId },
    create: { userId, ...address },
    update: address,
  });
}
