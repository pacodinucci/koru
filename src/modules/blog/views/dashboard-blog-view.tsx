import Link from "next/link";

import { BlogPostStatus, BlogPostVisibility } from "@prisma/client";
import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BlogEventToast } from "@/modules/blog/components/blog-event-toast";
import { DashboardBlogComposer } from "@/modules/blog/components/dashboard-blog-composer";
import { deleteBlogPostAction } from "@/modules/blog/server/blog.actions";
import {
  getBlogTagOptions,
  getDashboardPosts,
} from "@/modules/blog/server/blog.repository";
import { DashboardSearchableTable } from "@/modules/dashboard/components/dashboard-searchable-table";

type DashboardBlogViewProps = {
  ok?: string;
  error?: string;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function DashboardBlogView({ ok, error }: DashboardBlogViewProps) {
  const [posts, tagOptions] = await Promise.all([
    getDashboardPosts(),
    getBlogTagOptions(),
  ]);
  const rows = posts.map((post) => {
    const statusLabel = post.status === BlogPostStatus.PUBLISHED ? "Publicado" : "Borrador";
    const visibilityLabel = post.visibility === BlogPostVisibility.PUBLIC ? "Publico" : "Miembros";
    const publishedAt = formatDate(post.publishedAt);
    const visibleTags = post.tags.slice(0, 3);
    const hiddenTagCount = post.tags.length - visibleTags.length;
    return {
      id: post.id,
      // Tags rendered only as "+N" stay out of the searchable metadata.
      searchText: [
        post.title,
        statusLabel,
        visibilityLabel,
        ...visibleTags.map(({ tag }) => tag.name),
        String(post._count.comments),
        publishedAt,
      ].join(" "),
      content: (
        <TableRow key={post.id}>
          <TableCell className="font-medium">{post.title}</TableCell>
          <TableCell>
            <Badge variant={post.status === BlogPostStatus.PUBLISHED ? "success" : "muted"}>
              {statusLabel}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant={post.visibility === BlogPostVisibility.PUBLIC ? "info" : "muted"}>
              {visibilityLabel}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex max-w-56 flex-wrap gap-1">
              {visibleTags.length > 0 ? (
                visibleTags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {tag.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
              {hiddenTagCount > 0 ? (
                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  +{hiddenTagCount}
                </span>
              ) : null}
            </div>
          </TableCell>
          <TableCell>{post._count.comments}</TableCell>
          <TableCell className="text-xs text-muted-foreground">{publishedAt}</TableCell>
          <TableCell>
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                aria-label={`Ver ${post.title}`}
                title="Ver"
                className="inline-flex h-8 w-8 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <EyeIcon className="h-4 w-4" />
              </Link>
              <Link
                href={`/dashboard/blog/${post.id}/edit`}
                aria-label={`Editar ${post.title}`}
                title="Editar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <PencilIcon className="h-4 w-4" />
              </Link>
              <form action={deleteBlogPostAction}>
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  aria-label={`Eliminar ${post.title}`}
                  title="Eliminar"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </TableCell>
        </TableRow>
      ),
    };
  });

  return (
    <div className="min-w-0 space-y-6">
      <BlogEventToast ok={ok} error={error} />
      <DashboardBlogComposer tagOptions={tagOptions} />

      <section aria-labelledby="blog-posts-heading" className="min-w-0 space-y-2">
        <h2 id="blog-posts-heading" className="text-base font-semibold">
          Posts cargados
        </h2>
        <DashboardSearchableTable
          searchId="blog-posts-search"
          searchPlaceholder="Buscar por título o etiqueta"
          header={
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Audiencia</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead>Comentarios</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
          }
          rows={rows}
          columnCount={7}
          emptyMessage="Todavia no hay posts."
          tableClassName="min-w-[960px]"
        />
      </section>
    </div>
  );
}
