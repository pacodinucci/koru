import "server-only";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/modules/auth/permissions/permission-catalog";
import { requirePermission } from "@/modules/auth/server/auth-guards";

export function requireOperationsOperator(
  permission: "cash-fund.operate" | "inventory.operate",
) {
  return requirePermission(permission);
}

export function requireOperationsSuperAdmin(
  permission: "cash-fund.configure" | "inventory.configure",
) {
  return requirePermission(permission);
}

export async function requireOperationsTeacher(
  permission: "cash-fund.view" | "inventory.view",
) {
  const user = await requirePermission(permission);
  if (user.role !== "TEACHER" && user.role !== "ADMIN_TEACHER") {
    redirect("/dashboard?error=forbidden");
  }

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, isActive: true },
  });

  if (!teacher || !teacher.isActive) {
    redirect("/dashboard?error=forbidden");
  }

  return { user, teacher };
}

export type OperationsPermission = PermissionKey;
