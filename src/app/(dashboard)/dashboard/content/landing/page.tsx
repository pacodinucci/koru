import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { getCmsDraftTextMap } from "@/modules/cms/server/cms-text.repository";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { LandingContentEditor } from "@/modules/dashboard/components/landing-content-editor";

export default async function DashboardLandingContentPage() {
  const user = await requireAdmin();
  const initialTextMap = await getCmsDraftTextMap();
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages}
      breadcrumbPage="Contenido / Landing"
      showPanelToggle
      panelDefaultOpen
      contentNoPadding
    >
      <LandingContentEditor initialTextMap={initialTextMap} />
    </DashboardShell>
  );
}
