export type CalendarAccessScope = "LEGACY" | "INTERNAL" | "AREAS" | "PEOPLE";

export type CalendarAreaGrant = {
  areaId: string;
  canEdit: boolean;
};

export type CalendarAccessViewer = {
  id: string;
  role: string;
  canManageCalendar: boolean;
  areaGrants: CalendarAreaGrant[];
};

export type CalendarAccessEvent = {
  accessScope: CalendarAccessScope;
  responsibleAreaId: string | null;
  audienceAreaIds: string[];
  audienceUserIds: string[];
  createdById: string;
  audienceType: string;
  visibility: string;
  status?: string;
};

const internalRoles = new Set([
  "ADMIN",
  "ADMIN_OPERATOR",
  "ADMIN_TEACHER",
  "SUPERADMIN",
  "TEACHER",
  "PSYCHOPEDAGOGY_TEACHER",
]);

export function isInternalCalendarRole(role: string): boolean {
  return internalRoles.has(role);
}

export type CalendarAreaSelectionInput = Pick<
  CalendarAccessEvent,
  "accessScope" | "audienceAreaIds" | "audienceUserIds"
>;

/** Audience validation only; responsible/involved-area integrity belongs to the caller. */
export function validateCalendarAreaSelection(input: CalendarAreaSelectionInput): string | null {
  switch (input.accessScope) {
    case "LEGACY":
    case "INTERNAL":
      return null;
    case "AREAS":
      return input.audienceAreaIds.length > 0 && input.audienceAreaIds.every((id) => id.trim().length > 0)
        ? null
        : "calendar_audience_areas_required";
    case "PEOPLE":
      return input.audienceUserIds.length > 0 && input.audienceUserIds.every((id) => id.trim().length > 0)
        ? null
        : "calendar_audience_people_required";
    default:
      return "calendar_access_scope_invalid";
  }
}

function canReadLegacyAudience(event: CalendarAccessEvent, viewer: CalendarAccessViewer): boolean {
  if (event.audienceType === "PRIVATE") {
    return event.audienceUserIds.includes(viewer.id);
  }
  if (event.audienceType === "ALL") return true;

  if (viewer.role === "ADMIN" || viewer.role === "ADMIN_OPERATOR" || viewer.role === "SUPERADMIN") {
    return event.audienceType === "TEACHERS" || event.audienceType === "PARENTS";
  }
  if (viewer.role === "TEACHER" || viewer.role === "ADMIN_TEACHER") {
    return event.audienceType === "TEACHERS";
  }
  // Match the legacy query's fallback for PARENT and PSYCHOPEDAGOGY_TEACHER.
  return event.audienceType === "PARENTS";
}

/** Content authorization only: publication is checked separately for reads, not edits. */
function canAccessCalendarAudience(event: CalendarAccessEvent, viewer: CalendarAccessViewer | null): boolean {
  if (!viewer) {
    return event.accessScope === "LEGACY" && event.visibility === "PUBLIC" && event.audienceType === "ALL";
  }
  const internal = isInternalCalendarRole(viewer.role);
  if (!internal && viewer.role !== "PARENT") return false;

  switch (event.accessScope) {
    case "LEGACY":
      return canReadLegacyAudience(event, viewer);
    case "INTERNAL":
      return internal;
    case "AREAS":
      return internal && validateCalendarAreaSelection(event) === null && viewer.areaGrants.some(
        (grant) => event.audienceAreaIds.includes(grant.areaId),
      );
    case "PEOPLE":
      return validateCalendarAreaSelection(event) === null && event.audienceUserIds.includes(viewer.id);
    default:
      return false;
  }
}

/** Omit status only for projections whose publication has already been checked by the caller. */
export function canReadCalendarEvent(event: CalendarAccessEvent, viewer: CalendarAccessViewer | null): boolean {
  if (event.status !== undefined && event.status !== "PUBLISHED") return false;
  return canAccessCalendarAudience(event, viewer);
}

/** Draft editing is allowed, but never bypasses a new scope's content restrictions. */
export function canEditCalendarEvent(event: CalendarAccessEvent, viewer: CalendarAccessViewer | null): boolean {
  if (!viewer) return false;
  if (event.accessScope === "LEGACY") return viewer.canManageCalendar;
  if (!isInternalCalendarRole(viewer.role) || !canAccessCalendarAudience(event, viewer)) return false;

  return viewer.canManageCalendar || (
    event.responsibleAreaId !== null && viewer.areaGrants.some(
      (grant) => grant.areaId === event.responsibleAreaId && grant.canEdit,
    )
  );
}
