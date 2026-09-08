import "server-only";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/modules/auth/server/auth-guards";

const operatorRoles = new Set(["ADMIN", "ADMIN_OPERATOR", "SUPERADMIN"]);

export async function requireOperationsOperator() {
  const user = await requireUser();

  if (!operatorRoles.has(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  return user;
}

export async function requireOperationsSuperAdmin() {
  const user = await requireUser();

  if (user.role !== "SUPERADMIN") {
    redirect("/dashboard?error=forbidden");
  }

  return user;
}

export async function requireOperationsTeacher() {
  const user = await requireUser();
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, isActive: true },
  });

  if (!teacher || !teacher.isActive) {
    redirect("/dashboard?error=forbidden");
  }

  return { user, teacher };
}
