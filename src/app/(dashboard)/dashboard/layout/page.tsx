import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { getCmsDraftTextMap } from "@/modules/cms/server/cms-text.repository";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";

export default async function DashboardLayoutPage() {
  const user = await requireAdmin();
  const initialTextMap = await getCmsDraftTextMap();
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages}
      initialTextMap={initialTextMap}
      editorMode="layout"
    />
  );
}
