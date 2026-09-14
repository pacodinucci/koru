import { notFound } from "next/navigation";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { getCmsContentPage, type CmsContentPageKey } from "@/modules/cms/content-page-config";
import { getCmsDraftImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsDraftTextMap, getCmsDraftTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { AdditionalPageContentEditor } from "@/modules/dashboard/components/additional-page-content-editor";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { SiteChromeContentEditor } from "@/modules/dashboard/components/site-chrome-content-editor";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";

const chromePages = new Set(["navbar", "footer"]);

export default async function DashboardContentPage({ params }: { params: Promise<{ page: string }> }) {
  const user = await requirePermission("content.view");
  const { page: pageKey } = await params;
  const isChromePage = chromePages.has(pageKey);
  const page = isChromePage ? null : getCmsContentPage(pageKey);
  if (!isChromePage && !page) notFound();

  const [initialTextMap, initialImageMap, cmsPages] = await Promise.all([
    isChromePage ? getCmsDraftTextMap() : getCmsDraftTextMapBySlug(page!.slug),
    isChromePage ? getCmsDraftImageMapBySlug("/") : getCmsDraftImageMapBySlug(page!.slug),
    discoverPagesGroupRoutes(),
  ]);
  const label = pageKey === "navbar" ? "Navbar" : pageKey === "footer" ? "Footer" : page!.label;

  return (
    <DashboardShell userEmail={user.email} userRole={user.role} userPermissions={user.permissionKeys} cmsPages={cmsPages.filter((item) => !item.isDynamic)} breadcrumbPage={`Contenido / ${label}`} contentNoPadding showPanelToggle panelDefaultOpen>
      {isChromePage ? <SiteChromeContentEditor chrome={pageKey as "navbar" | "footer"} initialTextMap={initialTextMap} initialImageMap={initialImageMap} /> : <AdditionalPageContentEditor pageKey={pageKey as CmsContentPageKey} initialTextMap={initialTextMap} initialImageMap={initialImageMap} />}
    </DashboardShell>
  );
}