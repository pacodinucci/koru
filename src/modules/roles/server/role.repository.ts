import "server-only";

import { prisma } from "@/lib/prisma";

export function listRolesWithPermissions() {
  return prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true, invitations: true } },
    },
  });
}

export function listAssignableRoles() {
  return prisma.role.findMany({
    where: { isActive: true },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      baseRole: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
  });
}

