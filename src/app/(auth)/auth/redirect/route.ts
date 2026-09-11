import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { legacyRolePermissions } from "@/modules/auth/permissions/permission-catalog";
import { GOOGLE_INVITATION_COOKIE } from "@/modules/auth/lib/google-invitation-flow";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const email = session?.user.email?.trim().toLowerCase();
  const user = email ? await prisma.user.findUnique({
    where: { email },
    select: {
      role: true,
      accessRoleId: true,
      accessRole: {
        select: {
          isActive: true,
          permissions: {
            where: { permission: { key: "dashboard.access" } },
            select: { permissionId: true },
          },
        },
      },
    },
  }) : null;
  const canAccessDashboard = user
    ? user.accessRole?.isActive
      ? user.accessRole.permissions.length > 0
      : user.accessRoleId
        ? false
        : legacyRolePermissions[user.role].includes("dashboard.access")
    : false;
  const destination = canAccessDashboard ? "/dashboard" : user ? "/family-dashboard" : "/sign-in";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.delete(GOOGLE_INVITATION_COOKIE);
  return response;
}