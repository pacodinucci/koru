import { requireRole } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { TeacherFollowUpAgreementsClient } from "@/modules/follow-up-agreements/components/teacher-follow-up-agreements-client";
import { listOwnTeacherFollowUpAgreements } from "@/modules/follow-up-agreements/server/teacher-follow-up-agreements.repository";

export default async function OwnTeacherFollowUpAgreementsPage() {
  const user = await requireRole(["TEACHER", "ADMIN_TEACHER"]);
  const agreements = await listOwnTeacherFollowUpAgreements();
  const cmsPages = (await discoverPagesGroupRoutes()).filter((page) => !page.isDynamic);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Mis acuerdos de seguimiento"
    >
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-900">Mis acuerdos de seguimiento</h1>
        <TeacherFollowUpAgreementsClient agreements={agreements} mode="recipient" />
      </div>
    </DashboardShell>
  );
}
