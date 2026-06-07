"use server";

import { BlogPostStatus, BlogPostVisibility, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { prisma } from "@/lib/prisma";

const createPostSchema = z.object({
  title: z.string().min(4).max(180),
  excerpt: z.string().min(8).max(220),
  slug: z.string().trim().min(1).max(180),
  contentJson: z.string().min(2),
  contentHtml: z.string().min(2),
  status: z.nativeEnum(BlogPostStatus),
  visibility: z.nativeEnum(BlogPostVisibility),
});

const createCommentSchema = z.object({
  slug: z.string().trim().min(1),
  content: z.string().min(4).max(1200),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveDashboardPath(formData: FormData) {
  const raw = String(formData.get("dashboardPath") ?? "").trim();
  if (raw === "/dashboard/blog" || /^\/dashboard\/blog\/[^/]+\/edit$/.test(raw)) {
    return raw;
  }
  return "/dashboard/blog";
}

function buildDashboardError(message: string, dashboardPath: string) {
  const params = new URLSearchParams({ error: message });
  return `${dashboardPath}?${params.toString()}`;
}

function buildDashboardSuccess(message: string, dashboardPath: string) {
  const params = new URLSearchParams({ ok: message });
  return `${dashboardPath}?${params.toString()}`;
}

function buildCommentPath(slug: string, message?: string) {
  if (!message) {
    return `/blog/${slug}`;
  }

  const params = new URLSearchParams({ comment: message });
  return `/blog/${slug}?${params.toString()}`;
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCustomTagNames(formData: FormData) {
  const raw = String(formData.get("customTags") ?? "");
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => tag.slice(0, 48)),
    ),
  );
}

async function resolveBlogTagIds(
  tx: Prisma.TransactionClient,
  formData: FormData,
) {
  const tagIds = new Set<string>();
  const groupIds = Array.from(
    new Set(
      formData
        .getAll("groupTagIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (groupIds.length > 0) {
    const groups = await tx.studentGroup.findMany({
      where: {
        id: { in: groupIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    for (const group of groups) {
      const tag = await tx.blogTag.upsert({
        where: { slug: `grupo-${group.slug}` },
        create: {
          name: group.name,
          slug: `grupo-${group.slug}`,
          type: "GROUP",
          groupId: group.id,
        },
        update: {
          name: group.name,
          type: "GROUP",
          groupId: group.id,
        },
        select: { id: true },
      });
      tagIds.add(tag.id);
    }
  }

  for (const name of parseCustomTagNames(formData)) {
    const baseSlug = slugify(name);
    if (!baseSlug) {
      continue;
    }

    const existing = await tx.blogTag.findUnique({
      where: { slug: baseSlug },
      select: { id: true, type: true },
    });
    const slug = existing?.type === "GROUP" ? `custom-${baseSlug}` : baseSlug;

    const tag = await tx.blogTag.upsert({
      where: { slug },
      create: {
        name,
        slug,
        type: "CUSTOM",
      },
      update: {
        name,
      },
      select: { id: true },
    });
    tagIds.add(tag.id);
  }

  return Array.from(tagIds);
}

async function syncBlogPostTags(
  tx: Prisma.TransactionClient,
  postId: string,
  formData: FormData,
) {
  const tagIds = await resolveBlogTagIds(tx, formData);

  await tx.blogPostTag.deleteMany({
    where: { postId },
  });

  if (tagIds.length === 0) {
    return;
  }

  await tx.blogPostTag.createMany({
    data: tagIds.map((tagId) => ({ postId, tagId })),
    skipDuplicates: true,
  });
}

export async function createBlogPostAction(formData: FormData) {
  const dashboardPath = resolveDashboardPath(formData);
  const user = await requireAdmin();

  const rawTitle = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const normalizedSlug = slugify(rawSlug || rawTitle);

  const parsed = createPostSchema.safeParse({
    title: rawTitle,
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    slug: normalizedSlug,
    contentJson: String(formData.get("contentJson") ?? "").trim(),
    contentHtml: String(formData.get("contentHtml") ?? "").trim(),
    status: formData.get("status"),
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    redirect(buildDashboardError("Revisa los datos del post.", dashboardPath));
  }

  const exists = await prisma.blogPost.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });

  if (exists) {
    redirect(buildDashboardError("El slug ya existe.", dashboardPath));
  }

  let parsedContentJson: Prisma.InputJsonValue = {};
  try {
    parsedContentJson = JSON.parse(parsed.data.contentJson) as Prisma.InputJsonValue;
  } catch {
    redirect(buildDashboardError("El contenido del post es invalido.", dashboardPath));
  }

  if (parsed.data.contentHtml.includes('data-placeholder=\"true\"')) {
    redirect(
      buildDashboardError(
        "Completa todas las imagenes pendientes de la galeria antes de guardar.",
        dashboardPath,
      ),
    );
  }

  const plainTextContent = stripHtml(parsed.data.contentHtml);
  if (plainTextContent.length < 30) {
    redirect(
      buildDashboardError(
        "El post necesita mas contenido de texto para publicarse.",
        dashboardPath,
      ),
    );
  }

  const publishedAt =
    parsed.data.status === BlogPostStatus.PUBLISHED ? new Date() : null;
  const authorName =
    user.name?.trim() || user.email.split("@")[0]?.trim() || "Usuario";

  await prisma.$transaction(async (tx) => {
    const post = await tx.blogPost.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt,
        content: parsed.data.contentHtml,
        contentBlocks: parsedContentJson,
        status: parsed.data.status,
        visibility: parsed.data.visibility,
        authorName,
        publishedAt,
      },
      select: { id: true },
    });

    await syncBlogPostTags(tx, post.id, formData);
  });

  revalidatePath("/blog");
  if (publishedAt) {
    revalidatePath(`/blog/${parsed.data.slug}`);
  }
  revalidatePath("/dashboard/blog");
  revalidatePath("/dashboard/blog");

  redirect(buildDashboardSuccess("Post creado correctamente.", dashboardPath));
}

export async function updateBlogPostAction(formData: FormData) {
  const dashboardPath = resolveDashboardPath(formData);
  await requireAdmin();

  const postId = String(formData.get("postId") ?? "").trim();
  const rawTitle = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const normalizedSlug = slugify(rawSlug || rawTitle);

  if (!postId) {
    redirect(buildDashboardError("Post invalido.", "/dashboard/blog"));
  }

  const parsed = createPostSchema.safeParse({
    title: rawTitle,
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    slug: normalizedSlug,
    contentJson: String(formData.get("contentJson") ?? "").trim(),
    contentHtml: String(formData.get("contentHtml") ?? "").trim(),
    status: formData.get("status"),
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    redirect(buildDashboardError("Revisa los datos del post.", dashboardPath));
  }

  const currentPost = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });

  if (!currentPost) {
    redirect(buildDashboardError("El post no existe.", "/dashboard/blog"));
  }

  const slugOwner = await prisma.blogPost.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });

  if (slugOwner && slugOwner.id !== postId) {
    redirect(buildDashboardError("El slug ya existe.", dashboardPath));
  }

  let parsedContentJson: Prisma.InputJsonValue = {};
  try {
    parsedContentJson = JSON.parse(parsed.data.contentJson) as Prisma.InputJsonValue;
  } catch {
    redirect(buildDashboardError("El contenido del post es invalido.", dashboardPath));
  }

  if (parsed.data.contentHtml.includes('data-placeholder="true"')) {
    redirect(
      buildDashboardError(
        "Completa todas las imagenes pendientes de la galeria antes de guardar.",
        dashboardPath,
      ),
    );
  }

  const plainTextContent = stripHtml(parsed.data.contentHtml);
  if (plainTextContent.length < 30) {
    redirect(
      buildDashboardError(
        "El post necesita mas contenido de texto para publicarse.",
        dashboardPath,
      ),
    );
  }

  const publishedAt =
    parsed.data.status === BlogPostStatus.PUBLISHED
      ? currentPost.publishedAt ?? new Date()
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.blogPost.update({
      where: { id: postId },
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt,
        content: parsed.data.contentHtml,
        contentBlocks: parsedContentJson,
        status: parsed.data.status,
        visibility: parsed.data.visibility,
        publishedAt,
      },
    });

    await syncBlogPostTags(tx, postId, formData);
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${currentPost.slug}`);
  revalidatePath(`/blog/${parsed.data.slug}`);
  revalidatePath("/dashboard/blog");

  redirect(buildDashboardSuccess("Post actualizado correctamente.", "/dashboard/blog"));
}

export async function deleteBlogPostAction(formData: FormData) {
  await requireAdmin();

  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) {
    redirect(buildDashboardError("Post invalido.", "/dashboard/blog"));
  }

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { slug: true },
  });

  if (!post) {
    redirect(buildDashboardError("El post no existe.", "/dashboard/blog"));
  }

  await prisma.blogPost.delete({
    where: { id: postId },
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/dashboard/blog");

  redirect(buildDashboardSuccess("Post eliminado correctamente.", "/dashboard/blog"));
}

export async function createBlogCommentAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const parsed = createCommentSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
  });

  if (!parsed.success) {
    const fallbackSlug = String(formData.get("slug") ?? "").trim();
    redirect(buildCommentPath(fallbackSlug, "error"));
  }

  const post = await prisma.blogPost.findFirst({
    where: {
      slug: parsed.data.slug,
      status: BlogPostStatus.PUBLISHED,
    },
    select: { id: true, slug: true },
  });

  if (!post) {
    redirect("/blog");
  }

  await prisma.blogComment.create({
    data: {
      postId: post.id,
      authorName:
        session.user.name?.trim() || session.user.email.split("@")[0]?.trim() || "Usuario",
      authorEmail: session.user.email || null,
      content: parsed.data.content,
      approved: true,
    },
  });

  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");

  redirect(buildCommentPath(post.slug, "ok"));
}

export async function toggleBlogPostLikeAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const slug = String(formData.get("slug") ?? "").trim();
  const redirectPath = String(formData.get("redirectPath") ?? "").trim();
  const safeRedirectPath =
    redirectPath.startsWith("/blog/") || redirectPath === "/blog"
      ? redirectPath
      : "/blog";

  if (!slug) {
    redirect(safeRedirectPath);
  }

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: BlogPostStatus.PUBLISHED },
    select: { id: true, slug: true },
  });

  if (!post) {
    redirect("/blog");
  }

  const existing = await prisma.blogPostLike.findUnique({
    where: {
      postId_userId: {
        postId: post.id,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.blogPostLike.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.blogPostLike.create({
      data: {
        postId: post.id,
        userId: session.user.id,
      },
    });
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  redirect(safeRedirectPath);
}

