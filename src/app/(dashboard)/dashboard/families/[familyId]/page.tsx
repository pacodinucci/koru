import { notFound } from "next/navigation";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardFamilyDetailView } from "@/modules/families/views/dashboard-family-detail-view";

export default async function DashboardFamilyPage({ params }: { params: Promise<{ familyId: string }> }) {
  const [{ familyId }, user, cmsPages] = await Promise.all([params, requirePermission("families.view"), discoverPagesGroupRoutes()]);
  if (!familyId) notFound();
  return <DashboardShell userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys} cmsPages={cmsPages.filter((page) => !page.isDynamic)} breadcrumbPage="Familia"><DashboardFamilyDetailView familyId={familyId} canManagePayments={user.permissionKeys.includes("families.payments")} canWaive={user.permissionKeys.includes("families.waive-balance")} /></DashboardShell>;
}