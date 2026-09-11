import { requirePermission } from "@/modules/auth/server/auth-guards";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { getCmsDraftTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";

type DashboardCmsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DashboardCmsPage({ params }: DashboardCmsPageProps) {
  const user = await requirePermission("content.view");
  const { slug } = await params;
  const decodedSlug = `/${decodeURIComponent(slug)}`;
  const cmsPages = await discoverPagesGroupRoutes();
  const staticPages = cmsPages.filter((page) => !page.isDynamic);
  const initialTextMap = await getCmsDraftTextMapBySlug(decodedSlug);

  return (
    <DashboardShell
      userEmail={user.email}
      userRole={user.role}
      userPermissions={user.permissionKeys}
      cmsPages={staticPages}
      initialTextMap={initialTextMap}
      cmsPageSlug={decodedSlug}
      cmsPreviewUrl={decodedSlug !== "/" ? decodedSlug : undefined}
      editorMode={decodedSlug === "/" ? "page" : "layout"}
      breadcrumbPage={`CMS / Pages / ${decodedSlug}`}
    />
  );
}
