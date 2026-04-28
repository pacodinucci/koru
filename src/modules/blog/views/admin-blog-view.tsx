import Link from "next/link";

import { BlogPostStatus } from "@prisma/client";

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
import { DashboardBlogComposer } from "@/modules/blog/components/dashboard-blog-composer";
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
      <DashboardBlogComposer ok={ok} error={error} />

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
