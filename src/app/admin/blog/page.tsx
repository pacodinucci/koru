import { AdminBlogView } from "@/modules/blog/views/admin-blog-view";
import { AdminBlogPageView } from "@/modules/admin/views/admin-blog-page-view";

type AdminBlogPageProps = {
  searchParams: Promise<{
    ok?: string;
    error?: string;
  }>;
};

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const { ok, error } = await searchParams;

  return (
    <AdminBlogPageView>
      <AdminBlogView ok={ok} error={error} />
    </AdminBlogPageView>
  );
}
