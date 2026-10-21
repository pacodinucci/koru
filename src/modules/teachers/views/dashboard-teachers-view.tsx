import { requireRole } from "@/modules/auth/server/auth-guards";
import { DashboardTeachersClient } from "@/modules/teachers/components/dashboard-teachers-client";
import { listStudentGroups } from "@/modules/students/server/students.repository";
import { countStudentsFromGroupResponsibilities } from "@/modules/teachers/lib/group-student-count";
import { listTeacherProfilesForAdmin } from "@/modules/teachers/server/teachers.repository";

export async function DashboardTeachersView() {
  const user = await requireRole(["SUPERADMIN"]);
  const [teachers, groups] = await Promise.all([
    listTeacherProfilesForAdmin(),
    listStudentGroups(),
  ]);

  return (
    <div className="space-y-4">
      <DashboardTeachersClient
      canManageReports={user.role === "SUPERADMIN"}
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
    </div>
  );
}
