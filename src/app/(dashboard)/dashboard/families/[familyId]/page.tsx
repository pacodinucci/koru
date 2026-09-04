import { notFound } from "next/navigation";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardFamilyDetailView } from "@/modules/families/views/dashboard-family-detail-view";

export default async function DashboardFamilyPage({ params }: { params: Promise<{ familyId: string }> }) {
  const [{ familyId }, user, cmsPages] = await Promise.all([params, requireAdmin(), discoverPagesGroupRoutes()]);
  if (!familyId) notFound();
  return <DashboardShell userEmail={user.email} userRole={user.role} cmsPages={cmsPages.filter((page) => !page.isDynamic)} breadcrumbPage="Familia"><DashboardFamilyDetailView familyId={familyId} canWaive={user.role === "SUPERADMIN"} /></DashboardShell>;
}