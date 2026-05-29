export type CalendarViewMode = "day" | "week" | "month";

export function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

  if (viewMode === "day") {
    const start = cursor;
    const end = addDays(start, 1);
    return { start, end };
  }

  if (viewMode === "week") {
    const start = getStartOfWeek(cursor);
    const end = addDays(start, 7);
    return { start, end };
  }

  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  return { start, end };
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
  return toDateOnly(date).toISOString().slice(0, 10);
}
