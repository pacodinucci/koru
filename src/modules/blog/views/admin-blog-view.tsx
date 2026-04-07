import Link from "next/link";

import { BlogPostStatus } from "@prisma/client";
import { PenLineIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NovelBlogEditor } from "@/modules/blog/components/novel-blog-editor";
import { createBlogPostAction } from "@/modules/blog/server/blog.actions";
import { getAdminPosts } from "@/modules/blog/server/blog.repository";

type AdminBlogViewProps = {
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

export async function AdminBlogView({ ok, error }: AdminBlogViewProps) {
  const posts = await getAdminPosts();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenLineIcon className="h-4 w-4" />
            Nuevo post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBlogPostAction} className="grid gap-3">
            {ok ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {ok}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <Input name="title" placeholder="Titulo" required />
            <Input name="slug" placeholder="Slug (opcional, se genera desde el titulo)" />
            <NovelBlogEditor />

            <div className="grid gap-2 sm:grid-cols-[200px_auto] sm:items-center">
              <select
                name="status"
                defaultValue={BlogPostStatus.DRAFT}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value={BlogPostStatus.DRAFT}>Borrador</option>
                <option value={BlogPostStatus.PUBLISHED}>Publicado</option>
              </select>
              <Button type="submit" className="sm:w-fit">
                Guardar post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
                <TableHead>Comentarios</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead>Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Todavia no hay posts.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>{post.title}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === BlogPostStatus.PUBLISHED ? "default" : "secondary"}>
                        {post.status === BlogPostStatus.PUBLISHED ? "Publicado" : "Borrador"}
                      </Badge>
                    </TableCell>
                    <TableCell>{post._count.comments}</TableCell>
                    <TableCell>{formatDate(post.publishedAt)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                      >
                        Ver
                      </Link>
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
