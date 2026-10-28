import { NextResponse } from "next/server";

import { parseCalendarNavigation } from "@/modules/calendar/lib/calendar-navigation";
import { listVisibleEventsForUserByRange } from "@/modules/dashboard/server/calendar.repository";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";

export async function GET(request: Request) {
  const { familyUser } = await requireFamilyDashboardAccess();

  const { searchParams } = new URL(request.url);
  const { dateCursor, viewMode } = parseCalendarNavigation(searchParams, "event");
  const events = await listVisibleEventsForUserByRange(
    familyUser.id,
    familyUser.role,
    dateCursor,
    viewMode,
  );

  return NextResponse.json({ events }, { headers: { "Cache-Control": "private, no-store" } });
}
