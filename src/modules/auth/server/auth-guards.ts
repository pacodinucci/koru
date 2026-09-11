import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  legacyRolePermissions,
  type PermissionKey,
} from "@/modules/auth/permissions/permission-catalog";
import {
  isAdminRole,
  type AppUserRole,
} from "@/modules/auth/roles";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  familyId: string | null;
  accessRoleId: string | null;
  accessRoleName: string | null;
  accessRoleKey: string | null;
  permissionKeys: PermissionKey[];
};

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession(redirectTo = "/sign-in") {
  const session = await getSession();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getSession();
  const email = normalizeEmail(session?.user?.email);

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      familyId: true,
      accessRoleId: true,
      accessRole: {
        select: {
          name: true,
          key: true,
          isActive: true,
          permissions: {
            select: { permission: { select: { key: true } } },
          },
        },
      },
    },
  });

  if (!user) return null;

  const permissionKeys =
    user.accessRole?.isActive
      ? user.accessRole.permissions.map(({ permission }) => permission.key as PermissionKey)
      : user.accessRoleId
        ? []
        : [...legacyRolePermissions[user.role]];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    familyId: user.familyId,
    accessRoleId: user.accessRoleId,
    accessRoleName: user.accessRole?.name ?? null,
    accessRoleKey: user.accessRole?.key ?? null,
    permissionKeys,
  };
}

export async function requireUser(redirectTo = "/sign-in") {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

export async function getAdminUser() {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  return user;
}

/** @deprecated Prefer requirePermission with the capability owned by the action. */
export async function requireAdmin(
  forbiddenRedirectTo = "/dashboard?error=forbidden",
) {
  const user = await requireUser();

  if (!isAdminRole(user.role)) {
    redirect(forbiddenRedirectTo);
  }

  return user;
}

export async function requirePermission(
  permission: PermissionKey,
  forbiddenRedirectTo = "/dashboard?error=forbidden",
) {
  const user = await requireUser();

  if (!user.permissionKeys.includes(permission)) {
    redirect(forbiddenRedirectTo);
  }

  return user;
}

export async function requireAnyPermission(
  permissions: PermissionKey[],
  forbiddenRedirectTo = "/dashboard?error=forbidden",
) {
  const user = await requireUser();

  if (!permissions.some((permission) => user.permissionKeys.includes(permission))) {
    redirect(forbiddenRedirectTo);
  }

  return user;
}

export async function requireRole(
  roles: AuthenticatedUser["role"][],
  forbiddenRedirectTo = "/dashboard?error=forbidden",
) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect(forbiddenRedirectTo);
  }

  return user;
}

export async function requireDashboardUser(
  forbiddenRedirectTo = "/dashboard?error=forbidden",
) {
  return requirePermission("dashboard.access", forbiddenRedirectTo);
}
