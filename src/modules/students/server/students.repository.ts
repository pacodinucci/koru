import "server-only";

import { UserRole, type InvitationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  studentGroupWhereForViewer,
  studentWhereForViewer,
  type StudentViewer,
} from "@/modules/students/lib/student-read-scope";
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

export async function listStudentGroups(viewer?: StudentViewer) {
  return prisma.studentGroup.findMany({
    where: viewer ? studentGroupWhereForViewer(viewer) : { isActive: true },
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

export async function listStudentsForViewer(viewer: StudentViewer) {
  return prisma.student.findMany({
    where: studentWhereForViewer(viewer),
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      admissionQuestionnaire: { select: { submittedAt: true, updatedAt: true } },
      group: {
        select: {
          id: true,
          name: true,
          ageRange: true,
          teacherResponsibilities: {
            where: {
              teacher: {
                is: {
                  isActive: true,
                  user: {
                    is: { role: { in: [UserRole.TEACHER, UserRole.ADMIN_TEACHER] } },
                  },
                },
              },
            },
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

export async function getStudentRecordForViewer(studentId: string, viewer: StudentViewer) {
  return prisma.student.findFirst({
    where: {
      id: studentId,
      ...studentWhereForViewer(viewer),
    },
    include: {
      admissionQuestionnaire: { select: { answers: true, submittedAt: true, updatedAt: true } },
      group: { select: { id: true, name: true, ageRange: true } },
      family: { select: { streetAndNumber: true, neighborhood: true, cityAndState: true, postalCode: true } },
      medicalProfile: true,
      responsibles: { orderBy: { priority: "asc" } },
      guardians: {
        orderBy: [{ isPrimary: "desc" }, { email: "asc" }],
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function listStudentReportsForViewer(studentId: string, viewer: StudentViewer) {
  return prisma.studentReport.findMany({
    where: {
      student: { id: studentId, ...studentWhereForViewer(viewer) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      fileName: true,
      visibleToFamily: true,
      createdAt: true,
      teacher: { select: { displayName: true, userId: true } },
    },
  });
}
export async function updateStudentRecordStatus(
  studentId: string,
  recordStatus: "SUBMITTED" | "REVIEWED" | "NEEDS_CHANGES",
  viewer: StudentViewer,
) {
  return prisma.student.updateMany({
    where: {
      id: studentId,
      ...studentWhereForViewer(viewer),
    },
    data: { recordStatus },
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
