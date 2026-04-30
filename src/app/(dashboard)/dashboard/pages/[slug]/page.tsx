import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { discoverPagesGroupRoutes } from "@/modules/admin/server/cms-pages.repository";
import { getCmsDraftTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";

type DashboardCmsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DashboardCmsPage({ params }: DashboardCmsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { slug } = await params;
  const decodedSlug = `/${decodeURIComponent(slug)}`;
  const cmsPages = await discoverPagesGroupRoutes();
  const staticPages = cmsPages.filter((page) => !page.isDynamic);
  const initialTextMap = await getCmsDraftTextMapBySlug(decodedSlug);

  return (
    <DashboardShell
      userEmail={session.user.email}
      cmsPages={staticPages}
      initialTextMap={initialTextMap}
      cmsPageSlug={decodedSlug}
      cmsPreviewUrl={decodedSlug !== "/" ? decodedSlug : undefined}
      editorMode={decodedSlug === "/" ? "page" : "layout"}
      breadcrumbPage={`CMS / Pages / ${decodedSlug}`}
    />
  );
}
