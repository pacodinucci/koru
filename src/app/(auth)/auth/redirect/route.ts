import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDashboardRole } from "@/modules/auth/roles";
import { GOOGLE_INVITATION_COOKIE } from "@/modules/auth/lib/google-invitation-flow";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const email = session?.user.email?.trim().toLowerCase();
  const user = email ? await prisma.user.findUnique({ where: { email }, select: { role: true } }) : null;
  const destination = user && isDashboardRole(user.role) ? "/dashboard" : user ? "/family-dashboard" : "/sign-in";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.delete(GOOGLE_INVITATION_COOKIE);
  return response;
}