/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { getPublishedPosts } from "@/modules/blog/server/blog.repository";

function formatDate(date: Date | null) {
  if (!date) return "Sin fecha";

  return date.toLocaleDateString("es-MX", {
    month: "short",
    day: "numeric",
  });
}

function extractFirstImage(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? null;
}

function initials(name: string | null) {
  if (!name) return "AA";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function BlogListView() {
  const posts = await getPublishedPosts();

  return (
    <main className="mx-auto w-full max-w-6xl bg-white px-4 pb-16 pt-10 md:px-6">
      <header className="mb-8 space-y-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Blog
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Historias, aprendizajes y noticias de la comunidad.
          </p>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavia no hay posts publicados.
        </div>
      ) : (
        <div className="space-y-7">
          {posts.map((post) => {
            const coverImage = extractFirstImage(post.content);

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-none bg-white md:grid md:grid-cols-[1fr_1.12fr]"
              >
                <Link href={`/blog/${post.slug}`} className="block bg-muted">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={post.title}
                      className="h-full min-h-[240px] w-full object-cover md:min-h-[440px]"
                    />
                  ) : (
                    <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground md:min-h-[440px]">
                      Sin imagen
                    </div>
                  )}
                </Link>

                <div className="flex flex-col gap-4 bg-white md:py-2 md:px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-900)] text-xs font-bold text-white">
                        {initials(post.authorName)}
                      </div>
                      <div className="flex flex-col justify-center py-1">
                        <p className="text-sm leading-none">
                          {post.authorName || "Acton Admin"}
                        </p>
                        <p className="mt-1 text-sm leading-none text-muted-foreground">
                          {formatDate(post.publishedAt ?? post.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold leading-tight md:text-xl">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="line-clamp-4 text-base leading-[1.35] text-foreground/90">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto border-t border-black/15 pt-4">
                    <span className="text-4xl leading-none text-[#f25f5c]">
                      ♡
                    </span>
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
