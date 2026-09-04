import { UserRole } from "@prisma/client";

export function validateInvitationFamily(role: UserRole, familyId?: string) {
  if (role === UserRole.PARENT && !familyId) throw new Error("family_required_for_parent");
  if (role !== UserRole.PARENT && familyId) throw new Error("family_only_for_parent");
}