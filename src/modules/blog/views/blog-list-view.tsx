import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { MessageCircleIcon } from "lucide-react";
import { BlogPostVisibility } from "@prisma/client";

import { auth } from "@/lib/auth";
import { BlogLikeButton } from "@/modules/blog/components/blog-like-button";
import {
  getPublishedBlogTags,
  getPublishedPosts,
} from "@/modules/blog/server/blog.repository";

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

type BlogListViewProps = {
  tagSlug?: string;
};

export async function BlogListView({ tagSlug }: BlogListViewProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const [posts, tags] = await Promise.all([
    getPublishedPosts({ userId: session?.user.id, tagSlug }),
    getPublishedBlogTags(session?.user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl bg-white px-6 pb-16 pt-10 md:px-10 lg:px-14">
      <header className="mx-auto mb-8 max-w-5xl space-y-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight [font-family:var(--font-roboto-condensed)] md:text-4xl">
            Koru OSA
          </h1>
          <p className="text-2xl font-semibold italic tracking-wider [font-family:var(--font-indie-flower)] md:text-4xl">
            Blog
          </p>
        </div>
      </header>

      {tags.length > 0 ? (
        <nav className="mx-auto mb-8 flex max-w-5xl flex-wrap gap-2 [font-family:var(--font-montserrat)]">
          <Link
            href="/blog"
            className={`rounded-full border px-3 py-1.5 text-sm ${
              tagSlug
                ? "border-black/15 text-muted-foreground"
                : "border-[var(--brand-900)] bg-[var(--brand-900)] text-white"
            }`}
          >
            Todos
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/blog?tag=${tag.slug}`}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                tagSlug === tag.slug
                  ? "border-[var(--brand-900)] bg-[var(--brand-900)] text-white"
                  : "border-black/15 text-muted-foreground"
              }`}
            >
              {tag.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {posts.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavia no hay posts publicados.
        </div>
      ) : (
        <div className="space-y-9 [font-family:var(--font-montserrat)]">
          {posts.map((post) => {
            const coverImage = extractFirstImage(post.content);

            return (
              <article
                key={post.id}
                className="mx-auto max-w-5xl overflow-hidden rounded-none bg-white md:grid md:grid-cols-[340px_minmax(0,1fr)] md:gap-4"
              >
                <Link href={`/blog/${post.slug}`} className="block bg-muted">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={post.title}
                      width={900}
                      height={900}
                      sizes="(max-width: 768px) 100vw, 340px"
                      className="aspect-square w-full object-cover"
                      unoptimized={coverImage.startsWith("http")}
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center text-sm text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
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

                  <div className="flex flex-wrap gap-1.5">
                    {post.visibility === BlogPostVisibility.MEMBERS ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        Solo miembros
                      </span>
                    ) : null}
                    {post.tags.map(({ tag }) => (
                      <Link
                        key={tag.id}
                        href={`/blog?tag=${tag.slug}`}
                        className="rounded-full border border-black/10 px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>

                  <p className="line-clamp-3 text-sm leading-[1.35] text-foreground/90">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto border-t border-black/15 pt-3">
                    <div className="flex items-center gap-5">
                      <span className="inline-flex items-center gap-1.5 text-foreground/90">
                        <MessageCircleIcon className="h-5 w-5" />
                        <span className="text-sm text-muted-foreground">
                          {post._count.comments}
                        </span>
                      </span>
                      <BlogLikeButton
                        slug={post.slug}
                        initialLiked={Boolean(post.likes?.length)}
                        initialCount={post._count.likes}
                      />
                    </div>
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

