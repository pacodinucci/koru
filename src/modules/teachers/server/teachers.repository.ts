import "server-only";

import { prisma } from "@/lib/prisma";
import type { TeacherFormInput } from "@/modules/teachers/schemas/teacher.schema";
export async function listTeacherHomeData(userId: string) {
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId },
    select: { id: true, isActive: true },
  });

  if (!teacher?.isActive) return { groups: [], students: [] };

  const groupWhere = {
    isActive: true,
    teacherResponsibilities: { some: { teacherId: teacher.id } },
  };

  const [groups, students] = await Promise.all([
    prisma.studentGroup.findMany({
      where: groupWhere,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        ageRange: true,
        _count: { select: { students: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.student.findMany({
      where: { status: "ACTIVE", group: groupWhere },
      orderBy: [{ group: { sortOrder: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        group: { select: { name: true } },
      },
    }),
  ]);

  return { groups, students };
}

export async function listTeacherProfilesForAdmin() {
  return prisma.teacherProfile.findMany({
    where: {
      isActive: true,
      user: { is: { role: { in: ["TEACHER", "ADMIN_TEACHER"] } } },
    },
    orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
    include: {
      position: true, organizationGroup: true, pendingOrganizationGroup: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      groupResponsibilities: {
        orderBy: { group: { sortOrder: "asc" } },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              ageRange: true,
              students: {
                where: { status: "ACTIVE" },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function updateTeacherProfileForAdmin(input: TeacherFormInput) {
  const uniqueGroupIds = Array.from(new Set(input.groupIds));

  return prisma.$transaction(async (tx) => {
    if (uniqueGroupIds.length > 0) {
      const groupCount = await tx.studentGroup.count({
        where: { id: { in: uniqueGroupIds }, isActive: true },
      });

      if (groupCount !== uniqueGroupIds.length) {
        throw new Error("group_not_found");
      }
    }

    return tx.teacherProfile.update({
      where: { id: input.id },
      data: {
        phone: input.phone || null,
        bio: input.bio || null,
        position: input.position || null,
        organizationGroup: input.organizationGroup || null,
        pendingOrganizationGroup: input.organizationGroup ? null : undefined,
        isActive: input.isActive,
        groupResponsibilities: {
          deleteMany: {},
          create: uniqueGroupIds.map((groupId) => ({ groupId })),
        },
      },
    });
  });
}
