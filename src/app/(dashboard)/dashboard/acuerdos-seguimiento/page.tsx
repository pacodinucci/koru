import { requireRole } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { TeacherAgreementsClient } from "@/modules/follow-up-agreements/components/teacher-agreements-client";
import { getTeacherAgreementScope, listTeacherAgreements } from "@/modules/follow-up-agreements/server/agreements.repository";

export default async function FollowUpAgreementsPage() {
  const user = await requireRole(["TEACHER", "ADMIN_TEACHER"]);
  const [pages, scope] = await Promise.all([discoverPagesGroupRoutes(), getTeacherAgreementScope(user.id)]);
  const cmsPages = pages.filter((page) => !page.isDynamic);
  const agreements = scope ? await listTeacherAgreements(scope.teacherId) : [];

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Acuerdos de seguimiento"
    >
      <TeacherAgreementsClient
        agreements={agreements.map((agreement) => ({
          id: agreement.id,
          title: agreement.title,
          body: agreement.body,
          status: agreement.status,
          attachmentFileName: agreement.attachmentFileName,
          createdAt: agreement.createdAt.toISOString(),
          publishedAt: agreement.publishedAt?.toISOString() ?? null,
          families: agreement.families.map((item) => ({
            id: item.familyId,
            name: item.family.name,
            consentedAt: item.consentedAt?.toISOString() ?? null,
            consentedBy: item.consentedBy?.name ?? null,
          })),
          students: agreement.students.map((item) => ({
            id: item.studentId,
            name: `${item.student.firstName} ${item.student.lastName}`,
          })),
        }))}
      />
    </DashboardShell>
  );
}
