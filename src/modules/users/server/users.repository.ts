import "server-only";

import { InvitationStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isTeacherRole } from "@/modules/auth/roles";
import { createInvitationToken, hashInvitationToken } from "@/modules/users/server/user-invitation-token";
import { validateInvitationFamily } from "@/modules/users/lib/user-invitation-policy";

export type CreateUserInvitationInput = { email: string; role: UserRole; familyId?: string; invitedById: string };
export type UpdateUserRoleInput = { userId: string; role: UserRole };
export type DeleteUserForAdminInput = { userId: string; adminId: string };

export function normalizeInvitationEmail(email: string) { return email.trim().toLowerCase(); }

export async function getPendingUserInvitationByEmail(email: string) {
  return prisma.userInvitation.findFirst({ where: { email: normalizeInvitationEmail(email), status: InvitationStatus.PENDING }, select: { id: true, email: true, role: true, familyId: true, status: true, tokenHash: true, expiresAt: true } });
}

export async function requirePendingUserInvitationByEmail(email: string, token: string) {
  const invitation = await getPendingUserInvitationByEmail(email);
  if (!invitation || !invitation.tokenHash || !invitation.expiresAt || invitation.expiresAt <= new Date() || invitation.tokenHash !== hashInvitationToken(token)) throw new Error("sign_up_invitation_required");
  return invitation;
}

export async function reconcileUserInvitationAfterSignup(email: string, token: string) {
  const normalizedEmail = normalizeInvitationEmail(email);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, name: true, email: true } });
    if (!user) throw new Error("user_not_found");
    const invitation = await tx.userInvitation.findUnique({ where: { email: normalizedEmail }, select: { id: true, role: true, familyId: true, status: true, tokenHash: true, expiresAt: true, acceptedAt: true } });
    if (!invitation) throw new Error("invitation_not_available");
    if (invitation.status !== InvitationStatus.PENDING || !invitation.tokenHash || !invitation.expiresAt || invitation.expiresAt <= new Date() || invitation.tokenHash !== hashInvitationToken(token)) throw new Error("invitation_not_available");
    const finalRole = invitation.role;
    await tx.user.update({ where: { id: user.id }, data: { role: finalRole, familyId: finalRole === UserRole.PARENT ? invitation.familyId : null } });
    if (isTeacherRole(finalRole)) await tx.teacherProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, displayName: user.name || user.email, email: user.email, isActive: true }, update: { displayName: user.name || user.email, email: user.email, isActive: true } });
    await tx.userInvitation.update({ where: { id: invitation.id }, data: { status: InvitationStatus.ACCEPTED, acceptedAt: invitation.acceptedAt ?? new Date(), tokenHash: null } });
    await tx.studentGuardian.updateMany({ where: { email: normalizedEmail, userId: null }, data: { userId: user.id } });
  });
}

export async function rollbackUserCreatedDuringFailedSignup(email: string) { await prisma.user.delete({ where: { email: normalizeInvitationEmail(email) } }); }

export async function listUsers() { return prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true, updatedAt: true } }); }

export async function listFamiliesForInvitation() { return prisma.family.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }); }

export async function listUserInvitations() { return prisma.userInvitation.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, email: true, role: true, status: true, acceptedAt: true, expiresAt: true, lastSentAt: true, createdAt: true, updatedAt: true, family: { select: { id: true, name: true } }, invitedBy: { select: { id: true, name: true, email: true } } } }); }

async function requireFamilyForInvitation(familyId?: string) { if (!familyId) return; const family = await prisma.family.findUnique({ where: { id: familyId }, select: { id: true } }); if (!family) throw new Error("family_not_found"); }

export async function createUserInvitation({ email, role, familyId, invitedById }: CreateUserInvitationInput) {
  const normalizedEmail = normalizeInvitationEmail(email); validateInvitationFamily(role, familyId); await requireFamilyForInvitation(familyId);
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
  if (existingUser) throw new Error("user_already_exists");
  const existing = await prisma.userInvitation.findUnique({ where: { email: normalizedEmail }, select: { id: true, status: true } });
  // Si el usuario ya no existe, se reutiliza la invitación y se emite un token nuevo.
  const { token, tokenHash, expiresAt } = createInvitationToken();
  const data = { role, familyId: role === UserRole.PARENT ? familyId : null, status: InvitationStatus.PENDING, tokenHash, expiresAt, lastSentAt: new Date(), invitedById, acceptedAt: null };
  const invitation = existing ? await prisma.userInvitation.update({ where: { id: existing.id }, data, include: { family: { select: { name: true } } } }) : await prisma.userInvitation.create({ data: { email: normalizedEmail, ...data }, include: { family: { select: { name: true } } } });
  return { invitation, token };
}

export async function resendUserInvitation(id: string, invitedById: string) {
  const existing = await prisma.userInvitation.findUnique({ where: { id }, select: { email: true, role: true, familyId: true, status: true } });
  if (!existing || existing.status !== InvitationStatus.PENDING) throw new Error("invitation_not_resendable");
  return createUserInvitation({ ...existing, familyId: existing.familyId ?? undefined, invitedById });
}

export async function revokeUserInvitation(id: string) { const result = await prisma.userInvitation.updateMany({ where: { id, status: InvitationStatus.PENDING }, data: { status: InvitationStatus.REVOKED, tokenHash: null, expiresAt: new Date() } }); if (!result.count) throw new Error("invitation_not_revocable"); }

export async function updateUserRole({ userId, role }: UpdateUserRoleInput) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } }); if (!existingUser) throw new Error("user_not_found");
  if (existingUser.role === "ADMIN" && role !== "ADMIN" && await prisma.user.count({ where: { role: "ADMIN" } }) <= 1) throw new Error("last_admin_role_change_forbidden");
  return prisma.$transaction(async (tx) => { const updatedUser = await tx.user.update({ where: { id: userId }, data: { role }, select: { id: true, name: true, email: true, role: true } }); if (isTeacherRole(role)) await tx.teacherProfile.upsert({ where: { userId }, create: { userId, displayName: updatedUser.name || updatedUser.email, email: updatedUser.email, isActive: true }, update: { displayName: updatedUser.name || updatedUser.email, email: updatedUser.email, isActive: true } }); if (isTeacherRole(existingUser.role) && !isTeacherRole(role)) await tx.teacherProfile.updateMany({ where: { userId }, data: { isActive: false } }); return updatedUser; });
}

export async function deleteUserForAdmin({ userId, adminId }: DeleteUserForAdminInput) {
  if (userId === adminId) throw new Error("self_delete_forbidden"); const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }); if (!existingUser) throw new Error("user_not_found"); if (existingUser.role === UserRole.ADMIN && await prisma.user.count({ where: { role: UserRole.ADMIN } }) <= 1) throw new Error("last_admin_delete_forbidden"); if (await prisma.calendarEvent.count({ where: { createdById: userId } }) > 0) throw new Error("user_has_created_calendar_events"); return prisma.user.delete({ where: { id: userId }, select: { id: true } });
}


