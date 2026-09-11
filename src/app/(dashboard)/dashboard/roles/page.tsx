import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { listRolesWithPermissions } from "@/modules/roles/server/role.repository";
import { DashboardRolesView } from "@/modules/roles/views/dashboard-roles-view";

export default async function DashboardRolesPage() {
  const [user, roles, cmsPages] = await Promise.all([
    requirePermission("roles.view"),
    listRolesWithPermissions(),
    discoverPagesGroupRoutes(),
  ]);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Roles"
    >
      <DashboardRolesView
        roles={roles}
        canManage={user.permissionKeys.includes("roles.manage")}
        actorPermissions={user.permissionKeys}
        currentRoleKey={user.accessRoleKey}
      />
    </DashboardShell>
  );
}

