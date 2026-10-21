import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardRubricsView } from "@/modules/families/views/dashboard-rubrics-view";

export default async function DashboardRubricsPage() {
  const user = await requirePermission("families.view");
  const cmsPages = (await discoverPagesGroupRoutes()).filter((page) => !page.isDynamic);
  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Rubros"
    >
      <DashboardRubricsView canManage={user.permissionKeys.includes("families.manage")} />
    </DashboardShell>
  );
}
