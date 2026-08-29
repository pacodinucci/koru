import {
  CalendarAudienceType,
  UserRole,
} from "@prisma/client";

const teacherRoles = new Set<UserRole>([
  UserRole.TEACHER,
  UserRole.ADMIN_TEACHER,
]);

export function getAudienceRoles(audienceType: CalendarAudienceType) {
  if (audienceType === CalendarAudienceType.TEACHERS) {
    return [UserRole.TEACHER, UserRole.ADMIN_TEACHER];
  }

  if (audienceType === CalendarAudienceType.PARENTS) {
    return [UserRole.PARENT];
  }

  return undefined;
}

export function canViewCalendarAudience(
  role: UserRole,
  audienceType: CalendarAudienceType,
) {
  if (
    role === UserRole.ADMIN ||
    role === UserRole.SUPERADMIN
  ) {
    return true;
  }

  if (audienceType === CalendarAudienceType.ALL) return true;
  if (audienceType === CalendarAudienceType.TEACHERS) {
    return teacherRoles.has(role);
  }
  if (audienceType === CalendarAudienceType.PARENTS) {
    return role === UserRole.PARENT;
  }

  return false;
}
export function getAudienceTypesForViewer(role: UserRole) {
  if (role === UserRole.ADMIN || role === UserRole.SUPERADMIN) {
    return [
      CalendarAudienceType.ALL,
      CalendarAudienceType.TEACHERS,
      CalendarAudienceType.PARENTS,
    ];
  }
  if (role === UserRole.TEACHER || role === UserRole.ADMIN_TEACHER) {
    return [CalendarAudienceType.ALL, CalendarAudienceType.TEACHERS];
  }
  return [CalendarAudienceType.ALL, CalendarAudienceType.PARENTS];
}