import { BlogPostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getPublishedPosts(userId?: string) {
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
          likes: true,
        },
      },
      likes: userId
        ? {
            where: { userId },
            select: { id: true },
            take: 1,
          }
        : false,
    },
  });
}

export async function getPublishedPostBySlug(slug: string, userId?: string) {
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
      likes: userId
        ? {
            where: { userId },
            select: { id: true },
            take: 1,
          }
        : false,
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });
}

export async function getDashboardPosts() {
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

