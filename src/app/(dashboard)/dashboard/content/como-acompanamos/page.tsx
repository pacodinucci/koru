import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { getCmsDraftTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { ComoAcompanamosContentEditor } from "@/modules/dashboard/components/landing-content-editor";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";

export default async function DashboardComoAcompanamosContentPage() {
  const user = await requireAdmin();
  const initialTextMap = await getCmsDraftTextMapBySlug("/como-acompanamos");
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages}
      breadcrumbPage="Contenido / Cómo acompañamos"
      showPanelToggle
      panelDefaultOpen
      contentNoPadding
    >
      <ComoAcompanamosContentEditor initialTextMap={initialTextMap} />
    </DashboardShell>
  );
}
