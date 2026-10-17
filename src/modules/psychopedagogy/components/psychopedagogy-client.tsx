"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent,
  ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader,
  ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";

type StudentOption = { id: string; firstName: string; lastName: string; group: { name: string } };
type Entry = { id: string; entryDate: string; title: string; body: string };

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function PsychopedagogyClient({ students }: { students: StudentOption[] }) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(Boolean(studentId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!studentId) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoadError(null);
      setEntries([]);
      try {
        const response = await fetch(`/api/teacher/students/${encodeURIComponent(studentId)}/psychopedagogy`, {
          cache: "no-store", signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "No pudimos cargar las bitácoras.");
        if (!controller.signal.aborted) setEntries(result.entries);
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "No pudimos cargar las bitácoras.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [studentId, revision]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/teacher/students/${encodeURIComponent(studentId)}/psychopedagogy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data.get("date"), title: data.get("title"), body: data.get("body") }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "No pudimos guardar la bitácora.");
      form.reset();
      setOpen(false);
      setRevision((value) => value + 1);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "No pudimos guardar la bitácora.");
    } finally {
      setSaving(false);
    }
  }

  const student = students.find((item) => item.id === studentId);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full space-y-1.5 sm:max-w-sm">
          <Label htmlFor="psychopedagogy-student">Alumno</Label>
          <select id="psychopedagogy-student" value={studentId} disabled={saving || students.length === 0}
            onChange={(event) => { setStudentId(event.target.value); setEntries([]); setLoading(true); setLoadError(null); }}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
            {students.length === 0 ? <option value="">Sin alumnos asignados</option> : null}
            {students.map((item) => <option key={item.id} value={item.id}>{item.lastName}, {item.firstName} · {item.group.name}</option>)}
          </select>
        </div>
        <ResponsiveDialog open={open} onOpenChange={(value) => { if (!saving) { setOpen(value); setSaveError(null); } }}>
          <ResponsiveDialogTrigger render={<Button type="button" disabled={!studentId} />}>
            <Plus className="size-4" /> Nueva bitácora
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent className="[font-family:var(--font-montserrat)]">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Nueva bitácora</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>Registrá el seguimiento de {student?.firstName} {student?.lastName}.</ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <ResponsiveDialogBody className="space-y-4">
                {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
                <div className="space-y-1.5">
                  <Label htmlFor="psychopedagogy-date">Fecha</Label>
                  <Input id="psychopedagogy-date" name="date" type="date" defaultValue={today()} required disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="psychopedagogy-title">Título</Label>
                  <Input id="psychopedagogy-title" name="title" maxLength={160} required disabled={saving} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="psychopedagogy-body">Texto</Label>
                  <textarea id="psychopedagogy-body" name="body" maxLength={10000} required disabled={saving}
                    rows={8} className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm" />
                </div>
              </ResponsiveDialogBody>
              <ResponsiveDialogFooter>
                <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar bitácora"}</Button>
              </ResponsiveDialogFooter>
            </form>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>
      {students.length === 0 ? <p className="text-sm text-muted-foreground">No tenés alumnos asignados.</p>
        : loading ? <p role="status" className="text-sm text-muted-foreground">Cargando bitácoras…</p>
        : loadError ? <div role="alert" className="space-y-2 text-sm text-red-700"><p>{loadError}</p><Button variant="outline" onClick={() => setRevision((value) => value + 1)}>Reintentar</Button></div>
        : entries.length === 0 ? <p className="text-sm text-muted-foreground">Este alumno todavía no tiene bitácoras tuyas.</p>
        : <div className="space-y-3">{entries.map((entry) => (
          <article key={entry.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <time dateTime={entry.entryDate.slice(0, 10)} className="text-sm text-muted-foreground">{entry.entryDate.slice(0, 10).split("-").reverse().join("/")}</time>
            <h2 className="break-words font-semibold text-slate-900">{entry.title}</h2>
            <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{entry.body}</p>
          </article>
        ))}</div>}
    </div>
  );
}
