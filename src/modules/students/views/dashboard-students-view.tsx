import { DashboardStudentsClient } from "@/modules/students/components/dashboard-students-client";
import {
  listFamilyUsersForSelect,
  listStudentGroups,
  listStudentsForAdmin,
} from "@/modules/students/server/students.repository";
import { getTeachersFromGroupResponsibilities } from "@/modules/students/lib/group-teachers";

export async function DashboardStudentsView() {
  const [students, groups, familyUsers] = await Promise.all([
    listStudentsForAdmin(),
    listStudentGroups(),
    listFamilyUsersForSelect(),
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
        notes: student.notes,
        group: student.group,
        teachers: getTeachersFromGroupResponsibilities(student.group.teacherResponsibilities),
        guardians: student.guardians.map((guardian) => ({
          id: guardian.id,
          email: guardian.email,
          relationship: guardian.relationship,
          isPrimary: guardian.isPrimary,
          canPickup: guardian.canPickup,
          emergencyContact: guardian.emergencyContact,
          user: guardian.user,
        })),
      }))}
      groups={groups}
      familyUsers={familyUsers}
    />
  );
}
