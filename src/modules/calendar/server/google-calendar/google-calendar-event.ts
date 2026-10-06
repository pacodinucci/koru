export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.owned";
import { calendarDateValue } from "../../lib/calendar-time-zone";

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
      calendarDateValue(event.endsAt, event.timeZone) === calendarDateValue(event.startsAt, event.timeZone)
        ? addUtcDays(event.startsAt, 1)
        : event.endsAt;

    return {
      ...base,
      start: { date: calendarDateValue(event.startsAt, event.timeZone) },
      end: { date: calendarDateValue(exclusiveEnd, event.timeZone) },
    };
  }

  return {
    ...base,
    start: {
      dateTime: event.startsAt.toISOString(),
      timeZone: event.timeZone,
    },
    end: {
      dateTime: event.endsAt.toISOString(),
      timeZone: event.timeZone,
    },
  };
}

