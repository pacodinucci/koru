import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const post = await getPublishedPostBySlug(slug);

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
        <p className="text-2xl font-semibold italic tracking-tight [font-family:var(--font-indie-flower)] md:text-4xl">
          Blog
        </p>
      </header>

      <div>
        <article className="space-y-6 rounded-xl border p-6 [font-family:var(--font-montserrat)]">
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
        <h2 className="text-xl font-semibold">Comentarios</h2>

        {commentStatus === "ok" ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Comentario enviado.
          </p>
        ) : null}

        {commentStatus === "error" ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            No pudimos enviar tu comentario. Revisa los datos.
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dejar comentario</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBlogCommentAction} className="space-y-3">
              <input type="hidden" name="slug" value={post.slug} />
              <Input name="authorName" placeholder="Tu nombre" required />
              <Input
                name="authorEmail"
                type="email"
                placeholder="Tu email (opcional)"
              />
              <Textarea
                name="content"
                placeholder="Escribe tu comentario"
                required
                rows={4}
              />
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Enviar comentario
              </button>
            </form>
          </CardContent>
        </Card>

        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavia no hay comentarios en este post.
          </p>
        ) : (
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-sm [font-family:var(--font-roboto-condensed)]">
                    {comment.authorName}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground [font-family:var(--font-roboto-condensed)]">
                    {formatDate(comment.createdAt)}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm text-foreground/90">
                    {comment.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
