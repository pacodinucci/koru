import type { CalendarAccessScope } from "./calendar-access";

export function filterCalendarEventsByAreas<T extends { id: string; areaLinks?: Array<{ areaId: string }> }>(events: T[], areaIds: string[]): T[] {
  return areaIds.length ? events.filter(event => event.areaLinks?.some(link => areaIds.includes(link.areaId))) : events;
}

export type CalendarAreaOption = { id: string; name: string; color: string };
export type CalendarEventAreaFields = {
  accessScope?: CalendarAccessScope;
  responsibleAreaId?: string | null;
  areaLinks?: Array<{ areaId: string; area: CalendarAreaOption }>;
  audienceAreas?: Array<{ areaId: string }>;
  canEdit?: boolean;
};
export type CalendarAreaFormOptions = {
  areas?: CalendarAreaOption[];
  editableAreaIds?: string[];
  canManageCalendar?: boolean;
  currentUserId?: string;
};
