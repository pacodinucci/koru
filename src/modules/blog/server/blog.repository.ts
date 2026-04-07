import { BlogPostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { status: BlogPostStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      contentBlocks: true,
      authorName: true,
      publishedAt: true,
      createdAt: true,
      _count: {
        select: {
          comments: {
            where: {
              approved: true,
            },
          },
        },
      },
    },
  });
}

export async function getPublishedPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      status: BlogPostStatus.PUBLISHED,
    },
    include: {
      comments: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getAdminPosts() {
  return prisma.blogPost.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      createdAt: true,
      publishedAt: true,
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });
}
