import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardFamiliesView } from "@/modules/families/views/dashboard-families-view";

export default async function DashboardFamiliesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [user, params] = await Promise.all([requirePermission("families.view"), searchParams]);
  const cmsPages = (await discoverPagesGroupRoutes()).filter((page) => !page.isDynamic);
  return <DashboardShell userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys} cmsPages={cmsPages} breadcrumbPage="Familias"><DashboardFamiliesView query={params.q}/></DashboardShell>;
}