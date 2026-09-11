import { requirePermission } from "@/modules/auth/server/auth-guards";
import { getCmsDraftImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsDraftTextMap } from "@/modules/cms/server/cms-text.repository";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { LandingContentEditor } from "@/modules/dashboard/components/landing-content-editor";

export default async function DashboardLandingContentPage() {
  const user = await requirePermission("content.view");
  const [initialTextMap, initialImageMap] = await Promise.all([
    getCmsDraftTextMap(),
    getCmsDraftImageMapBySlug("/"),
  ]);
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={cmsPages}
      breadcrumbPage="Contenido / Landing"
      showPanelToggle
      panelDefaultOpen
      contentNoPadding
    >
      <LandingContentEditor initialTextMap={initialTextMap} initialImageMap={initialImageMap} />
    </DashboardShell>
  );
}
