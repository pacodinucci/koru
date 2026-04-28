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
  slug: z.string().trim().min(1).max(180),
  contentJson: z.string().min(2),
  contentHtml: z.string().min(2),
  status: z.nativeEnum(BlogPostStatus),
});

const createCommentSchema = z.object({
  slug: z.string().trim().min(1),
  authorName: z.string().min(2).max(80),
  authorEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
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

function resolveAdminPath(formData: FormData) {
  const raw = String(formData.get("adminPath") ?? "").trim();
  if (raw === "/dashboard/blog" || raw === "/admin/blog") {
    return raw;
  }
  return "/admin/blog";
}

function buildAdminError(message: string, adminPath: string) {
  const params = new URLSearchParams({ error: message });
  return `${adminPath}?${params.toString()}`;
}

function buildAdminSuccess(message: string, adminPath: string) {
  const params = new URLSearchParams({ ok: message });
  return `${adminPath}?${params.toString()}`;
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
  const adminPath = resolveAdminPath(formData);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const rawTitle = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const normalizedSlug = slugify(rawSlug || rawTitle);

  const parsed = createPostSchema.safeParse({
    title: rawTitle,
    slug: normalizedSlug,
    contentJson: String(formData.get("contentJson") ?? "").trim(),
    contentHtml: String(formData.get("contentHtml") ?? "").trim(),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(buildAdminError("Revisa los datos del post.", adminPath));
  }

  const exists = await prisma.blogPost.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });

  if (exists) {
    redirect(buildAdminError("El slug ya existe.", adminPath));
  }

  let parsedContentJson: Prisma.InputJsonValue = {};
  try {
    parsedContentJson = JSON.parse(parsed.data.contentJson) as Prisma.InputJsonValue;
  } catch {
    redirect(buildAdminError("El contenido del post es invalido.", adminPath));
  }

  if (parsed.data.contentHtml.includes('data-placeholder=\"true\"')) {
    redirect(
      buildAdminError(
        "Completa todas las imagenes pendientes de la galeria antes de guardar.",
        adminPath,
      ),
    );
  }

  const plainTextContent = stripHtml(parsed.data.contentHtml);
  const excerpt = plainTextContent.slice(0, 220);

  if (plainTextContent.length < 30) {
    redirect(
      buildAdminError(
        "El post necesita mas contenido de texto para publicarse.",
        adminPath,
      ),
    );
  }

  const publishedAt =
    parsed.data.status === BlogPostStatus.PUBLISHED ? new Date() : null;

  await prisma.blogPost.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt,
      content: parsed.data.contentHtml,
      contentBlocks: parsedContentJson,
      status: parsed.data.status,
      publishedAt,
    },
  });

  revalidatePath("/blog");
  if (publishedAt) {
    revalidatePath(`/blog/${parsed.data.slug}`);
  }
  revalidatePath("/admin/blog");
  revalidatePath("/dashboard/blog");

  redirect(buildAdminSuccess("Post creado correctamente.", adminPath));
}

export async function createBlogCommentAction(formData: FormData) {
  const parsed = createCommentSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim(),
    authorName: String(formData.get("authorName") ?? "").trim(),
    authorEmail: String(formData.get("authorEmail") ?? "").trim(),
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
      authorName: parsed.data.authorName,
      authorEmail:
        parsed.data.authorEmail && parsed.data.authorEmail.length > 0
          ? parsed.data.authorEmail
          : null,
      content: parsed.data.content,
      approved: true,
    },
  });

  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");

  redirect(buildCommentPath(post.slug, "ok"));
}
