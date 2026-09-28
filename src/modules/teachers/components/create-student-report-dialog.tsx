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
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { StudentReportRichEditor } from "@/modules/teachers/components/student-report-rich-editor";
import { RICH_REPORT_PREFIX } from "@/modules/teachers/lib/student-report-rich-text";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState({ json: "", text: "" });
  const [editorKey, setEditorKey] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const studentId = String(data.get("studentId") ?? "");
    if (!studentId || !students.some((student) => student.id === studentId)) {
      setError("Elegí un alumno de tus cursos.");
      return;
    }
    const file = data.get("file");
    const hasFile = file instanceof File && file.name.length > 0;
    const hasText = editorValue.text.trim().length > 0;
    if (hasFile === hasText) {
      setError("Adjuntá un archivo o escribí el reporte, pero no ambos.");
      return;
    }
    if (hasFile) {
      const extension = file.name.match(/\.(pdf|doc|docx)$/i)?.[1];
      if (!extension) {
        setError("Adjuntá un archivo PDF, DOC o DOCX.");
        return;
      }
      data.set("type", extension.toUpperCase());
      data.delete("body");
    } else {
      data.set("type", "TEXT");
      const richBody = RICH_REPORT_PREFIX + editorValue.json;
      if (richBody.length > 10000) {
        setError("El reporte es demasiado extenso (máximo 10.000 caracteres de contenido).");
        return;
      }
      data.set("body", richBody);
    }
    data.delete("studentId");
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
      setEditorValue({ json: "", text: "" });
      setEditorKey((key) => key + 1);
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
          <ResponsiveDialogDescription>El reporte se guardará como privado. Podés compartirlo desde la tabla de reportes.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form ref={formRef} onSubmit={submit} className="flex min-h-0 flex-1 flex-col" id="create-student-report-form">
          <ResponsiveDialogBody className="space-y-4">
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
              <Label htmlFor="report-file">Archivo</Label>
              <Input id="report-file" name="file" type="file" accept=".pdf,.doc,.docx" disabled={saving} />
              <p className="text-xs text-muted-foreground">PDF, DOC o DOCX de hasta 10 MB.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-body">Reporte escrito</Label>
              <StudentReportRichEditor key={editorKey} onChange={setEditorValue} disabled={saving} />
              <p className="text-xs text-muted-foreground">Adjuntá un archivo o escribí el reporte, pero no ambos.</p>
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar reporte"}</Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
