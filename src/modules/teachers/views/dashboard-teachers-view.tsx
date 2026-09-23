import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherInvitationImport } from "@/modules/teachers/components/teacher-invitation-import";
import { DashboardTeachersClient } from "@/modules/teachers/components/dashboard-teachers-client";
import { listStudentGroups } from "@/modules/students/server/students.repository";
import { countStudentsFromGroupResponsibilities } from "@/modules/teachers/lib/group-student-count";
import { listTeacherProfilesForAdmin } from "@/modules/teachers/server/teachers.repository";

export async function DashboardTeachersView() {
  const [teachers, groups] = await Promise.all([
    listTeacherProfilesForAdmin(),
    listStudentGroups(),
  ]);

  return (
    <DashboardTeachersClient
      teachers={teachers.map((teacher) => ({
        id: teacher.id,
        displayName: teacher.displayName,
        email: teacher.email,
        phone: teacher.phone,
        bio: teacher.bio,
        position: teacher.position,
        organizationGroup: teacher.organizationGroup ?? teacher.pendingOrganizationGroup,
        isActive: teacher.isActive,
        user: teacher.user,
        groups: teacher.groupResponsibilities.map((responsibility) => responsibility.group),
        studentsCount: countStudentsFromGroupResponsibilities(teacher.groupResponsibilities),
      }))}
      groups={groups}
    />
  );
}
