import { DashboardBlogView } from "@/modules/blog/views/dashboard-blog-view";
import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";

type DashboardBlogPageProps = {
  searchParams: Promise<{
    ok?: string;
    error?: string;
  }>;
};

export default async function DashboardBlogPage({
  searchParams,
}: DashboardBlogPageProps) {
  const user = await requireAdmin();
  const { ok, error } = await searchParams;
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages}
      breadcrumbPage="Blog"
      showPanelToggle
      panelDefaultOpen
    >
      <DashboardBlogView ok={ok} error={error} />
    </DashboardShell>
  );
}
