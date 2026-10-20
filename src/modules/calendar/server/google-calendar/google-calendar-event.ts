export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.owned";
import { DEFAULT_CALENDAR_TIME_ZONE, calendarDateValue } from "../../lib/calendar-time-zone";

type KoruCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
  allDay: boolean;
  location: string | null;
};

type GoogleCalendarEventPayload = {
  summary: string;
  description: string;
  location?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  extendedProperties: {
    private: {
      koruEventId: string;
    };
  };
};

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function buildGoogleCalendarEventPayload(
  event: KoruCalendarEvent,
  appBaseUrl: string,
): GoogleCalendarEventPayload {
  const eventUrl = new URL(`/calendario/eventos/${event.id}`, appBaseUrl).toString();
  const description = [event.description?.trim(), `Ver en Koru: ${eventUrl}`]
    .filter(Boolean)
    .join("\n\n");

  const base = {
    summary: event.title,
    description,
    ...(event.location ? { location: event.location } : {}),
    extendedProperties: {
      private: {
        koruEventId: event.id,
      },
    },
  };

  if (event.allDay) {
    const exclusiveEnd =
      calendarDateValue(event.endsAt, DEFAULT_CALENDAR_TIME_ZONE) === calendarDateValue(event.startsAt, DEFAULT_CALENDAR_TIME_ZONE)
        ? addUtcDays(event.startsAt, 1)
        : event.endsAt;

    return {
      ...base,
      start: { date: calendarDateValue(event.startsAt, DEFAULT_CALENDAR_TIME_ZONE) },
      end: { date: calendarDateValue(exclusiveEnd, DEFAULT_CALENDAR_TIME_ZONE) },
    };
  }

  return {
    ...base,
    start: {
      dateTime: event.startsAt.toISOString(),
      timeZone: DEFAULT_CALENDAR_TIME_ZONE,
    },
    end: {
      dateTime: event.endsAt.toISOString(),
      timeZone: DEFAULT_CALENDAR_TIME_ZONE,
    },
  };
}

