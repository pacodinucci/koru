import { requireDashboardUser } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { InventoryDashboardView } from "@/modules/operations/views/inventory-dashboard-view";

export default async function InventoryPage() {
  const [user, cmsPages] = await Promise.all([
    requireDashboardUser(),
    discoverPagesGroupRoutes(),
  ]);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Inventario"
    >
      <InventoryDashboardView user={user} />
    </DashboardShell>
  );
}

