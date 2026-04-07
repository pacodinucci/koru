/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { getPublishedPosts } from "@/modules/blog/server/blog.repository";

function formatDate(date: Date | null) {
  if (!date) {
    return "Sin fecha";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

function extractFirstImage(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? null;
}

function initials(name: string | null) {
  if (!name) {
    return "KR";
  }

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "KR";
}

export async function BlogListView() {
  const posts = await getPublishedPosts();

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Blog</p>
        <h1 className="text-3xl font-semibold">Ultimas publicaciones</h1>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Todavia no hay posts publicados.
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const coverImage = extractFirstImage(post.content);

            return (
              <article
                key={post.id}
                className="grid gap-0 overflow-hidden rounded-2xl border bg-card md:grid-cols-[1.1fr_1fr]"
              >
                <Link href={`/blog/${post.slug}`} className="block bg-muted">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={post.title}
                      className="h-full min-h-[280px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[280px] items-center justify-center bg-muted text-sm text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                </Link>

                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {initials(post.authorName)}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium leading-tight">{post.authorName || "Equipo Koru"}</p>
                      <p className="text-muted-foreground">{formatDate(post.publishedAt ?? post.createdAt)}</p>
                    </div>
                  </div>

                  <span className="inline-flex rounded-md bg-lime-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-lime-900">
                    Blog
                  </span>

                  <h2 className="text-3xl font-semibold leading-tight">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>

                  <p className="line-clamp-4 text-lg leading-8 text-foreground/85">{post.excerpt}</p>

                  <div className="border-t pt-3 text-sm text-muted-foreground">
                    {post._count.comments} comentarios
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
