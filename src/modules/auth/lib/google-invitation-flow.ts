import { InvitationStatus, UserRole } from "@prisma/client";

import { validateInvitationFamily } from "@/modules/users/lib/user-invitation-policy";

export const GOOGLE_INVITATION_COOKIE = "koru_google_invitation";
export const GOOGLE_INVITATION_COOKIE_MAX_AGE_SECONDS = 10 * 60;

type GoogleInvitation = { email: string; role: UserRole; familyId: string | null; status: InvitationStatus; expiresAt: Date | null };

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export function getGoogleInvitationToken(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const encodedToken = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${GOOGLE_INVITATION_COOKIE}=`))?.slice(`${GOOGLE_INVITATION_COOKIE}=`.length);
  if (!encodedToken) return null;
  try { return decodeURIComponent(encodedToken); } catch { return null; }
}

export function assertGoogleInvitationCanCreateUser(email: string, invitation: GoogleInvitation) {
  if (invitation.status !== InvitationStatus.PENDING || !invitation.expiresAt || invitation.expiresAt <= new Date() || normalizeEmail(email) !== normalizeEmail(invitation.email)) throw new Error("google_invitation_not_authorized");
  validateInvitationFamily(invitation.role, invitation.familyId ?? undefined);
  return { role: invitation.role, familyId: invitation.role === UserRole.PARENT ? invitation.familyId : null };
}