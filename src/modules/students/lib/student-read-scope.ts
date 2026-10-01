import type { UserRole } from "@prisma/client";

export type StudentViewer = { id: string; role: UserRole };

export function isTeacherScopedStudentViewer(role: UserRole) {
  return role === "TEACHER" || role === "ADMIN_TEACHER";
}

export function studentGroupWhereForViewer(viewer: StudentViewer) {
  if (viewer.role === "PARENT") return { id: { in: [] as string[] } };
  if (!isTeacherScopedStudentViewer(viewer.role)) return { isActive: true };

  return {
    isActive: true,
    teacherResponsibilities: {
      some: { teacher: { is: { userId: viewer.id, isActive: true } } },
    },
  };
}

export function studentWhereForViewer(viewer: StudentViewer) {
  if (viewer.role === "PARENT") return { id: { in: [] as string[] } };
  if (!isTeacherScopedStudentViewer(viewer.role)) return undefined;

  return {
    status: "ACTIVE" as const,
    group: studentGroupWhereForViewer(viewer),
  };
}
