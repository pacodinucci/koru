import "server-only";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import type { StudentReportFileType } from "@/modules/teachers/lib/student-report-file";

export const teacherReportMimeTypes: Record<StudentReportFileType, string> = {
  PDF: "application/pdf",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export class TeacherReportError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function requireTeacherReportsSuperadmin() {
  const user = await getAuthenticatedUser();
  if (!user) throw new TeacherReportError("No autorizado.", 401);
  // Visibility is metadata only; neither permissions nor teacher ownership grant access.
  if (user.role !== "SUPERADMIN") throw new TeacherReportError("No autorizado.", 403);
  return user;
}

export function validateTeacherReportId(id: string) {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new TeacherReportError("Identificador inválido.", 400);
  }
}

export async function requireReportTeacher(teacherId: string) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherId }, select: { id: true } });
  if (!teacher) throw new TeacherReportError("Docente no disponible.", 404);
}

// L4 read model: never serialize a Cloudinary identifier or signed/public storage URL.
export async function listTeacherReports(teacherId: string) {
  await requireTeacherReportsSuperadmin();
  validateTeacherReportId(teacherId);
  await requireReportTeacher(teacherId);
  const reports = await prisma.teacherReport.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, content: true, type: true, fileName: true,
      visibleToTeacher: true, createdAt: true, author: { select: { name: true } },
    },
  });
  return reports.map(({ type, ...report }) => ({
    ...report,
    fileMimeType: type === "TEXT" ? null : teacherReportMimeTypes[type],
    fileUrl: type === "TEXT" ? null : `/api/teacher-reports/${report.id}/download`,
  }));
}

// Internal persistence helpers. Public handlers authorize before calling them.
export async function createTeacherReportRecord(data: {
  teacherId: string; authorId: string; title: string; type: "TEXT" | StudentReportFileType;
  content?: string; cloudinaryPublicId?: string; fileName?: string;
}) {
  await prisma.teacherReport.create({ data: { ...data, visibleToTeacher: false } });
}

export async function setTeacherReportVisibility(id: string, visibleToTeacher: boolean) {
  return prisma.teacherReport.updateMany({ where: { id }, data: { visibleToTeacher } });
}

export async function findTeacherReportFile(id: string) {
  return prisma.teacherReport.findUnique({
    where: { id }, select: { type: true, fileName: true, cloudinaryPublicId: true },
  });
}

export async function deleteTeacherReportRecord(id: string) {
  return prisma.teacherReport.deleteMany({ where: { id } });
}
