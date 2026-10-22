import "server-only";

import { prisma } from "@/lib/prisma";

export async function listStudentPsychopedagogyEntries(studentId: string, teacherId: string) {
  return prisma.psychopedagogyEntry.findMany({
    where: {
      studentId,
      teacherId,
      teacher: { isActive: true },
      student: {
        status: "ACTIVE",
        group: { isActive: true, teacherResponsibilities: { some: { teacherId } } },
      },
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: { id: true, entryDate: true, title: true, body: true },
  });
}

export async function listPsychopedagogyStudentsForSuperadmin() {
  return prisma.student.findMany({
    orderBy: [{ group: { sortOrder: "asc" } }, { lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, group: { select: { name: true } } },
  });
}

export async function getPsychopedagogyStudentForSuperadmin(studentId: string) {
  return prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
}

export async function listStudentPsychopedagogyEntriesForSuperadmin(studentId: string) {
  return prisma.psychopedagogyEntry.findMany({
    where: { studentId },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: { id: true, entryDate: true, title: true, body: true },
  });
}

export async function createPsychopedagogyEntry(data: {
  studentId: string;
  teacherId: string;
  entryDate: Date;
  title: string;
  body: string;
}) {
  return prisma.psychopedagogyEntry.create({ data, select: { id: true } });
}
