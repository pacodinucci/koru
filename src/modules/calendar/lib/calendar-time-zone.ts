export const DEFAULT_CALENDAR_TIME_ZONE = "America/Mexico_City";

export const CALENDAR_TIME_ZONES = [
  { value: DEFAULT_CALENDAR_TIME_ZONE, label: "Ciudad de México (México)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (Argentina)" },
  { value: "America/Bogota", label: "Bogotá (Colombia)" },
  { value: "America/Santiago", label: "Santiago (Chile)" },
  { value: "America/New_York", label: "Nueva York (EE. UU.)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (EE. UU.)" },
  { value: "Europe/Madrid", label: "Madrid (España)" },
] as const;

export function isCalendarTimeZone(value: string) {
  return CALENDAR_TIME_ZONES.some((zone) => zone.value === value);
}

export function calendarTimeZoneLabel(value: string) {
  return CALENDAR_TIME_ZONES.find((zone) => zone.value === value)?.label ?? value;
}

function dateTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function calendarDateValue(date: Date, timeZone: string) {
  const { year, month, day } = dateTimeParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function calendarTimeValue(date: Date, timeZone: string) {
  const { hour, minute } = dateTimeParts(date, timeZone);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseCalendarLocalDateTime(dateValue: string, timeValue: string, timeZone: string) {
  if (!isCalendarTimeZone(timeZone)) throw new Error("invalid_time_zone");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) {
    throw new Error("invalid_date");
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute);
  const normalized = new Date(wallClockUtc);
  if (
    normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day || normalized.getUTCHours() !== hour ||
    normalized.getUTCMinutes() !== minute
  ) throw new Error("invalid_date");

  const offsets = new Set<number>();
  for (const delta of [-36, -12, 0, 12, 36]) {
    const probe = wallClockUtc + delta * 60 * 60 * 1000;
    const parts = dateTimeParts(new Date(probe), timeZone);
    offsets.add(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - probe);
  }
  const matches = [...offsets]
    .map((offset) => new Date(wallClockUtc - offset))
    .filter((candidate) =>
      calendarDateValue(candidate, timeZone) === dateValue &&
      calendarTimeValue(candidate, timeZone) === timeValue,
    );
  if (matches.length !== 1) throw new Error(matches.length ? "ambiguous_date" : "invalid_date");
  return matches[0];
}
