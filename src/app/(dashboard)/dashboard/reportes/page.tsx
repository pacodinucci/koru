import { requireRole } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { TeacherReportsView } from "@/modules/teachers/views/teacher-reports-view";

export default async function TeacherReportsPage() {
  const user = await requireRole(["TEACHER", "ADMIN_TEACHER"]);
  const cmsPages = (await discoverPagesGroupRoutes()).filter((page) => !page.isDynamic);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Reportes"
    >
      <TeacherReportsView userId={user.id} />
    </DashboardShell>
  );
}
