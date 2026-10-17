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

export async function createPsychopedagogyEntry(data: {
  studentId: string;
  teacherId: string;
  entryDate: Date;
  title: string;
  body: string;
}) {
  return prisma.psychopedagogyEntry.create({ data, select: { id: true } });
}
