import { requireRole } from "@/modules/auth/server/auth-guards";
import { AdministrationDashboardView } from "@/modules/administration/views/administration-dashboard-view";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";

function resolvePeriod(month: string | undefined) {
  const match = month?.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  const year = match ? Number(match[1]) : now.getFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : now.getMonth();
  const from = new Date(
    monthIndex >= 0 && monthIndex <= 11 ? year : now.getFullYear(),
    monthIndex >= 0 && monthIndex <= 11 ? monthIndex : now.getMonth(),
    1,
  );

  return {
    from,
    to: new Date(from.getFullYear(), from.getMonth() + 1, 1),
    key: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`,
  };
}

export default async function AdministrationPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ month }, user, cmsPages] = await Promise.all([
    searchParams,
    requireRole(["SUPERADMIN"]),
    discoverPagesGroupRoutes(),
  ]);
  const period = resolvePeriod(month);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages.filter((page) => !page.isDynamic)}
      breadcrumbPage="Administración"
    >
      <AdministrationDashboardView period={period} periodKey={period.key} />
    </DashboardShell>
  );
}