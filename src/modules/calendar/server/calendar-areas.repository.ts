import "server-only";

import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Keep this allowlist explicit: future roles must not silently inherit area access.
export const calendarInternalRoles: UserRole[] = [
  UserRole.ADMIN,
  UserRole.ADMIN_OPERATOR,
  UserRole.ADMIN_TEACHER,
  UserRole.SUPERADMIN,
  UserRole.TEACHER,
  UserRole.PSYCHOPEDAGOGY_TEACHER,
];

// Access administration metadata only; event contents are never included here.
export async function listCalendarAreas() {
  return prisma.calendarArea.findMany({
    orderBy: { name: "asc" },
    include: {
      grants: {
        orderBy: { userId: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });
}

export async function listCalendarAreaOptions() {
  return prisma.calendarArea.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export async function getCalendarAreaGrants(userId: string) {
  return prisma.calendarAreaGrant.findMany({
    where: { userId },
    orderBy: { areaId: "asc" },
    select: { areaId: true, canEdit: true },
  });
}

// Callers must authorize calendar.permissions.manage before mutating grants.
export async function setCalendarAreaGrant({
  areaId,
  userId,
  canEdit,
  enabled,
}: {
  areaId: string;
  userId: string;
  canEdit: boolean;
  enabled: boolean;
}) {
  const area = await prisma.calendarArea.findUnique({
    where: { id: areaId },
    select: { id: true },
  });
  if (!area) throw new Error("calendar_area_not_found");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || !calendarInternalRoles.includes(user.role)) {
    throw new Error("calendar_area_user_not_internal");
  }

  if (!enabled) {
    return prisma.calendarAreaGrant.deleteMany({ where: { areaId, userId } });
  }

  return prisma.calendarAreaGrant.upsert({
    where: { areaId_userId: { areaId, userId } },
    create: { areaId, userId, canEdit },
    update: { canEdit },
  });
}
