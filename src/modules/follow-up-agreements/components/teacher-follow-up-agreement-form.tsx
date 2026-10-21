"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TeacherFollowUpAgreementRow } from "./teacher-follow-up-agreements-client";

export function TeacherFollowUpAgreementForm({ teacherId, draft, onSaved, onCancel }: {
  teacherId: string;
  draft?: TeacherFollowUpAgreementRow;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Publication is immutable, including if a stale form is passed a published row.
  if (draft && draft.status !== "DRAFT") {
    return <p>Los acuerdos publicados no se pueden editar.</p>;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    const input = new FormData(event.currentTarget);
    const title = String(input.get("title") ?? "").trim();
    const body = String(input.get("body") ?? "").trim();
    const file = input.get("file");
    if (title.length < 2 || title.length > 160) {
      setError("Ingresá un título de entre 2 y 160 caracteres.");
      return;
    }
    if (!body || body.length > 10000) {
      setError("Escribí el acuerdo (máximo 10.000 caracteres).");
      return;
    }
    if (file instanceof File && file.name) {
      if (!/\.(pdf|doc|docx|jpg|jpeg|png|webp)$/i.test(file.name)) {
        setError("Adjuntá un PDF, DOC, DOCX, JPG, PNG o WEBP.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("El adjunto no puede superar los 10 MB.");
        return;
      }
    }

    // Allowlist fields: no student, family, author or acceptance identity is sent.
    const data = new FormData();
    data.set("title", title);
    data.set("body", body);
    if (!draft) data.set("teacherId", teacherId);
    if (file instanceof File && file.name) data.set("file", file);
    setBusy(true);
    try {
      const response = await fetch(draft
        ? `/api/teacher-follow-up-agreements/${encodeURIComponent(draft.id)}`
        : "/api/teacher-follow-up-agreements", {
        method: draft ? "PATCH" : "POST",
        body: data,
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos guardar el borrador.");
      router.refresh();
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el borrador.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border bg-white p-4">
      <h2 className="text-base font-semibold">{draft ? "Editar borrador" : "Nuevo acuerdo"}</h2>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <div className="space-y-1.5">
        <Label htmlFor="teacher-agreement-title">Título</Label>
        <Input id="teacher-agreement-title" name="title" defaultValue={draft?.title ?? ""} required minLength={2} maxLength={160} disabled={busy} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="teacher-agreement-body">Acuerdo</Label>
        <Textarea id="teacher-agreement-body" name="body" defaultValue={draft?.body ?? ""} required maxLength={10000} rows={8} disabled={busy} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="teacher-agreement-file">Documento o imagen (opcional)</Label>
        <Input id="teacher-agreement-file" name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" disabled={busy} />
        <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPG, PNG o WEBP de hasta 10 MB.</p>
        {draft?.hasAttachment ? <p className="text-sm text-muted-foreground">Adjunto actual: {draft.attachmentName ?? "Documento"}. Si no elegís otro archivo, se conserva.</p> : null}
      </div>
      <p className="text-sm text-muted-foreground">El borrador solo es visible para superadmin. Al publicarlo, el docente podrá leerlo y dar su conformidad; ya no se podrá editar.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar borrador"}</Button>
        {onCancel ? <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button> : null}
      </div>
    </form>
  );
}
