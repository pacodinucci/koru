import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardExamsView } from "@/modules/exams/views/dashboard-exams-view";

export default async function DashboardExamsPage() {
  const user = await requirePermission("exams.view");
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Exámenes"
    >
      <DashboardExamsView user={user} />
    </DashboardShell>
  );
}
