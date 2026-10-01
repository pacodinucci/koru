import { DashboardStudentsClient } from "@/modules/students/components/dashboard-students-client";
import {
  listStudentGroups,
  listStudentsForViewer,
} from "@/modules/students/server/students.repository";
import { getTeachersFromGroupResponsibilities } from "@/modules/students/lib/group-teachers";
import type { AuthenticatedUser } from "@/modules/auth/server/auth-guards";

export async function DashboardStudentsView({ user }: { user: AuthenticatedUser }) {
  const [students, groups] = await Promise.all([
    listStudentsForViewer(user),
    listStudentGroups(user),
  ]);

  return (
    <DashboardStudentsClient
      students={students.map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        birthDate: student.birthDate.toISOString(),
        groupId: student.groupId,
        status: student.status,
        recordStatus: student.recordStatus,
        questionnaireStatus: student.admissionQuestionnaire?.submittedAt ? "COMPLETED" : student.admissionQuestionnaire ? "DRAFT" : "PENDING",
        updatedAt: student.updatedAt.toISOString(),
        notes: student.notes,
        group: student.group,
        teachers: getTeachersFromGroupResponsibilities(student.group.teacherResponsibilities),
        guardians: student.guardians.map((guardian) => ({
          id: guardian.id,
          email: guardian.email,
          fullName: guardian.fullName,
          phone: guardian.phone,
          relationship: guardian.relationship,
          isPrimary: guardian.isPrimary,
          canPickup: guardian.canPickup,
          emergencyContact: guardian.emergencyContact,
          user: guardian.user,
        })),
      }))}
      groups={groups}
      familyUsers={[]}
      readOnly
    />
  );
}
