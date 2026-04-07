import Link from "next/link";
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

function formatDate(date: Date) {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function BlogPostView({ slug, commentStatus }: BlogPostViewProps) {
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
      <div>
        <Link
          href="/blog"
          className="mb-4 inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
        >
          Volver al blog
        </Link>

        <article className="space-y-6 rounded-xl border p-6">
          <header className="space-y-2">
            <h1 className="text-4xl font-semibold leading-tight">{post.title}</h1>
            <p className="text-xs text-muted-foreground">
              {formatDate(post.publishedAt ?? post.createdAt)}
              {post.authorName ? ` - ${post.authorName}` : ""}
            </p>
          </header>

          <div
            className="blog-post-content prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </div>

      <section className="space-y-4">
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
                  <CardTitle className="text-sm">{comment.authorName}</CardTitle>
                  <p className="text-xs text-muted-foreground">
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
