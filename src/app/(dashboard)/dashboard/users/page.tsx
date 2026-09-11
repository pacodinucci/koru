import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardUsersView } from "@/modules/users/views/dashboard-users-view";

export default async function DashboardUsersPage() {
  const user = await requirePermission("users.view");
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Usuarios"
    >
      <DashboardUsersView
        currentAdminId={user.id}
        canManage={user.permissionKeys.includes("users.manage")}
        actorPermissions={user.permissionKeys}
        currentRoleKey={user.accessRoleKey}
      />
    </DashboardShell>
  );
}
