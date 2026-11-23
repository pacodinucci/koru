export const dashboardRoles = [
  "ADMIN",
  "ADMIN_OPERATOR",
  "ADMIN_TEACHER",
  "SUPERADMIN",
  "TEACHER",
  "PSYCHOPEDAGOGY_TEACHER",
] as const;

export type AppUserRole =
  | "ADMIN"
  | "ADMIN_OPERATOR"
  | "ADMIN_TEACHER"
  | "SUPERADMIN"
  | "TEACHER"
  | "PSYCHOPEDAGOGY_TEACHER"
  | "PARENT";

export function isAdminRole(role: AppUserRole | string) {
  return role === "ADMIN" || role === "ADMIN_OPERATOR" || role === "ADMIN_TEACHER" || role === "SUPERADMIN";
}

export function isTeacherRole(role: AppUserRole | string) {
  return role === "TEACHER" || role === "ADMIN_TEACHER" || role === "ADMIN" || role === "ADMIN_OPERATOR";
}

/** Authorship needs a profile, not the broad capabilities of a classroom teacher. */
export function needsTeacherProfile(role: AppUserRole | string) {
  return isTeacherRole(role) || role === "PSYCHOPEDAGOGY_TEACHER";
}

export function isDashboardRole(role: AppUserRole | string) {
  return dashboardRoles.includes(role as (typeof dashboardRoles)[number]);
}

export function isSuperAdminRole(role: AppUserRole | string) {
  return role === "SUPERADMIN";
}
