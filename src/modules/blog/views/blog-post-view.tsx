import { notFound } from "next/navigation";
import { MessageCircleIcon } from "lucide-react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { BlogLikeButton } from "@/modules/blog/components/blog-like-button";
import { Textarea } from "@/components/ui/textarea";
import { createBlogCommentAction } from "@/modules/blog/server/blog.actions";
import { getPublishedPostBySlug } from "@/modules/blog/server/blog.repository";

type BlogPostViewProps = {
  slug: string;
  commentStatus?: string;
};

function addImageHoverIcon(html: string) {
  return html.replace(
    /<img\b([^>]*)>/gi,
    '<span class="blog-image-hover-wrap" style="position:relative;display:block;width:100%;height:0;padding-top:72%;overflow:hidden;"><img$1 style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block;"><span class="blog-image-hover-icon" aria-hidden="true"></span></span>',
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function initials(name: string | null) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function BlogPostView({ slug, commentStatus }: BlogPostViewProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const post = await getPublishedPostBySlug(slug, session?.user.id);

  if (!post) {
    notFound();
  }

  const contentWithImageOverlay = addImageHoverIcon(post.content);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 pl-6 pr-12 py-10 md:pl-10 md:pr-20 lg:pl-14 lg:pr-48">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight [font-family:var(--font-roboto-condensed)] md:text-4xl">
          Koru OSA
        </h1>
        <p className="text-2xl font-semibold italic tracking-wide [font-family:var(--font-indie-flower)] md:text-4xl">
          Blog
        </p>
      </header>

      <div>
        <article className="space-y-6 [font-family:var(--font-montserrat)]">
          <header className="space-y-5">
            <div className="flex items-center gap-3 text-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-900)] text-xs font-bold text-white">
                {initials(post.authorName)}
              </div>
              <p className="text-sm leading-none text-muted-foreground [font-family:var(--font-roboto-condensed)] md:text-base">
                {post.authorName || "Usuario"} ·{" "}
                {formatDate(post.publishedAt ?? post.createdAt)}
              </p>
            </div>

            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              {post.title}
            </h1>
          </header>

          <div
            className="blog-post-content prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: contentWithImageOverlay }}
          />
        </article>
      </div>

      <section className="space-y-4 [font-family:var(--font-montserrat)]">
        <div className="flex items-center gap-5 pt-1">
          <span className="inline-flex items-center gap-1.5 text-foreground/90">
            <MessageCircleIcon className="h-6 w-6" />
            <span className="text-sm">{post.comments.length}</span>
          </span>
          <BlogLikeButton
            slug={post.slug}
            initialLiked={Boolean(post.likes?.length)}
            initialCount={post._count.likes}
          />
        </div>
        <div className="border-t border-black/15" />

        <h2 className="text-xl font-semibold">Comentarios</h2>

        {commentStatus === "error" ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            No pudimos enviar tu comentario. Revisa los datos.
          </p>
        ) : null}

        <form
          action={createBlogCommentAction}
          className="border-b border-black/10 pb-6"
        >
          <input type="hidden" name="slug" value={post.slug} />
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {initials(post.authorName)}
            </div>
            <div className="flex-1">
              <Textarea
                name="content"
                placeholder="Escribe un comentario..."
                required
                rows={3}
                className="min-h-[96px] resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
              />
              <button
                type="submit"
                className="mt-2 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Publicar
              </button>
            </div>
          </div>
        </form>

        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay comentarios en este post.
          </p>
        ) : (
          <div className="divide-y divide-black/10">
            {post.comments.map((comment) => (
              <article key={comment.id} className="py-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {initials(comment.authorName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-semibold [font-family:var(--font-roboto-condensed)]">
                      {comment.authorName}
                    </p>
                    <p className="text-sm text-muted-foreground [font-family:var(--font-roboto-condensed)]">
                      {formatRelativeTime(comment.createdAt)}
                    </p>
                    <p className="mt-3 whitespace-pre-line text-base text-foreground/90">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
