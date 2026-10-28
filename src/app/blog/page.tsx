import { BlogListView } from "@/modules/blog/views/blog-list-view";
import { normalizeBlogPage } from "@/modules/blog/lib/blog-pagination";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams: Promise<{
    tag?: string;
    page?: string | string[];
  }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag, page } = await searchParams;
  const textMap = await getCmsPublishedTextMapBySlug("/blog");
  return <BlogListView tagSlug={tag} page={normalizeBlogPage(page)} textMap={textMap} />;
}

