export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";
export const KORU_TIME_ZONE = "America/Argentina/Buenos_Aires";

type KoruCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
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

function formatDateInTimeZone(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KORU_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

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
      formatDateInTimeZone(event.endsAt) === formatDateInTimeZone(event.startsAt)
        ? addUtcDays(event.startsAt, 1)
        : event.endsAt;

    return {
      ...base,
      start: { date: formatDateInTimeZone(event.startsAt) },
      end: { date: formatDateInTimeZone(exclusiveEnd) },
    };
  }

  return {
    ...base,
    start: {
      dateTime: event.startsAt.toISOString(),
      timeZone: KORU_TIME_ZONE,
    },
    end: {
      dateTime: event.endsAt.toISOString(),
      timeZone: KORU_TIME_ZONE,
    },
  };
}
