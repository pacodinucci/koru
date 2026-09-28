import { requireRole } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { TeacherAgreementForm } from "@/modules/follow-up-agreements/components/teacher-agreement-form";
import { getTeacherAgreementScope } from "@/modules/follow-up-agreements/server/agreements.repository";

export default async function NewFollowUpAgreementPage() {
  const user = await requireRole(["TEACHER", "ADMIN_TEACHER"]);
  const [pages, scope] = await Promise.all([discoverPagesGroupRoutes(), getTeacherAgreementScope(user.id)]);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={pages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Nuevo acuerdo"
    >
      <TeacherAgreementForm students={scope?.students ?? []} />
    </DashboardShell>
  );
}
