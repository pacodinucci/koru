import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { parseCalendarNavigation } from "@/modules/calendar/lib/calendar-navigation";
import { listCalendarEventsForAdminByRange } from "@/modules/dashboard/server/calendar.repository";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user?.permissionKeys.includes("calendar.view")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const { dateCursor, viewMode } = parseCalendarNavigation(searchParams, "edit");
  const events = await listCalendarEventsForAdminByRange(dateCursor, viewMode);

  return NextResponse.json({ events }, { headers: { "Cache-Control": "private, no-store" } });
}
