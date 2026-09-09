"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function DocumentUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/uploads/documents", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !result.ok) {
        toast(result.error ?? "No pudimos subir el documento.", "error");
        return;
      }

      formRef.current?.reset();
      toast("Documento guardado.", "success");
      router.refresh();
    } catch {
      toast("No pudimos subir el documento.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="document-title">Título</Label>
        <Input
          id="document-title"
          name="title"
          required
          maxLength={160}
          placeholder="Convenio de colaboración"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="document-slug">Clave del enlace</Label>
        <Input
          id="document-slug"
          name="slug"
          maxLength={120}
          placeholder="convenio-colaboracion"
        />
        <p className="text-xs text-muted-foreground">
          Usá la misma clave para reemplazar el archivo sin cambiar su enlace.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="document-file">PDF</Label>
        <Input id="document-file" name="file" type="file" accept="application/pdf" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="document-status">Estado</Label>
        <select
          id="document-status"
          name="status"
          defaultValue="DRAFT"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicado</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          <Upload />
          {loading ? "Subiendo…" : "Subir documento"}
        </Button>
      </div>
    </form>
  );
}
