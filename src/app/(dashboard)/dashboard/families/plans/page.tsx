import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardPlansView } from "@/modules/families/views/dashboard-plans-view";

export default async function DashboardPlansPage() {
  const user = await requireAdmin();
  const cmsPages = (await discoverPagesGroupRoutes()).filter((page) => !page.isDynamic);
  return <DashboardShell userEmail={user.email} userRole={user.role} cmsPages={cmsPages} breadcrumbPage="Planes"><DashboardPlansView /></DashboardShell>;
}