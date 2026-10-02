import type { Metadata } from "next";

import { BlogPostView } from "@/modules/blog/views/blog-post-view";
import { getPublicPublishedPostMetadataBySlug } from "@/modules/blog/server/blog.repository";

export const dynamic = "force-dynamic";

const defaultShareImage = "/branding/koru-logo.png";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    comment?: string;
  }>;
};

function getShareImage(content: string) {
  const source = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  if (!source) return defaultShareImage;

  if (source.startsWith("/") && !source.startsWith("//")) return source;

  try {
    const imageUrl = new URL(source);
    return imageUrl.protocol === "http:" || imageUrl.protocol === "https:"
      ? imageUrl.href
      : defaultShareImage;
  } catch {
    return defaultShareImage;
  }
}

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
      images: [{ url: getShareImage(post.content), alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [getShareImage(post.content)],
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
