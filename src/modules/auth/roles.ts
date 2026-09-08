export const dashboardRoles = [
  "ADMIN",
  "ADMIN_OPERATOR",
  "ADMIN_TEACHER",
  "SUPERADMIN",
  "TEACHER",
] as const;

export type AppUserRole =
  | "ADMIN"
  | "ADMIN_OPERATOR"
  | "ADMIN_TEACHER"
  | "SUPERADMIN"
  | "TEACHER"
  | "PARENT";

export function isAdminRole(role: AppUserRole | string) {
  return role === "ADMIN" || role === "ADMIN_OPERATOR" || role === "ADMIN_TEACHER" || role === "SUPERADMIN";
}

export function isTeacherRole(role: AppUserRole | string) {
  return role === "TEACHER" || role === "ADMIN_TEACHER" || role === "ADMIN" || role === "ADMIN_OPERATOR";
}

export function isDashboardRole(role: AppUserRole | string) {
  return dashboardRoles.includes(role as (typeof dashboardRoles)[number]);
}

export function isSuperAdminRole(role: AppUserRole | string) {
  return role === "SUPERADMIN";
}
