import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return NextResponse.json({
      user: user ? {
        name: user.name?.trim() || "Usuario",
        email: user.email,
        image: user.image ?? null,
        canAccessDashboard: user.permissionKeys.includes("dashboard.access"),
      } : null,
    }, { headers });
  } catch {
    return NextResponse.json({ user: null }, { status: 503, headers });
  }
}
