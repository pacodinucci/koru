import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardUsersView } from "@/modules/users/views/dashboard-users-view";

export default async function DashboardUsersPage() {
  const user = await requireAdmin();
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages}
      breadcrumbPage="Usuarios"
    >
      <DashboardUsersView />
    </DashboardShell>
  );
}
