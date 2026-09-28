"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudentOption = { id: string; firstName: string; lastName: string; familyId: string | null };
export type DraftAgreement = {
  id: string;
  title: string;
  body: string;
  attachmentFileName: string | null;
  studentIds: string[];
};

export function TeacherAgreementForm({ students, draft }: {
  students: StudentOption[]; draft?: DraftAgreement;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(draft?.title ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [studentIds, setStudentIds] = useState<string[]>(draft?.studentIds ?? []);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (studentIds.length < 1) {
      setError("Elegí al menos un alumno.");
      return;
    }
    const data = new FormData(event.currentTarget);
    data.set("studentIds", JSON.stringify(studentIds));
    data.set("removeAttachment", String(removeAttachment));
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(draft ? `/api/teacher/follow-up-agreements/${draft.id}` : "/api/teacher/follow-up-agreements", {
        method: draft ? "PATCH" : "POST",
        body: data,
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos guardar el borrador.");
      router.push("/dashboard/acuerdos-seguimiento");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el borrador.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 [font-family:var(--font-montserrat)]">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{draft ? "Editar borrador" : "Nuevo acuerdo"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dejá constancia de lo conversado en la cita. Podrás revisarlo antes de publicarlo para las familias.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={save} className="space-y-5">
            {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <div className="space-y-1.5">
              <Label htmlFor="agreement-title">Título</Label>
              <Input id="agreement-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={2} maxLength={160} disabled={busy} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agreement-body">Acuerdo</Label>
              <textarea id="agreement-body" name="body" value={body} onChange={(event) => setBody(event.target.value)} required maxLength={10000} disabled={busy} rows={10} className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Dejá constancia de lo conversado y acordado en la cita." />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Alumnos involucrados (mínimo uno)</legend>
              <div className="grid gap-2 sm:grid-cols-2">{students.map((student) => <label key={student.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm"><input type="checkbox" checked={studentIds.includes(student.id)} onChange={() => setStudentIds((ids) => ids.includes(student.id) ? ids.filter((id) => id !== student.id) : [...ids, student.id])} disabled={busy} />{student.lastName}, {student.firstName}</label>)}</div>
              {!students.length ? <p className="text-sm text-muted-foreground">No tenés alumnos con familia activa asignados.</p> : null}
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="agreement-file">Documento o imagen (opcional)</Label>
              <Input id="agreement-file" name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" disabled={busy} />
              <p className="text-xs text-muted-foreground">PDF, Word, JPG, PNG o WEBP de hasta 10 MB.</p>
              {draft?.attachmentFileName ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={removeAttachment} onChange={(event) => setRemoveAttachment(event.target.checked)} disabled={busy} />Quitar adjunto actual: {draft.attachmentFileName}</label> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy || students.length === 0}>{busy ? "Guardando…" : "Guardar borrador"}</Button>
              <Button nativeButton={false} render={<Link href="/dashboard/acuerdos-seguimiento" />} type="button" variant="outline">Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
