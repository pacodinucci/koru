import "server-only";

import { prisma } from "@/lib/prisma";

export async function getAssignedTeacherStudent(userId: string, studentId: string) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });
  if (!teacher) return null;

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      status: "ACTIVE",
      group: {
        isActive: true,
        teacherResponsibilities: { some: { teacherId: teacher.id } },
      },
    },
    select: { id: true },
  });

  return student ? { teacherId: teacher.id, studentId: student.id } : null;
}

export async function getTeacherStudentRecord(studentId: string, teacherId: string) {
  return prisma.student.findFirst({
    where: {
      id: studentId,
      status: "ACTIVE",
      group: { isActive: true, teacherResponsibilities: { some: { teacherId } } },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      documentType: true,
      documentNumber: true,
      recordStatus: true,
      group: { select: { name: true, ageRange: true } },
      medicalProfile: { select: {
        bloodType: true,
        knownAllergies: true,
        medicalConditions: true,
        regularMedications: true,
        hasHealthInsurance: true,
        insuranceProviderAndPolicy: true,
      } },
    },
  });
}

export async function listTeacherStudentReports(studentId: string) {
  return prisma.studentReport.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      fileName: true,
      createdAt: true,
      teacher: { select: { displayName: true } },
    },
  });
}

export async function listAssignedTeacherReports(userId: string) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });
  if (!teacher) return [];

  return prisma.studentReport.findMany({
    where: {
      student: {
        status: "ACTIVE",
        group: {
          isActive: true,
          teacherResponsibilities: { some: { teacherId: teacher.id } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      fileName: true,
      createdAt: true,
      teacher: { select: { displayName: true } },
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          group: { select: { name: true } },
        },
      },
    },
  });
}
