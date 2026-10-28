import {
  calendarTodayCursor,
  serializeDate,
  toDateOnly,
  type CalendarViewMode,
} from "@/modules/dashboard/lib/calendar-range";

// A URL cursor is a civil date, never an ISO instant interpreted in the browser's zone.
export function parseCalendarCursor(value?: string | Date | null): Date {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? calendarTodayCursor() : toDateOnly(value);
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const cursor = new Date(year, month - 1, day, 12);
    if (serializeDate(cursor) === value) return cursor;
  }
  return calendarTodayCursor();
}

export function parseCalendarNavigation(params: URLSearchParams, selectionKey: "edit" | "event") {
  const view = params.get("view");
  return {
    dateCursor: parseCalendarCursor(params.get("date")),
    viewMode: (view === "day" || view === "month" ? view : "week") as CalendarViewMode,
    selectedEventId: params.get(selectionKey) || undefined,
  };
}

export function calendarNavigationUrl(
  currentUrl: string,
  cursor: Date,
  viewMode: CalendarViewMode,
  selectionKey: "edit" | "event",
  selectedEventId?: string,
) {
  const url = new URL(currentUrl, "https://calendar.local");
  url.searchParams.set("date", serializeDate(cursor));
  url.searchParams.set("view", viewMode);
  url.searchParams.delete(selectionKey);
  if (selectedEventId) url.searchParams.set(selectionKey, selectedEventId);
  return `${url.pathname}${url.search}${url.hash}`;
}
