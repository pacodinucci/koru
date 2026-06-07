import { DashboardExamsClient } from "@/modules/exams/components/dashboard-exams-client";
import { listExamsDashboardData } from "@/modules/exams/server/exams.repository";
import type { AuthenticatedUser } from "@/modules/auth/server/auth-guards";

export async function DashboardExamsView({ user }: { user: AuthenticatedUser }) {
  const { groups, exams, students, teachers } = await listExamsDashboardData(user);

  return (
    <DashboardExamsClient
      userRole={user.role}
      groups={groups.map((group) => ({
        id: group.id,
        name: group.name,
        ageRange: group.ageRange,
        teachers: group.teacherResponsibilities.map((responsibility) => responsibility.teacher),
      }))}
      students={students}
      teachers={teachers}
      exams={exams.map((exam) => ({
        id: exam.id,
        groupId: exam.groupId,
        teacherId: exam.teacherId,
        title: exam.title,
        subject: exam.subject,
        examDate: exam.examDate.toISOString(),
        description: exam.description,
        status: exam.status,
        group: exam.group,
        teacher: exam.teacher,
        grades: exam.grades.map((grade) => ({
          studentId: grade.studentId,
          score: grade.score.toString(),
          observations: grade.observations,
          student: grade.student,
        })),
      }))}
    />
  );
}
