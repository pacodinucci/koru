import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN_TEACHER") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || typeof (payload as { visibleToFamily?: unknown }).visibleToFamily !== "boolean") {
    return NextResponse.json({ error: "Indicá si el reporte será visible para la familia." }, { status: 400 });
  }
  const visibleToFamily = (payload as { visibleToFamily: boolean }).visibleToFamily;
  const { id } = await params;

  try {
    const teacher = await prisma.teacherProfile.findFirst({
      where: { userId: user.id, isActive: true },
      select: { id: true },
    });
    if (!teacher) return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });

    const result = await prisma.studentReport.updateMany({
      where: {
        id,
        teacherId: teacher.id,
        student: {
          status: "ACTIVE",
          group: {
            isActive: true,
            teacherResponsibilities: { some: { teacherId: teacher.id } },
          },
        },
      },
      data: { visibleToFamily },
    });
    if (result.count !== 1) return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });
    return NextResponse.json({ ok: true, visibleToFamily }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[student-reports] No se pudo cambiar la visibilidad", error);
    return NextResponse.json({ error: "No pudimos cambiar la visibilidad. Intentá nuevamente." }, { status: 500 });
  }
}
