import { BlogPostStatus, BlogPostVisibility } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const blogTagSelect = {
  tag: {
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      groupId: true,
    },
  },
};

export async function getPublishedPosts({
  userId,
  tagSlug,
}: {
  userId?: string;
  tagSlug?: string;
} = {}) {
  return prisma.blogPost.findMany({
    where: {
      status: BlogPostStatus.PUBLISHED,
      ...(userId ? {} : { visibility: BlogPostVisibility.PUBLIC }),
      ...(tagSlug
        ? {
            tags: {
              some: {
                tag: {
                  slug: tagSlug,
                },
              },
            },
          }
        : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      contentBlocks: true,
      visibility: true,
      authorName: true,
      publishedAt: true,
      createdAt: true,
      tags: {
        select: blogTagSelect,
        orderBy: { tag: { name: "asc" } },
      },
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
      ...(userId ? {} : { visibility: BlogPostVisibility.PUBLIC }),
    },
    include: {
      tags: {
        select: blogTagSelect,
        orderBy: { tag: { name: "asc" } },
      },
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

export async function getPublishedPostAccessBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      status: BlogPostStatus.PUBLISHED,
    },
    select: {
      id: true,
      visibility: true,
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
      visibility: true,
      createdAt: true,
      publishedAt: true,
      tags: {
        select: blogTagSelect,
        orderBy: { tag: { name: "asc" } },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });
}

export async function getDashboardPostById(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      contentBlocks: true,
      status: true,
      visibility: true,
      tags: {
        select: blogTagSelect,
      },
    },
  });
}

export async function getBlogTagOptions() {
  const [groups, customTags] = await Promise.all([
    prisma.studentGroup.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.blogTag.findMany({
      where: { type: "CUSTOM" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  return { groups, customTags };
}

export async function getPublishedBlogTags(userId?: string) {
  return prisma.blogTag.findMany({
    where: {
      posts: {
        some: {
          post: {
            status: BlogPostStatus.PUBLISHED,
            ...(userId ? {} : { visibility: BlogPostVisibility.PUBLIC }),
          },
        },
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
  });
}
