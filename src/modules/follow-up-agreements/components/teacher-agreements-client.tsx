"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
type Agreement = {
  id: string; title: string; body: string; status: "DRAFT" | "PUBLISHED";
  attachmentFileName: string | null; createdAt: string; publishedAt: string | null;
  families: { id: string; name: string; consentedAt: string | null; consentedBy: string | null }[];
  students: { id: string; name: string }[];
};

export function TeacherAgreementsClient({ agreements }: { agreements: Agreement[] }) {
  const router = useRouter();
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function publish(id: string) {
    if (!window.confirm("¿Publicar este acuerdo? Las familias podrán verlo y el contenido ya no se podrá editar.")) return;
    setPublishingId(id); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/teacher/follow-up-agreements/${id}/publish`, { method: "POST" });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos publicar el acuerdo.");
      setNotice("Acuerdo publicado para las familias involucradas."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos publicar el acuerdo."); }
    finally { setPublishingId(null); }
  }

  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Acuerdos de seguimiento</h1>
          <p className="mt-1 text-sm text-muted-foreground">Constancias de citas compartidas con las familias involucradas.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/acuerdos-seguimiento/nuevo" />}>
          <Plus className="size-4" />Nuevo Acuerdo
        </Button>
      </div>
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Acuerdos cargados</h2>
        {!agreements.length ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Todavía no hay acuerdos cargados.</CardContent></Card> : agreements.map((agreement) => (
          <Card key={agreement.id}>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-2"><div><CardTitle className="text-base">{agreement.title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{new Date(agreement.createdAt).toLocaleDateString("es-AR")}</p></div><Badge variant="outline">{agreement.status === "DRAFT" ? "Borrador" : "Publicado"}</Badge></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap text-slate-800">{agreement.body}</p>
              <p><span className="font-medium">Niños:</span> {agreement.students.map((student) => student.name).join(", ")}</p>
              <div><p className="font-medium">Familias:</p><ul className="mt-1 space-y-1">{agreement.families.map((family) => <li key={family.id}>{family.name} · {agreement.status === "DRAFT" ? "Aún no publicado" : family.consentedAt ? `Consentimiento registrado el ${new Date(family.consentedAt).toLocaleDateString("es-AR")}${family.consentedBy ? ` por ${family.consentedBy}` : ""}` : "Pendiente de consentimiento"}</li>)}</ul></div>
              {agreement.attachmentFileName ? <a href={`/api/follow-up-agreements/${agreement.id}/attachment`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline"><FileText className="size-4" />Abrir {agreement.attachmentFileName}</a> : null}
              {agreement.status === "DRAFT" ? <div className="flex flex-wrap gap-2 pt-2"><Button nativeButton={false} render={<Link href={`/dashboard/acuerdos-seguimiento/${agreement.id}/editar`} />} variant="outline" size="sm">Editar borrador</Button><Button type="button" size="sm" disabled={publishingId !== null} onClick={() => publish(agreement.id)}>{publishingId === agreement.id ? "Publicando…" : "Publicar para familias"}</Button></div> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
