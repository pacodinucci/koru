import "server-only";

import { prisma } from "@/lib/prisma";
import type { TeacherFormInput } from "@/modules/teachers/schemas/teacher.schema";

export async function listTeacherProfilesForAdmin() {
  return prisma.teacherProfile.findMany({
    orderBy: [{ isActive: "desc" }, { displayName: "asc" }],
    include: {
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
        isActive: input.isActive,
        groupResponsibilities: {
          deleteMany: {},
          create: uniqueGroupIds.map((groupId) => ({ groupId })),
        },
      },
    });
  });
}
