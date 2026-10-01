import type { Metadata } from "next";

import { BlogPostView } from "@/modules/blog/views/blog-post-view";
import { getPublicPublishedPostMetadataBySlug } from "@/modules/blog/server/blog.repository";

export const dynamic = "force-dynamic";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    comment?: string;
  }>;
};

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPublishedPostMetadataBySlug(slug);

  if (!post) return {};

  return {
    title: `${post.title} | Koru`,
    description: post.excerpt,
    openGraph: {
      type: "article",
      siteName: "Koru",
      title: post.title,
      description: post.excerpt,
      images: [{ url: "/branding/koru-logo.png", alt: "Koru" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ["/branding/koru-logo.png"],
    },
  };
}

export default async function BlogPostPage({
  params,
  searchParams,
}: BlogPostPageProps) {
  const { slug } = await params;
  const { comment } = await searchParams;

  return <BlogPostView slug={slug} commentStatus={comment} />;
}
