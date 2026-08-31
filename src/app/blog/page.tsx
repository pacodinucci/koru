import { BlogListView } from "@/modules/blog/views/blog-list-view";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams: Promise<{
    tag?: string;
  }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag } = await searchParams;
  const textMap = await getCmsPublishedTextMapBySlug("/blog");
  return <BlogListView tagSlug={tag} textMap={textMap} />;
}

