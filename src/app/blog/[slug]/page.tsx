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

  const postUrl = `/blog/${encodeURIComponent(slug)}`;

  return {
    alternates: { canonical: postUrl },
    title: `${post.title} | Koru`,
    description: post.excerpt,
    openGraph: {
      type: "article",
      url: postUrl,
      siteName: "Koru",
      title: post.title,
      description: post.excerpt,
      images: post.imageUrl ? [{ url: post.imageUrl, alt: post.title }] : [],
    },
    twitter: {
      card: post.imageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
      images: post.imageUrl ? [post.imageUrl] : [],
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
