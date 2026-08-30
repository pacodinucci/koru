import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { GoogleCalendarConnectionCard } from "@/modules/calendar/components/google-calendar-connection-card";
import { getGoogleCalendarConnectionState } from "@/modules/calendar/server/google-calendar/google-calendar.repository";
import { PublicCalendarView } from "@/modules/calendar/views/public-calendar-view";
import { getRangeForView } from "@/modules/dashboard/lib/calendar-range";
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

function parseDate(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { date, day, google, googleError } = await searchParams;
  const dateCursor = parseDate(date);
  const selectedDate = day ? parseDate(day) : undefined;
  const { start, end } = getRangeForView(dateCursor, "month");
  const user = await getAuthenticatedUser();
  const [events, googleConnection] = await Promise.all([
    listPublicCalendarEventsByRange({
      viewer: user ? { id: user.id, role: user.role } : undefined,
      start,
      end,
    }),
    user ? getGoogleCalendarConnectionState(user.id) : Promise.resolve(null),
  ]);

  return (
    <PublicCalendarView
      dateCursor={dateCursor}
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
