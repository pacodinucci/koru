import "server-only";

import { UserRole, type ExamStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/modules/auth/server/auth-guards";
import type { ExamFormInput } from "@/modules/exams/schemas/exam.schema";

function parseExamDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_exam_date");
  }

  return date;
}

async function getTeacherProfileForUser(userId: string) {
  return prisma.teacherProfile.findFirst({
    where: { userId, isActive: true, user: { role: UserRole.TEACHER } },
    select: { id: true, displayName: true, email: true },
  });
}

export async function listExamsDashboardData(user: AuthenticatedUser) {
  const teacherProfile =
    user.role === "TEACHER" ? await getTeacherProfileForUser(user.id) : null;

  const groupWhere =
    user.role === "TEACHER"
      ? {
          isActive: true,
          teacherResponsibilities: { some: { teacherId: teacherProfile?.id ?? "" } },
        }
      : { isActive: true };

  const examWhere =
    user.role === "TEACHER"
      ? {
          group: {
            teacherResponsibilities: { some: { teacherId: teacherProfile?.id ?? "" } },
          },
        }
      : {};

  const [groups, exams, students, teachers] = await Promise.all([
    prisma.studentGroup.findMany({
      where: groupWhere,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        teacherResponsibilities: {
          orderBy: { teacher: { displayName: "asc" } },
          include: {
            teacher: { select: { id: true, displayName: true, email: true } },
          },
        },
      },
    }),
    prisma.exam.findMany({
      where: examWhere,
      orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
      include: {
        group: { select: { id: true, name: true } },
        teacher: { select: { id: true, displayName: true, email: true } },
        grades: {
          orderBy: { student: { lastName: "asc" } },
          include: {
            student: { select: { id: true, firstName: true, lastName: true, groupId: true } },
          },
        },
        _count: { select: { grades: true } },
      },
    }),
    prisma.student.findMany({
      where: {
        status: "ACTIVE",
        group: groupWhere,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, groupId: true },
    }),
    user.role === "ADMIN"
      ? prisma.teacherProfile.findMany({
          where: { isActive: true, user: { role: UserRole.TEACHER } },
          orderBy: [{ displayName: "asc" }],
          select: { id: true, displayName: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  return { groups, exams, students, teachers, teacherProfile };
}

export async function saveExamForDashboard(user: AuthenticatedUser, input: ExamFormInput) {
  const examDate = parseExamDate(input.examDate);
  const teacherProfile =
    user.role === "TEACHER" ? await getTeacherProfileForUser(user.id) : null;
  const resolvedTeacherId = user.role === "TEACHER" ? teacherProfile?.id : input.teacherId;

  if (!resolvedTeacherId) {
    throw new Error("missing_teacher");
  }

  const uniqueStudentIds = Array.from(new Set(input.grades.map((grade) => grade.studentId)));

  if (uniqueStudentIds.length !== input.grades.length) {
    throw new Error("duplicate_student_grade");
  }

  return prisma.$transaction(async (tx) => {
    const [group, teacher, activeStudents] = await Promise.all([
      tx.studentGroup.findUnique({ where: { id: input.groupId }, select: { id: true } }),
      tx.teacherProfile.findFirst({
        where: { id: resolvedTeacherId, isActive: true, user: { role: UserRole.TEACHER } },
        select: { id: true },
      }),
      tx.student.findMany({
        where: { groupId: input.groupId, status: "ACTIVE" },
        select: { id: true },
      }),
    ]);

    if (!group) {
      throw new Error("group_not_found");
    }

    if (!teacher) {
      throw new Error("teacher_not_found");
    }

    if (user.role === "TEACHER") {
      const responsibility = await tx.studentGroupTeacher.findUnique({
        where: { groupId_teacherId: { groupId: input.groupId, teacherId: resolvedTeacherId } },
        select: { id: true },
      });

      if (!responsibility) {
        throw new Error("teacher_not_responsible_for_group");
      }
    }

    const activeStudentIds = activeStudents.map((student) => student.id).sort();
    const gradeStudentIds = [...uniqueStudentIds].sort();

    if (
      activeStudentIds.length !== gradeStudentIds.length ||
      activeStudentIds.some((studentId, index) => studentId !== gradeStudentIds[index])
    ) {
      throw new Error("grades_must_match_active_group_students");
    }

    const data = {
      groupId: input.groupId,
      teacherId: resolvedTeacherId,
      title: input.title,
      subject: input.subject || null,
      examDate,
      description: input.description || null,
      status: input.status as ExamStatus,
    };

    if (input.id) {
      const existingExam = await tx.exam.findUnique({
        where: { id: input.id },
        select: { id: true, groupId: true },
      });

      if (!existingExam) {
        throw new Error("exam_not_found");
      }

      if (user.role === "TEACHER") {
        const existingResponsibility = await tx.studentGroupTeacher.findUnique({
          where: {
            groupId_teacherId: {
              groupId: existingExam.groupId,
              teacherId: resolvedTeacherId,
            },
          },
          select: { id: true },
        });

        if (!existingResponsibility) {
          throw new Error("forbidden_exam");
        }
      }

      await tx.examGrade.deleteMany({ where: { examId: input.id } });
      return tx.exam.update({
        where: { id: input.id },
        data: {
          ...data,
          grades: {
            create: input.grades.map((grade) => ({
              studentId: grade.studentId,
              score: grade.score,
              observations: grade.observations || null,
            })),
          },
        },
      });
    }

    return tx.exam.create({
      data: {
        ...data,
        grades: {
          create: input.grades.map((grade) => ({
            studentId: grade.studentId,
            score: grade.score,
            observations: grade.observations || null,
          })),
        },
      },
    });
  });
}
