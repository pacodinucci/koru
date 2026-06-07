import { requireDashboardUser } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardExamsView } from "@/modules/exams/views/dashboard-exams-view";

export default async function DashboardExamsPage() {
  const user = await requireDashboardUser();
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      cmsPages={cmsPages}
      breadcrumbPage="Exámenes"
    >
      <DashboardExamsView user={user} />
    </DashboardShell>
  );
}
