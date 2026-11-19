import { DocumentStatus } from "@prisma/client";
import { Download, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CopyDocumentLinkButton } from "@/modules/documents/components/copy-document-link-button";
import { DocumentUploadForm } from "@/modules/documents/components/document-upload-form";
import { DashboardSearchableTable } from "@/modules/dashboard/components/dashboard-searchable-table";
import { deleteDocumentAction, setDocumentStatusAction } from "@/modules/documents/server/document.actions";
import { listDocuments } from "@/modules/documents/server/document.repository";

function date(value: Date) { return value.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function size(value: number) { return `${(value / 1024 / 1024).toFixed(value >= 1024 * 1024 ? 1 : 2)} MB`; }

const documentStatusVariants: Record<DocumentStatus, "success" | "muted"> = {
  PUBLISHED: "success",
  DRAFT: "muted",
};

export async function DashboardDocumentsView({ ok, error }: { ok?: string; error?: string }) {
  const documents = await listDocuments();
  const rows = documents.map((document) => {
    const path = `/documentos/${document.slug}`;
    const statusLabel = document.status === DocumentStatus.PUBLISHED ? "Publicado" : "Borrador";
    const updatedAt = date(document.updatedAt);
    return {
      id: document.id,
      // Only text that the row already shows may feed the live search.
      searchText: [document.title, document.originalFileName, size(document.sizeBytes), statusLabel, updatedAt, path].join(" "),
      content: <TableRow key={document.id}><TableCell><p className="font-medium text-foreground">{document.title}</p><p className="text-xs text-muted-foreground">{document.originalFileName} · {size(document.sizeBytes)}</p></TableCell><TableCell><Badge variant={documentStatusVariants[document.status]}>{statusLabel}</Badge></TableCell><TableCell className="text-xs text-muted-foreground">{updatedAt}</TableCell><TableCell><div className="flex items-center gap-1"><a href={path} target="_blank" className="text-sm text-primary hover:underline">{path}</a><CopyDocumentLinkButton path={path} title={document.title} /></div></TableCell><TableCell><div className="flex justify-end gap-1.5"><a href={path} target="_blank" aria-label={`Abrir ${document.title}`}><Button type="button" variant="outline" size="icon-sm"><Download /></Button></a><form action={setDocumentStatusAction}><input type="hidden" name="id" value={document.id} /><input type="hidden" name="status" value={document.status === DocumentStatus.PUBLISHED ? "DRAFT" : "PUBLISHED"} /><Button type="submit" variant="outline">{document.status === DocumentStatus.PUBLISHED ? "Despublicar" : "Publicar"}</Button></form><form action={deleteDocumentAction}><input type="hidden" name="id" value={document.id} /><Button type="submit" variant="destructive" size="icon-sm" aria-label={`Eliminar ${document.title}`}><Trash2 /></Button></form></div></TableCell></TableRow>,
    };
  });
  return <div className="min-w-0 space-y-6 [font-family:var(--font-montserrat)]">
    {ok ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</p> : null}
    {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Subir archivo</CardTitle><p className="text-sm text-muted-foreground">Los PDFs y videos MP4 publicados quedan disponibles con un enlace estable de Koru.</p></CardHeader><CardContent><DocumentUploadForm /></CardContent></Card>
    <section aria-labelledby="documents-list-heading" className="min-w-0 space-y-2">
      <h2 id="documents-list-heading" className="text-base font-semibold">Archivos cargados</h2>
      <DashboardSearchableTable
        searchId="documents-search"
        searchPlaceholder="Buscar por archivo o estado"
        header={<TableHeader><TableRow><TableHead>Archivo</TableHead><TableHead>Estado</TableHead><TableHead>Actualizado</TableHead><TableHead>Enlace</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>}
        rows={rows}
        columnCount={5}
        emptyMessage="Todavía no hay archivos."
        tableClassName="min-w-[720px]"
      />
    </section>
  </div>;
}
