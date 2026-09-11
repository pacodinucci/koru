import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardDocumentsView } from "@/modules/documents/components/dashboard-documents-view";
export default async function DashboardDocumentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [user, { ok, error }, cmsPages] = await Promise.all([requirePermission("documents.view"), searchParams, discoverPagesGroupRoutes()]);
  return <DashboardShell userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys} cmsPages={cmsPages.filter((page) => !page.isDynamic)} breadcrumbPage="Documentos"><DashboardDocumentsView ok={ok} error={error} /></DashboardShell>;
}
