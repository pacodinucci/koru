import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardMailingView } from "@/modules/mailing/views/dashboard-mailing-view";

export default async function DashboardMailingPage() {
  const user = await requirePermission("mailing.view");
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Mailing"
    >
      <DashboardMailingView />
    </DashboardShell>
  );
}
