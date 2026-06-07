import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "PARENT";
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

export async function getAuthenticatedUser() {
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
    },
  });

  return user;
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

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function requireAdmin(
  forbiddenRedirectTo = "/dashboard?error=forbidden",
) {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
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
  return requireRole(["ADMIN", "TEACHER"], forbiddenRedirectTo);
}
