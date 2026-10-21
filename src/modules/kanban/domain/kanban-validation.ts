import { z } from "zod";

export const identifierSchema = z.string().min(1).max(200).regex(/^\S+$/);
const description = z.string().trim().max(5000).optional().transform((value) => value || null);
export const boardSchema = z.object({ name: z.string().trim().min(1).max(120), description });
export const statusSchema = z.object({ name: z.string().trim().min(1).max(80), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
export const cardSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description,
  assigneeId: identifierSchema.nullish().transform((value) => value ?? null),
});

/** Accept unambiguous form dates or ISO timestamps with an explicit time zone. */
export function parseDueDate(value?: string | null): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const invalid = () => { throw new Error("Indicá una fecha de vencimiento válida."); };
  if (typeof value !== "string") return invalid();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if (!match) return invalid();
  const [, year, month, day, hour, minute, second, zone] = match;
  const calendarDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  if (!Number(year) || !Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return invalid();
  if (hour !== undefined && (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59)) return invalid();
  if (zone && zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4, 6)) > 59)) return invalid();
  const result = new Date(hour === undefined ? `${value}T00:00:00.000Z` : value);
  if (!Number.isFinite(result.getTime())) return invalid();
  return result;
}
