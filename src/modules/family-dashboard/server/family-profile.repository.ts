import "server-only";

import { prisma } from "@/lib/prisma";
import type { FamilyProfileInput } from "@/modules/family-dashboard/schemas/family-profile.schema";

export async function getFamilyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      family: { select: { streetAndNumber: true, neighborhood: true, cityAndState: true, postalCode: true } },
      familyProfile: true,
    },
  });

  return user?.family ?? user?.familyProfile ?? null;
}

export async function saveFamilyProfile(userId: string, input: FamilyProfileInput) {
  const address = {
    streetAndNumber: input.streetAndNumber || null,
    neighborhood: input.neighborhood || null,
    cityAndState: input.cityAndState || null,
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
