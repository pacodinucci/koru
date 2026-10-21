"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent,
  ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { TeacherFollowUpAgreementForm } from "./teacher-follow-up-agreement-form";

export type TeacherFollowUpAgreementRow = {
  id: string;
  teacherId: string;
  title: string;
  body: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  publishedAt: string | null;
  acceptedAt: string | null;
  acceptedByName: string | null;
  authorName: string;
  attachmentName: string | null;
  hasAttachment: boolean;
};

type Props = { agreements: TeacherFollowUpAgreementRow[] } & (
  { mode: "admin"; teacherId: string } | { mode: "recipient" }
);

const formatDate = (value: string) => new Date(value).toLocaleDateString("es-AR");

export function TeacherFollowUpAgreementsClient(props: Props) {
  const { agreements, mode } = props;
  const router = useRouter();
  const [editing, setEditing] = useState<TeacherFollowUpAgreementRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<TeacherFollowUpAgreementRow | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  const [consentedIds, setConsentedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function mutate(agreement: TeacherFollowUpAgreementRow, action: "publish" | "consent" | "delete") {
    if (pendingId !== null) return;
    const isPublished = agreement.status === "PUBLISHED" || publishedIds.includes(agreement.id);
    if (action === "consent") {
      if (mode !== "recipient" || !isPublished || agreement.acceptedAt || consentedIds.includes(agreement.id)) return;
    } else if (mode !== "admin" || (action === "publish" && isPublished)) return;
    setPendingId(agreement.id);
    setError(null);
    setNotice(null);
    const fallback = action === "delete" ? "No pudimos eliminar el acuerdo."
      : action === "publish" ? "No pudimos publicar el acuerdo." : "No pudimos registrar tu conformidad.";
    try {
      const suffix = action === "delete" ? "" : `/${action}`;
      const response = await fetch(`/api/teacher-follow-up-agreements/${encodeURIComponent(agreement.id)}${suffix}`, {
        method: action === "delete" ? "DELETE" : "POST",
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? fallback);
      if (action === "delete") {
        setDeletedIds((current) => [...current, agreement.id]);
        setDeleting(null);
        if (editing !== "new" && editing?.id === agreement.id) setEditing(null);
        setNotice("Acuerdo eliminado.");
      } else if (action === "publish") {
        setPublishedIds((current) => [...current, agreement.id]);
        if (editing !== "new" && editing?.id === agreement.id) setEditing(null);
        setNotice("Acuerdo publicado. El docente ya puede leerlo y dar su conformidad.");
      } else {
        // Actor and original acceptance date come only from the refreshed read model.
        setConsentedIds((current) => [...current, agreement.id]);
        setNotice("Conformidad registrada. Actualizando la constancia…");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback);
    } finally {
      setPendingId(null);
    }
  }

  const visible = agreements.filter((agreement) => !deletedIds.includes(agreement.id)
    && (mode === "admin" || agreement.status === "PUBLISHED"));

  return (
    <div className="space-y-4 [font-family:var(--font-montserrat)]">
      {mode === "admin" ? (
        <Button type="button" disabled={pendingId !== null} onClick={() => setEditing("new")}>Nuevo acuerdo</Button>
      ) : <p className="text-sm text-muted-foreground">Leé los acuerdos publicados para vos y registrá tu conformidad. La fecha y la persona que la otorgó se conservan.</p>}
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
      {props.mode === "admin" && editing ? (
        <TeacherFollowUpAgreementForm
          key={editing === "new" ? "new" : editing.id}
          teacherId={props.teacherId}
          draft={editing === "new" ? undefined : editing}
          onSaved={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      ) : null}
      {visible.length === 0 ? <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">{mode === "admin" ? "Todavía no hay acuerdos de este docente." : "Todavía no hay acuerdos publicados para vos."}</p> : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Creado</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Acuerdo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Conformidad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((agreement) => {
                const isPublished = agreement.status === "PUBLISHED" || publishedIds.includes(agreement.id);
                return (
                  <TableRow key={agreement.id}>
                    <TableCell>{formatDate(agreement.createdAt)}</TableCell>
                    <TableCell>{agreement.authorName}</TableCell>
                    <TableCell className="min-w-64 max-w-lg space-y-2">
                      <h2 className="font-medium">{agreement.title}</h2>
                      <p className="whitespace-pre-wrap break-words text-sm">{agreement.body}</p>
                      {agreement.hasAttachment ? (
                        <a href={`/api/teacher-follow-up-agreements/${encodeURIComponent(agreement.id)}/attachment`} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary underline">
                          Abrir {agreement.attachmentName ?? "adjunto"}
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{isPublished ? "Publicado" : "Borrador"}</Badge>
                      {agreement.publishedAt ? <p className="mt-1 text-xs text-muted-foreground">{formatDate(agreement.publishedAt)}</p> : null}
                    </TableCell>
                    <TableCell>
                      {agreement.acceptedAt ? (
                        <p>Conformidad registrada el {formatDate(agreement.acceptedAt)}{agreement.acceptedByName ? ` por ${agreement.acceptedByName}` : ""}.</p>
                      ) : isPublished ? "Pendiente de conformidad" : "Aún no publicado"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {mode === "admin" ? (
                          <>
                            {!isPublished ? (
                              <>
                                <Button type="button" size="sm" variant="outline" disabled={pendingId !== null} onClick={() => setEditing(agreement)}>Editar</Button>
                                <Button type="button" size="sm" disabled={pendingId !== null} onClick={() => mutate(agreement, "publish")}>Publicar</Button>
                              </>
                            ) : null}
                            <Button type="button" size="icon-sm" variant="destructive" aria-label={`Eliminar acuerdo ${agreement.title}`} disabled={pendingId !== null} onClick={() => setDeleting(agreement)}><Trash2 /></Button>
                          </>
                        ) : !agreement.acceptedAt ? (
                          <Button type="button" size="sm" disabled={pendingId !== null || consentedIds.includes(agreement.id)} onClick={() => mutate(agreement, "consent")}>Dar conformidad</Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {mode === "admin" && deleting ? (
        <ResponsiveDialog open onOpenChange={(open) => { if (!open && pendingId === null) setDeleting(null); }}>
          <ResponsiveDialogContent showCloseButton={pendingId === null}>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Eliminar acuerdo</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>Esta acción no se puede deshacer.</ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody>
              <p>Vas a eliminar definitivamente el acuerdo <strong>{deleting.title}</strong>, su adjunto y la conformidad registrada, si existen. El docente dejará de verlo.</p>
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <Button type="button" variant="outline" disabled={pendingId !== null} onClick={() => setDeleting(null)}>Cancelar</Button>
              <Button type="button" variant="destructive" disabled={pendingId !== null} onClick={() => mutate(deleting, "delete")}>Eliminar definitivamente</Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      ) : null}
    </div>
  );
}
