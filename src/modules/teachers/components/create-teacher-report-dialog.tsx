"use client";

import { useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent,
  ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader,
  ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { StudentReportRichEditor } from "@/modules/teachers/components/student-report-rich-editor";
import { RICH_REPORT_PREFIX } from "@/modules/teachers/lib/student-report-rich-text";

export function CreateTeacherReportDialog({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState({ json: "", text: "" });
  const [editorKey, setEditorKey] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const file = data.get("reportFile");
    const hasFile = file instanceof File && file.name.length > 0;
    const hasText = editorValue.text.trim().length > 0;
    if (hasFile === hasText) {
      setError("Adjuntá un archivo o escribí el reporte, pero no ambos.");
      return;
    }
    if (hasFile) {
      if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
        setError("Adjuntá un archivo PDF, DOC o DOCX.");
        return;
      }
      if (file.size === 0 || file.size > 10 * 1024 * 1024) {
        setError("El archivo debe tener contenido y no superar los 10 MB.");
        return;
      }
      data.delete("content");
    } else {
      const content = RICH_REPORT_PREFIX + editorValue.json;
      if (content.length > 10000) {
        setError("El reporte es demasiado extenso (máximo 10.000 caracteres de contenido).");
        return;
      }
      data.set("content", content);
      data.delete("reportFile");
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/teachers/${encodeURIComponent(teacherId)}/reports`, {
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
      <ResponsiveDialogTrigger render={<Button type="button" />}>
        <Plus className="size-4" /> Nuevo reporte
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent showCloseButton={!saving} className="[font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nuevo reporte del docente</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Se guardará como privado. Solo superadmin puede consultarlo por ahora.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form ref={formRef} onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <ResponsiveDialogBody className="space-y-4">
            {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <div className="space-y-1.5">
              <Label htmlFor="teacher-report-title">Título</Label>
              <Input id="teacher-report-title" name="title" required minLength={2} maxLength={160} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacher-report-file">Archivo</Label>
              <Input id="teacher-report-file" name="reportFile" type="file" accept=".pdf,.doc,.docx" disabled={saving} />
              <p className="text-xs text-muted-foreground">PDF, DOC o DOCX de hasta 10 MB.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-body">Reporte escrito</Label>
              <StudentReportRichEditor key={editorKey} onChange={setEditorValue} disabled={saving} />
              <p className="text-xs text-muted-foreground">Adjuntá un archivo o escribí el reporte, pero no ambos.</p>
            </div>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter columns={1}>
            <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar reporte"}</Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
