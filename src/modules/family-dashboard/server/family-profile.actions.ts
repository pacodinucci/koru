"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/modules/auth/server/auth-guards";
import { familyProfileSchema, type FamilyProfileInput } from "@/modules/family-dashboard/schemas/family-profile.schema";
import { saveFamilyProfile } from "@/modules/family-dashboard/server/family-profile.repository";

export async function saveFamilyProfileAction(input: FamilyProfileInput) {
  const user = await requireRole(["PARENT"], "/family-dashboard?error=forbidden");
  const parsed = familyProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  await saveFamilyProfile(user.id, parsed.data);
  revalidatePath("/family-dashboard");
  revalidatePath("/family-dashboard/perfil");
  return { ok: true as const };
}