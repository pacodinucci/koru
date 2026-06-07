import "server-only";

import { UserRole, type InvitationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { StudentFormInput } from "@/modules/students/schemas/student.schema";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseBirthDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_birth_date");
  }

  return date;
}

export async function listStudentGroups() {
  return prisma.studentGroup.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      ageRange: true,
    },
  });
}

export async function listFamilyUsersForSelect() {
  return prisma.user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function listStudentsForAdmin() {
  return prisma.student.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      group: {
        select: {
          id: true,
          name: true,
          ageRange: true,
          teacherResponsibilities: {
            orderBy: { teacher: { displayName: "asc" } },
            include: {
              teacher: { select: { id: true, displayName: true, email: true } },
            },
          },
        },
      },
      guardians: {
        orderBy: [{ isPrimary: "desc" }, { email: "asc" }],
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function saveStudentForAdmin(
  input: StudentFormInput,
  invitedById: string,
) {
  const normalizedGuardians = input.guardians.map((guardian) => ({
    ...guardian,
    email: normalizeEmail(guardian.email),
  }));
  const uniqueGuardians = Array.from(
    new Map(normalizedGuardians.map((guardian) => [guardian.email, guardian])).values(),
  );

  if (uniqueGuardians.length === 0) {
    throw new Error("missing_guardians");
  }

  const birthDate = parseBirthDate(input.birthDate);
  const notes = input.notes || null;

  return prisma.$transaction(async (tx) => {
    const group = await tx.studentGroup.findUnique({
      where: { id: input.groupId },
      select: { id: true },
    });

    if (!group) {
      throw new Error("group_not_found");
    }

    const users = await tx.user.findMany({
      where: { email: { in: uniqueGuardians.map((guardian) => guardian.email) } },
      select: { id: true, email: true, role: true },
    });
    const userByEmail = new Map(users.map((user) => [user.email, user]));

    for (const guardian of uniqueGuardians) {
      const existingUser = userByEmail.get(guardian.email);

      if (existingUser) {
        continue;
      }

      const existingInvitation = await tx.userInvitation.findUnique({
        where: { email: guardian.email },
        select: { id: true, status: true },
      });

      if (!existingInvitation) {
        await tx.userInvitation.create({
          data: {
            email: guardian.email,
            role: UserRole.PARENT,
            invitedById,
          },
        });
        continue;
      }

      if ((existingInvitation.status as InvitationStatus) !== "ACCEPTED") {
        await tx.userInvitation.update({
          where: { id: existingInvitation.id },
          data: {
            role: UserRole.PARENT,
            status: "PENDING",
            acceptedAt: null,
            invitedById,
          },
        });
      }
    }

    const guardianCreates = uniqueGuardians.map((guardian) => ({
      email: guardian.email,
      relationship: guardian.relationship,
      isPrimary: guardian.isPrimary,
      canPickup: guardian.canPickup,
      emergencyContact: guardian.emergencyContact,
      userId: userByEmail.get(guardian.email)?.id ?? null,
    }));

    if (input.id) {
      return tx.student.update({
        where: { id: input.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          birthDate,
          groupId: input.groupId,
          status: input.status,
          notes,
          guardians: {
            deleteMany: {},
            create: guardianCreates,
          },
        },
      });
    }

    return tx.student.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate,
        groupId: input.groupId,
        status: input.status,
        notes,
        guardians: {
          create: guardianCreates,
        },
      },
    });
  });
}

