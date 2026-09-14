import "server-only";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUser,
  type AuthenticatedUser,
} from "@/modules/auth/server/auth-guards";
import {
  legacyRolePermissions,
  type PermissionKey,
} from "@/modules/auth/permissions/permission-catalog";

const DEVELOPMENT_VIEWER_EMAIL = "franciscoldinucci@gmail.com";
const DEVELOPMENT_FAMILY_EMAIL = "nodemelon@gmail.com";

function isDevelopmentFamilyPreview(viewer: AuthenticatedUser) {
  return process.env.NODE_ENV !== "production"
    && viewer.email.trim().toLowerCase() === DEVELOPMENT_VIEWER_EMAIL;
}

async function getUserByEmail(email: string): Promise<AuthenticatedUser | null> {
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
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  });

  if (!user) return null;

  const permissionKeys = user.accessRole?.isActive
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

/** Resolves the interface viewer and the family identity used by the dashboard. */
export async function requireFamilyDashboardAccess(
  forbiddenRedirectTo = "/dashboard?error=forbidden",
) {
  const viewer = await getAuthenticatedUser();
  if (!viewer) redirect("/sign-in");

  if (isDevelopmentFamilyPreview(viewer)) {
    const familyUser = await getUserByEmail(DEVELOPMENT_FAMILY_EMAIL);
    if (!familyUser?.familyId) throw new Error("development_family_user_not_available");
    return { viewer, familyUser, isDevelopmentPreview: true };
  }

  if (viewer.role !== "PARENT") redirect(forbiddenRedirectTo);

  return { viewer, familyUser: viewer, isDevelopmentPreview: false };
}
