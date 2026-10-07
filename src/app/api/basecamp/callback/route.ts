import { timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getActualAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { accountIsAvailable, BASECAMP_ROLES, exchangeCode, getAuthorization, saveConnection } from "@/modules/basecamp/server/basecamp";

export async function GET(request: NextRequest) {
  const destination = new URL("/dashboard/basecamp", request.url);
  const user = await getActualAuthenticatedUser();
  if (!user || !BASECAMP_ROLES.some((role) => role === user.role)) {
    destination.searchParams.set("error", "session");
    return NextResponse.redirect(destination);
  }

  const cookie = request.cookies.get("koru-basecamp-oauth")?.value;
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const [cookieUserId, expectedState] = cookie?.split(":") ?? [];
  const validState = Boolean(state && expectedState && state.length === expectedState.length && timingSafeEqual(Buffer.from(state), Buffer.from(expectedState)));
  if (!code || !validState || cookieUserId !== user.id) {
    destination.searchParams.set("error", "state");
  } else {
    try {
      const token = await exchangeCode(code);
      const authorization = await getAuthorization(token.access_token);
      if (!accountIsAvailable(authorization) || authorization.identity?.id == null) {
        destination.searchParams.set("error", "account");
      } else {
        await saveConnection(user.id, String(authorization.identity.id), token);
        destination.searchParams.set("connected", "1");
      }
    } catch {
      destination.searchParams.set("error", "oauth");
    }
  }

  const response = NextResponse.redirect(destination);
  response.cookies.delete({ name: "koru-basecamp-oauth", path: "/api/basecamp/callback" });
  return response;
}
