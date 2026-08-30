import { redirect } from "next/navigation";
import { after } from "next/server";

import { requireUser } from "@/modules/auth/server/auth-guards";
import { activateGoogleCalendarConnection } from "@/modules/calendar/server/google-calendar/google-calendar.repository";
import { syncUpcomingConfirmedEventsForUser } from "@/modules/calendar/server/google-calendar/google-calendar-sync.service";

export default async function GoogleCalendarCallbackPage() {
  const user = await requireUser();

  try {
    await activateGoogleCalendarConnection(user.id);
  } catch {
    redirect("/calendario?googleError=scope_missing");
  }

  after(async () => {
    await syncUpcomingConfirmedEventsForUser(user.id);
  });

  redirect("/calendario?google=connected");
}
