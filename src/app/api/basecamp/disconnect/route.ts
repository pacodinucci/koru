import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getActualAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { BASECAMP_ROLES } from "@/modules/basecamp/server/basecamp";

export async function POST(request: Request) {
  const user = await getActualAuthenticatedUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!BASECAMP_ROLES.some((role) => role === user.role)) return new Response("Forbidden", { status: 403 });
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return new Response("Forbidden", { status: 403 });

  await prisma.basecampConnection.deleteMany({ where: { userId: user.id } });
  return NextResponse.redirect(new URL("/dashboard/basecamp", request.url), { status: 303 });
}
