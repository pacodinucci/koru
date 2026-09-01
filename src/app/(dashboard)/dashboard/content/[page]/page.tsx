import { notFound } from "next/navigation";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import {
  getCmsContentPage,
  type CmsContentPageKey,
} from "@/modules/cms/content-page-config";
import { getCmsDraftImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsDraftTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { AdditionalPageContentEditor } from "@/modules/dashboard/components/additional-page-content-editor";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";

export default async function DashboardContentPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const user = await requireAdmin();
  const { page: pageKey } = await params;
  const page = getCmsContentPage(pageKey);
  if (!page) {
    notFound();
  }

  const [initialTextMap, initialImageMap, cmsPages] = await Promise.all([
    getCmsDraftTextMapBySlug(page.slug),
    getCmsDraftImageMapBySlug(page.slug),
    discoverPagesGroupRoutes(),
  ]);

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages.filter((item) => !item.isDynamic)}
      breadcrumbPage={`Contenido / ${page.label}`}
      contentNoPadding
      showPanelToggle
      panelDefaultOpen
    >
      <AdditionalPageContentEditor
        pageKey={pageKey as CmsContentPageKey}
        initialTextMap={initialTextMap}
        initialImageMap={initialImageMap}
      />
    </DashboardShell>
  );
}
