import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardStudentsView } from "@/modules/students/views/dashboard-students-view";

export default async function DashboardStudentsPage() {
  const user = await requireAdmin();
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages}
      breadcrumbPage="Alumnos"
    >
      <DashboardStudentsView />
    </DashboardShell>
  );
}
