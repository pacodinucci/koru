import { requireDashboardUser } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { KanbanWorkspace } from "@/modules/kanban/components/kanban-workspace";

export default async function KanbanPage() {
  const user = await requireDashboardUser();
  const cmsPages = await discoverPagesGroupRoutes();

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Tableros"
    >
      <KanbanWorkspace />
    </DashboardShell>
  );
}
