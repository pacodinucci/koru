import { BlogListView } from "@/modules/blog/views/blog-list-view";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams: Promise<{
    tag?: string;
  }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag } = await searchParams;
  return <BlogListView tagSlug={tag} />;
}

