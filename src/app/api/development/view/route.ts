import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import {
  DEVELOPMENT_VIEW_COOKIE,
  getActualAuthenticatedUser,
  getDevelopmentViewTargetId,
  isDevelopmentViewController,
} from "@/modules/auth/server/auth-guards";
import { prisma } from "@/lib/prisma";

function unavailable() { return NextResponse.json({ ok: false }, { status: 404 }); }
function redirectFor(kind: "own" | "teacher" | "family") { return kind === "family" ? "/family-dashboard?view=dashboard" : "/dashboard"; }

export async function GET() {
  const viewer = await getActualAuthenticatedUser();
  if (!viewer || !isDevelopmentViewController(viewer)) return unavailable();

  const [teachers, families, selectedUserId] = await Promise.all([
    prisma.teacherProfile.findMany({
      where: { isActive: true, user: { is: { role: { in: [UserRole.TEACHER, UserRole.ADMIN_TEACHER] } } } },
      orderBy: { displayName: "asc" },
      select: { userId: true, displayName: true, email: true },
    }),
    prisma.user.findMany({
      where: { role: UserRole.PARENT, familyId: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, family: { select: { name: true } } },
    }),
    getDevelopmentViewTargetId(),
  ]);

  return NextResponse.json({
    enabled: true,
    selectedUserId,
    teachers: teachers.flatMap((teacher) => teacher.userId ? [{ id: teacher.userId, label: teacher.displayName || teacher.email || "Docente" }] : []),
    families: families.map((family) => ({ id: family.id, label: `${family.family?.name ?? family.name} · ${family.name || family.email}` })),
  });
}

export async function POST(request: Request) {
  const viewer = await getActualAuthenticatedUser();
  if (!viewer || !isDevelopmentViewController(viewer)) return unavailable();
  const input = await request.json().catch(() => null) as { kind?: "own" | "teacher" | "family"; targetUserId?: string } | null;
  if (!input || !["own", "teacher", "family"].includes(input.kind ?? "")) return NextResponse.json({ ok: false }, { status: 400 });

  const response = NextResponse.json({ ok: true, redirectTo: redirectFor(input.kind!) });
  if (input.kind === "own") {
    response.cookies.delete(DEVELOPMENT_VIEW_COOKIE);
    return response;
  }
  if (!input.targetUserId) return NextResponse.json({ ok: false }, { status: 400 });

  const target = input.kind === "teacher"
    ? await prisma.user.findFirst({ where: { id: input.targetUserId, role: { in: [UserRole.TEACHER, UserRole.ADMIN_TEACHER] }, teacherProfile: { is: { isActive: true } } }, select: { id: true } })
    : await prisma.user.findFirst({ where: { id: input.targetUserId, role: UserRole.PARENT, familyId: { not: null } }, select: { id: true } });
  if (!target) return NextResponse.json({ ok: false }, { status: 400 });

  response.cookies.set(DEVELOPMENT_VIEW_COOKIE, target.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
