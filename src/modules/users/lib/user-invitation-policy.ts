import { InvitationStatus, UserRole } from "@prisma/client";

type SignupInvitation = {
  status: InvitationStatus;
  tokenHash: string | null;
  expiresAt: Date | null;
};

export function hasValidSignupInvitationToken(
  invitation: SignupInvitation | null,
  tokenHash: string,
  now = new Date(),
): invitation is SignupInvitation & { tokenHash: string; expiresAt: Date } {
  return Boolean(
    invitation &&
    (invitation.status === InvitationStatus.PENDING || invitation.status === InvitationStatus.ACCEPTED) &&
    invitation.tokenHash === tokenHash &&
    invitation.expiresAt &&
    invitation.expiresAt > now,
  );
}

export function validateInvitationFamily(role: UserRole, familyId?: string) {
  if (role === UserRole.PARENT && !familyId) throw new Error("family_required_for_parent");
  if (role !== UserRole.PARENT && familyId) throw new Error("family_only_for_parent");
}
