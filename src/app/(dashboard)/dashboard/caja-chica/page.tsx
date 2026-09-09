import { requireDashboardUser } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { CashFundDashboardView } from "@/modules/operations/views/cash-fund-dashboard-view";

export default async function CashFundPage() {
  const [user, cmsPages] = await Promise.all([
    requireDashboardUser(),
    discoverPagesGroupRoutes(),
  ]);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Caja chica"
    >
      <CashFundDashboardView user={user} />
    </DashboardShell>
  );
}

