import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardTeachersView } from "@/modules/teachers/views/dashboard-teachers-view";

export default async function DashboardTeachersPage() {
  const user = await requirePermission("teachers.view");
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Docentes"
    >
      <DashboardTeachersView />
    </DashboardShell>
  );
}
