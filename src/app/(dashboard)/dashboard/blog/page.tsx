import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminBlogView } from "@/modules/blog/views/admin-blog-view";
import { discoverPagesGroupRoutes } from "@/modules/admin/server/cms-pages.repository";
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { ok, error } = await searchParams;
  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={session.user.email}
      cmsPages={cmsPages}
      breadcrumbPage="Blog"
      showPanelToggle
      panelDefaultOpen
    >
      <AdminBlogView ok={ok} error={error} />
    </DashboardShell>
  );
}
