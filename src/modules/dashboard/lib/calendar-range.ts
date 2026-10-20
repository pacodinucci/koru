import {
  calendarDateValue,
  DEFAULT_CALENDAR_TIME_ZONE,
  parseCalendarLocalDateTime,
} from "@/modules/calendar/lib/calendar-time-zone";

export type CalendarViewMode = "day" | "week" | "month";

// Cursors are civil dates, not instants. Noon keeps local date arithmetic stable.
export function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function calendarTodayCursor(now: Date = new Date()): Date {
  const [year, month, day] = calendarDateValue(now, DEFAULT_CALENDAR_TIME_ZONE).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getStartOfWeek(baseDate: Date) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offsetToMonday);
  return toDateOnly(d);
}

export function getRangeForView(dateCursor: Date, viewMode: CalendarViewMode) {
  const cursor = toDateOnly(dateCursor);

  let start: Date;
  let end: Date;
  if (viewMode === "day") {
    start = cursor;
    end = addDays(start, 1);
  } else if (viewMode === "week") {
    start = getStartOfWeek(cursor);
    end = addDays(start, 7);
  } else {
    start = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
    end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12);
  }

  // Only query boundaries are instants: interpret each civil midnight in Mexico.
  return {
    start: parseCalendarLocalDateTime(serializeDate(start), "00:00", DEFAULT_CALENDAR_TIME_ZONE),
    end: parseCalendarLocalDateTime(serializeDate(end), "00:00", DEFAULT_CALENDAR_TIME_ZONE),
  };
}

export function getNextCursor(
  cursor: Date,
  viewMode: CalendarViewMode,
  direction: -1 | 1,
) {
  const step = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30;
  return addDays(cursor, direction * step);
}

export function serializeDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
