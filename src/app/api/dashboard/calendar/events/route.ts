import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type CalendarViewMode } from "@/modules/dashboard/lib/calendar-range";
import { listCalendarEventsForAdminByRange } from "@/modules/dashboard/server/calendar.repository";

function parseView(view: string | null): CalendarViewMode {
  return view === "day" || view === "month" ? view : "week";
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.trim() },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawDate = searchParams.get("date");
  const viewMode = parseView(searchParams.get("view"));
  const parsedDate = rawDate ? new Date(`${rawDate}T00:00:00`) : new Date();
  const dateCursor = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const events = await listCalendarEventsForAdminByRange(dateCursor, viewMode);

  return NextResponse.json({
    events,
  });
}
