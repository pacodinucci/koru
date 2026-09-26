"use client";

import { useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  group: { name: string };
};

export function CreateStudentReportDialog({ students }: { students: StudentOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"TEXT" | "PDF">("TEXT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const studentId = String(data.get("studentId") ?? "");
    if (!studentId || !students.some((student) => student.id === studentId)) {
      setError("Elegí un alumno de tus cursos.");
      return;
    }
    data.delete("studentId");
    data.set("type", kind);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/teacher/students/${encodeURIComponent(studentId)}/reports`, {
        method: "POST",
        body: data,
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos guardar el reporte.");
      formRef.current?.reset();
      setKind("TEXT");
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el reporte.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={(nextOpen) => { if (!saving) { setOpen(nextOpen); setError(null); } }}>
      <ResponsiveDialogTrigger render={<Button type="button" disabled={students.length === 0} />}>
        <Plus className="size-4" /> Nuevo reporte
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="[font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nuevo reporte</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>El reporte quedará disponible para la familia del alumno.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form ref={formRef} onSubmit={submit} className="space-y-4" id="create-student-report-form">
            {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <div className="space-y-1.5">
              <Label htmlFor="report-student">Alumno</Label>
              <select id="report-student" name="studentId" required defaultValue="" disabled={saving} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                <option value="" disabled>Elegí un alumno</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.lastName}, {student.firstName} · {student.group.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-title">Título</Label>
              <Input id="report-title" name="title" required minLength={2} maxLength={160} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-kind">Formato</Label>
              <select id="report-kind" value={kind} onChange={(event) => setKind(event.target.value as "TEXT" | "PDF")} disabled={saving} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                <option value="TEXT">Texto</option>
                <option value="PDF">PDF</option>
              </select>
            </div>
            {kind === "TEXT" ? (
              <div className="space-y-1.5">
                <Label htmlFor="report-body">Reporte</Label>
                <Textarea id="report-body" name="body" required maxLength={10000} rows={7} disabled={saving} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="report-file">Archivo PDF</Label>
                <Input id="report-file" name="file" type="file" accept="application/pdf,.pdf" required disabled={saving} />
                <p className="text-xs text-muted-foreground">Hasta 10 MB.</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar reporte"}</Button>
            </div>
          </form>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
