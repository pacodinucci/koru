import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardMailingView } from "@/modules/mailing/views/dashboard-mailing-view";

export default async function DashboardMailingPage() {
  const user = await requireAdmin();
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages}
      breadcrumbPage="Mailing"
    >
      <DashboardMailingView />
    </DashboardShell>
  );
}
