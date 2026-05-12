"use server";

import { BlogPostStatus, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createPostSchema = z.object({
  title: z.string().min(4).max(180),
  excerpt: z.string().min(8).max(220),
  slug: z.string().trim().min(1).max(180),
  contentJson: z.string().min(2),
  contentHtml: z.string().min(2),
  status: z.nativeEnum(BlogPostStatus),
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
  if (raw === "/dashboard/blog" || raw === "/dashboard/blog") {
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

export async function createBlogPostAction(formData: FormData) {
  const dashboardPath = resolveDashboardPath(formData);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

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
    session.user.name?.trim() ||
    session.user.email.split("@")[0]?.trim() ||
    "Usuario";

  await prisma.blogPost.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt,
      content: parsed.data.contentHtml,
      contentBlocks: parsedContentJson,
      status: parsed.data.status,
      authorName,
      publishedAt,
    },
  });

  revalidatePath("/blog");
  if (publishedAt) {
    revalidatePath(`/blog/${parsed.data.slug}`);
  }
  revalidatePath("/dashboard/blog");
  revalidatePath("/dashboard/blog");

  redirect(buildDashboardSuccess("Post creado correctamente.", dashboardPath));
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

