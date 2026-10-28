export type PublicCalendarWindow = { minYear: number; maxYear: number };

export function publicCalendarWindow(currentYear: number): PublicCalendarWindow {
  return { minYear: currentYear - 5, maxYear: currentYear + 2 };
}

// Parse civil dates strictly: Date alone normalizes impossible dates such as February 30.
export function parsePublicCalendarDate(value: unknown, window: PublicCalendarWindow): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < window.minYear || year > window.maxYear) return null;
  const parsed = new Date(year, month - 1, day, 12);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
    ? parsed
    : null;
}
