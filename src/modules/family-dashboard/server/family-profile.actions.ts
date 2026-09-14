"use server";

import { revalidatePath } from "next/cache";

import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { familyProfileSchema, type FamilyProfileInput } from "@/modules/family-dashboard/schemas/family-profile.schema";
import { saveFamilyProfile } from "@/modules/family-dashboard/server/family-profile.repository";

export async function saveFamilyProfileAction(input: FamilyProfileInput) {
  const user = (await requireFamilyDashboardAccess("/family-dashboard?error=forbidden")).familyUser;
  const parsed = familyProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  await saveFamilyProfile(user.id, parsed.data);
  revalidatePath("/family-dashboard");
  revalidatePath("/family-dashboard/perfil");
  return { ok: true as const };
}
