import { requirePermission } from "@/modules/auth/server/auth-guards";
import { getCmsDraftTextMap } from "@/modules/cms/server/cms-text.repository";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";

export default async function DashboardLandingPage() {
  const user = await requirePermission("content.view");
  const initialTextMap = await getCmsDraftTextMap();
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      initialTextMap={initialTextMap}
      cmsPageSlug="/"
      editorMode="page"
    />
  );
}
