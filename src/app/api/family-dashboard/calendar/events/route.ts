import { NextResponse } from "next/server";

import { type CalendarViewMode } from "@/modules/dashboard/lib/calendar-range";
import { listVisibleEventsForUserByRange } from "@/modules/dashboard/server/calendar.repository";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";

function parseView(view: string | null): CalendarViewMode {
  return view === "day" || view === "month" ? view : "week";
}

export async function GET(request: Request) {
  const { familyUser } = await requireFamilyDashboardAccess();

  const { searchParams } = new URL(request.url);
  const rawDate = searchParams.get("date");
  const viewMode = parseView(searchParams.get("view"));
  const parsedDate = rawDate ? new Date(`${rawDate}T00:00:00`) : new Date();
  const dateCursor = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const events = await listVisibleEventsForUserByRange(
    familyUser.id,`r`n    familyUser.role,
    dateCursor,
    viewMode,
  );

  return NextResponse.json({ events });
}
