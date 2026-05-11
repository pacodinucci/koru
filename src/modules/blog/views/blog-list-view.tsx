/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Maximize2Icon } from "lucide-react";

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
    <main className="mx-auto w-full max-w-5xl bg-white pl-6 pr-10 pb-16 pt-10 md:pl-10 md:pr-16 lg:pl-14 lg:pr-24">
      <header className="mb-8 space-y-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight [font-family:var(--font-roboto-condensed)] md:text-4xl">
            Koru OSA
          </h1>
          <p className="text-2xl font-semibold italic tracking-wider [font-family:var(--font-indie-flower)] md:text-4xl">
            Blog
          </p>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavia no hay posts publicados.
        </div>
      ) : (
        <div className="space-y-5 [font-family:var(--font-montserrat)]">
          {posts.map((post) => {
            const coverImage = extractFirstImage(post.content);

            return (
              <article
                key={post.id}
                className="mx-auto max-w-5xl overflow-hidden rounded-none bg-white md:grid md:grid-cols-[340px_minmax(0,1fr)] md:gap-4"
              >
                <Link href={`/blog/${post.slug}`} className="group relative block bg-muted">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={post.title}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center text-sm text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                  <span className="pointer-events-none absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                    <Maximize2Icon className="h-4 w-4" />
                  </span>
                </Link>

                <div className="flex flex-col gap-3 bg-white py-2 md:pr-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-900)] text-xs font-bold text-white">
                        {initials(post.authorName)}
                      </div>
                      <div className="flex flex-col justify-center py-1">
                        <p className="text-sm leading-none">
                          {post.authorName || "Usuario"}
                        </p>
                        <p className="mt-1 text-sm leading-none text-muted-foreground">
                          {formatDate(post.publishedAt ?? post.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-base font-semibold leading-tight md:text-lg">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p className="line-clamp-3 text-sm leading-[1.35] text-foreground/90">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto border-t border-black/15 pt-3">
                    <span className="text-3xl leading-none text-[#f25f5c]">
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
