import { notFound } from "next/navigation";
import { parsePublicCalendarDate, publicCalendarWindow } from "@/modules/calendar/lib/public-calendar-window";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { GoogleCalendarConnectionCard } from "@/modules/calendar/components/google-calendar-connection-card";
import { getGoogleCalendarConnectionState } from "@/modules/calendar/server/google-calendar/google-calendar.repository";
import { PublicCalendarView } from "@/modules/calendar/views/public-calendar-view";
import { calendarTodayCursor, getRangeForView } from "@/modules/dashboard/lib/calendar-range";
import { listPublicCalendarEventsByRange } from "@/modules/dashboard/server/calendar.repository";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams: Promise<{
    date?: string;
    day?: string;
    google?: string;
    googleError?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { date, day, google, googleError } = await searchParams;
  const today = calendarTodayCursor();
  const window = publicCalendarWindow(today.getFullYear());
  const dateCursor = date === undefined ? today : parsePublicCalendarDate(date, window);
  const selectedDate = day === undefined ? undefined : parsePublicCalendarDate(day, window);
  if (!dateCursor || selectedDate === null) notFound();
  const { start, end } = getRangeForView(dateCursor, "month");
  const user = await getAuthenticatedUser();
  const [events, googleConnection] = await Promise.all([
    listPublicCalendarEventsByRange({
      viewer: user ? { id: user.id, role: user.role } : undefined,
      start: new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000),
      end: new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000),
    }),
    user ? getGoogleCalendarConnectionState(user.id) : Promise.resolve(null),
  ]);

  return (
    <PublicCalendarView
      dateCursor={dateCursor}
      window={window}
      selectedDate={selectedDate}
      events={events}
      googleCalendarCard={
        googleConnection ? (
          <GoogleCalendarConnectionCard
            connection={googleConnection}
            message={google}
            error={googleError}
            compact
          />
        ) : undefined
      }
    />
  );
}
