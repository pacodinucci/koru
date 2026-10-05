"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";

type Agreement = {
  id: string; title: string; body: string; status: "DRAFT" | "PUBLISHED";
  attachmentFileName: string | null; createdAt: string; publishedAt: string | null;
  families: { id: string; name: string; consentedAt: string | null; consentedBy: string | null }[];
  students: { id: string; name: string }[];
};

function AgreementDetails({ agreement }: { agreement: Agreement }) {
  return <ResponsiveDialog>
    <ResponsiveDialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
      Ver detalle
    </ResponsiveDialogTrigger>
    <ResponsiveDialogContent>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{agreement.title}</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>Acuerdo de seguimiento del {new Date(agreement.createdAt).toLocaleDateString("es-AR")}.</ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <div className="space-y-3 text-sm">
          <p className="whitespace-pre-wrap text-slate-800">{agreement.body}</p>
          <p><span className="font-medium">Niños:</span> {agreement.students.map((student) => student.name).join(", ")}</p>
          <div><p className="font-medium">Familias:</p><ul className="mt-1 space-y-1">{agreement.families.map((family) => <li key={family.id}>{family.name} · {agreement.status === "DRAFT" ? "Aún no publicado" : family.consentedAt ? `Consentimiento registrado el ${new Date(family.consentedAt).toLocaleDateString("es-AR")}${family.consentedBy ? ` por ${family.consentedBy}` : ""}` : "Pendiente de consentimiento"}</li>)}</ul></div>
          {agreement.attachmentFileName ? <a href={`/api/follow-up-agreements/${agreement.id}/attachment`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline"><FileText className="size-4" />Abrir {agreement.attachmentFileName}</a> : null}
        </div>
      </ResponsiveDialogBody>
    </ResponsiveDialogContent>
  </ResponsiveDialog>;
}

export function TeacherAgreementsClient({ agreements }: { agreements: Agreement[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function publish(id: string) {
    if (!window.confirm("¿Publicar este acuerdo? Las familias podrán verlo y el contenido ya no se podrá editar.")) return;
    if (pendingId !== null) return;
    setPendingId(id); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/teacher/follow-up-agreements/${id}/publish`, { method: "POST" });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos publicar el acuerdo.");
      setNotice("Acuerdo publicado para las familias involucradas."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos publicar el acuerdo."); }
    finally { setPendingId(null); }
  }

  async function deleteAgreement(agreement: Agreement) {
    if (pendingId !== null) return;
    setPendingId(agreement.id); setNotice(null);
    try {
      const response = await fetch(`/api/teacher/follow-up-agreements/${encodeURIComponent(agreement.id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos eliminar el acuerdo.");
      setSelectedAgreement(null);
      setDeletedIds((current) => [...current, agreement.id]);
      toast("Acuerdo eliminado.", "success");
      router.refresh();
    } catch (cause) { toast(cause instanceof Error ? cause.message : "No pudimos eliminar el acuerdo.", "error"); }
    finally { setPendingId(null); }
  }

  const visibleAgreements = agreements.filter((agreement) => !deletedIds.includes(agreement.id));

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
        {!visibleAgreements.length ? <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">Todavía no hay acuerdos cargados.</div> :
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <Table className="min-w-[640px]">
              <TableHeader><TableRow className="bg-slate-50"><TableHead>Fecha</TableHead><TableHead>Acuerdo</TableHead><TableHead>Estado</TableHead><TableHead>Niños</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{visibleAgreements.map((agreement) => <TableRow key={agreement.id}>
                <TableCell>{new Date(agreement.createdAt).toLocaleDateString("es-AR")}</TableCell>
                <TableCell className="font-medium">{agreement.title}</TableCell>
                <TableCell><Badge variant="outline">{agreement.status === "DRAFT" ? "Borrador" : "Publicado"}</Badge></TableCell>
                <TableCell>{agreement.students.map((student) => student.name).join(", ")}</TableCell>
                <TableCell><div className="flex flex-wrap gap-2">
                  <AgreementDetails agreement={agreement} />
                  {agreement.status === "DRAFT" ? <>
                    <Button nativeButton={false} render={<Link href={`/dashboard/acuerdos-seguimiento/${agreement.id}/editar`} />} variant="outline" size="sm">Editar</Button>
                    <Button type="button" size="sm" disabled={pendingId !== null} onClick={() => void publish(agreement.id)}>{pendingId === agreement.id ? "Esperá…" : "Publicar"}</Button>
                  </> : null}
                  <Button type="button" size="icon-sm" variant="destructive" aria-label={`Eliminar acuerdo ${agreement.title}`} title={`Eliminar acuerdo ${agreement.title}`} disabled={pendingId !== null} onClick={() => setSelectedAgreement(agreement)}><Trash2 /></Button>
                </div></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </div>}
      </div>
      {selectedAgreement ? <ResponsiveDialog open onOpenChange={(open) => { if (!open && pendingId === null) setSelectedAgreement(null); }}>
        <ResponsiveDialogContent showCloseButton={pendingId === null} className="md:w-[min(calc(100vw-2rem),28rem)] [font-family:var(--font-montserrat)]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Eliminar acuerdo</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Esta acción no se puede deshacer.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-3">
            <p>Vas a eliminar definitivamente el acuerdo <strong>{selectedAgreement.title}</strong>.</p>
            <p>{selectedAgreement.status === "PUBLISHED" ? "Las familias dejarán de verlo y también se borrarán los consentimientos registrados." : "Se borrará el borrador y su adjunto, si tiene uno."}</p>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose render={<Button type="button" variant="outline" disabled={pendingId !== null}>Cancelar</Button>} />
            <Button type="button" variant="destructive" disabled={pendingId !== null} onClick={() => void deleteAgreement(selectedAgreement)}>{pendingId === selectedAgreement.id ? "Eliminando…" : "Eliminar definitivamente"}</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog> : null}
    </div>
  );
}
