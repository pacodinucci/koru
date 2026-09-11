import { requirePermission } from "@/modules/auth/server/auth-guards";
import { getCmsDraftImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsDraftTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { QuienesSomosContentEditor } from "@/modules/dashboard/components/landing-content-editor";

export default async function DashboardQuienesSomosContentPage() {
  const user = await requirePermission("content.view");
  const [initialTextMap, initialImageMap] = await Promise.all([
    getCmsDraftTextMapBySlug("/quienes-somos"),
    getCmsDraftImageMapBySlug("/quienes-somos"),
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
      breadcrumbPage="Contenido / Quienes Somos"
      showPanelToggle
      panelDefaultOpen
      contentNoPadding
    >
      <QuienesSomosContentEditor initialTextMap={initialTextMap} initialImageMap={initialImageMap} />
    </DashboardShell>
  );
}
