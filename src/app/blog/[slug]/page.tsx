import { BlogPostView } from "@/modules/blog/views/blog-post-view";

export const dynamic = "force-dynamic";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    comment?: string;
  }>;
};

export default async function BlogPostPage({
  params,
  searchParams,
}: BlogPostPageProps) {
  const { slug } = await params;
  const { comment } = await searchParams;

  return <BlogPostView slug={slug} commentStatus={comment} />;
}

