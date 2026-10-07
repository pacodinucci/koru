import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getActualAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { authorizationUrl, BASECAMP_ROLES, basecampConfigured } from "@/modules/basecamp/server/basecamp";

export async function GET(request: Request) {
  const user = await getActualAuthenticatedUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in", request.url));
  if (!BASECAMP_ROLES.some((role) => role === user.role)) return new Response("Forbidden", { status: 403 });
  if (!basecampConfigured()) return NextResponse.redirect(new URL("/dashboard/basecamp?error=config", request.url));

  const state = randomBytes(32).toString("hex");
  const response = NextResponse.redirect(authorizationUrl(state));
  response.cookies.set("koru-basecamp-oauth", `${user.id}:${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/basecamp/callback",
    maxAge: 600,
  });
  return response;
}
