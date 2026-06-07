import { notFound } from "next/navigation";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { discoverPagesGroupRoutes } from "@/modules/dashboard/server/cms-pages.repository";
import { BlogEventToast } from "@/modules/blog/components/blog-event-toast";
import { DashboardBlogComposer } from "@/modules/blog/components/dashboard-blog-composer";
import {
  getBlogTagOptions,
  getDashboardPostById,
} from "@/modules/blog/server/blog.repository";

type EditBlogPostPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    ok?: string;
    error?: string;
  }>;
};

export default async function EditBlogPostPage({
  params,
  searchParams,
}: EditBlogPostPageProps) {
  const user = await requireAdmin();
  const { id } = await params;
  const { ok, error } = await searchParams;
  const [post, tagOptions] = await Promise.all([
    getDashboardPostById(id),
    getBlogTagOptions(),
  ]);

  if (!post) {
    notFound();
  }

  const cmsPages = (await discoverPagesGroupRoutes()).filter(
    (page) => !page.isDynamic,
  );

  return (
    <DashboardShell
      userEmail={user.email}
      cmsPages={cmsPages}
      breadcrumbPage="Editar blog"
      showPanelToggle
      panelDefaultOpen
    >
      <BlogEventToast ok={ok} error={error} />
      <DashboardBlogComposer tagOptions={tagOptions} editingPost={post} />
    </DashboardShell>
  );
}
