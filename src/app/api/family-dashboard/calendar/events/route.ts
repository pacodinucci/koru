import { NextResponse } from "next/server";

import { type CalendarViewMode } from "@/modules/dashboard/lib/calendar-range";
import { listVisibleEventsForUserByRange } from "@/modules/dashboard/server/calendar.repository";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";

function parseView(view: string | null): CalendarViewMode {
  return view === "day" || view === "month" ? view : "week";
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawDate = searchParams.get("date");
  const viewMode = parseView(searchParams.get("view"));
  const parsedDate = rawDate ? new Date(`${rawDate}T00:00:00`) : new Date();
  const dateCursor = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const events = await listVisibleEventsForUserByRange(
    user.id,
    user.role,
    dateCursor,
    viewMode,
  );

  return NextResponse.json({ events });
}
