import "server-only";

import { InvitationStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateUserInvitationInput = {
  email: string;
  role: UserRole;
  invitedById: string;
};

export type UpdateUserRoleInput = {
  userId: string;
  role: UserRole;
};

export function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getPendingUserInvitationByEmail(email: string) {
  const normalizedEmail = normalizeInvitationEmail(email);

  return prisma.userInvitation.findFirst({
    where: {
      email: normalizedEmail,
      status: InvitationStatus.PENDING,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
}

export async function reconcileUserInvitationAfterSignup(email: string) {
  const normalizedEmail = normalizeInvitationEmail(email);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("user_not_found");
    }

    const invitation = await tx.userInvitation.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        role: true,
        status: true,
        acceptedAt: true,
      },
    });

    if (!invitation) {
      throw new Error("invitation_not_found");
    }

    if (invitation.status === InvitationStatus.REVOKED) {
      throw new Error("invitation_revoked");
    }

    const acceptedAt = invitation.acceptedAt ?? new Date();

    const finalRole = invitation.role;

    if (user.role !== finalRole) {
      await tx.user.update({
        where: { id: user.id },
        data: { role: finalRole },
      });
    }

    if (finalRole === UserRole.TEACHER) {
      await tx.teacherProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          displayName: user.name || user.email,
          email: user.email,
          isActive: true,
        },
        update: {
          displayName: user.name || user.email,
          email: user.email,
          isActive: true,
        },
      });
    }

    if (
      invitation.status !== InvitationStatus.ACCEPTED ||
      !invitation.acceptedAt
    ) {
      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt,
        },
      });
    }

    await tx.studentGuardian.updateMany({
      where: {
        email: normalizedEmail,
        userId: null,
      },
      data: {
        userId: user.id,
      },
    });
  });
}

export async function rollbackUserCreatedDuringFailedSignup(email: string) {
  const normalizedEmail = normalizeInvitationEmail(email);

  await prisma.user.delete({
    where: { email: normalizedEmail },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function listUserInvitations() {
  return prisma.userInvitation.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      acceptedAt: true,
      createdAt: true,
      updatedAt: true,
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createUserInvitation({
  email,
  role,
  invitedById,
}: CreateUserInvitationInput) {
  const normalizedEmail = normalizeInvitationEmail(email);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("user_already_exists");
  }

  const existingInvitation = await prisma.userInvitation.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, status: true },
  });

  if (existingInvitation?.status === InvitationStatus.ACCEPTED) {
    throw new Error("invitation_already_accepted");
  }

  if (existingInvitation) {
    return prisma.userInvitation.update({
      where: { id: existingInvitation.id },
      data: {
        role,
        status: InvitationStatus.PENDING,
        invitedById,
        acceptedAt: null,
      },
    });
  }

  return prisma.userInvitation.create({
    data: {
      email: normalizedEmail,
      role,
      invitedById,
    },
  });
}

export async function revokeUserInvitation(id: string) {
  const result = await prisma.userInvitation.updateMany({
    where: {
      id,
      status: InvitationStatus.PENDING,
    },
    data: {
      status: InvitationStatus.REVOKED,
    },
  });

  if (result.count === 0) {
    throw new Error("invitation_not_revocable");
  }
}

export async function updateUserRole({ userId, role }: UpdateUserRoleInput) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!existingUser) {
    throw new Error("user_not_found");
  }

  if (existingUser.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount <= 1) {
      throw new Error("last_admin_role_change_forbidden");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (role === UserRole.TEACHER) {
      await tx.teacherProfile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: updatedUser.name || updatedUser.email,
          email: updatedUser.email,
          isActive: true,
        },
        update: {
          displayName: updatedUser.name || updatedUser.email,
          email: updatedUser.email,
          isActive: true,
        },
      });
    }

    if (existingUser.role === UserRole.TEACHER && role !== UserRole.TEACHER) {
      await tx.teacherProfile.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    return updatedUser;
  });
}
