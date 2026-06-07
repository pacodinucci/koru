import Link from "next/link";

import { BlogPostStatus, BlogPostVisibility } from "@prisma/client";
import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
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

  return (
    <div className="space-y-4">
      <BlogEventToast ok={ok} error={error} />
      <DashboardBlogComposer tagOptions={tagOptions} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Posts cargados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
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
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Todavia no hay posts.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>{post.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          post.status === BlogPostStatus.PUBLISHED
                            ? "default"
                            : "secondary"
                        }
                      >
                        {post.status === BlogPostStatus.PUBLISHED
                          ? "Publicado"
                          : "Borrador"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          post.visibility === BlogPostVisibility.PUBLIC
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {post.visibility === BlogPostVisibility.PUBLIC
                          ? "Publico"
                          : "Miembros"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-56 flex-wrap gap-1">
                        {post.tags.length > 0 ? (
                          post.tags.slice(0, 3).map(({ tag }) => (
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
                        {post.tags.length > 3 ? (
                          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                            +{post.tags.length - 3}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{post._count.comments}</TableCell>
                    <TableCell>{formatDate(post.publishedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
