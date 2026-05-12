import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { slug?: string } | null;
  const slug = String(body?.slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Slug invalido" }, { status: 400 });
  }

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ ok: false, error: "Post no encontrado" }, { status: 404 });
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

  let liked = false;
  if (existing) {
    await prisma.blogPostLike.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.blogPostLike.create({
      data: { postId: post.id, userId: session.user.id },
    });
    liked = true;
  }

  const count = await prisma.blogPostLike.count({
    where: { postId: post.id },
  });

  return NextResponse.json({ ok: true, liked, count });
}

