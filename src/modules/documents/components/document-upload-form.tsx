"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function DocumentUploadForm() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); const response = await fetch("/api/uploads/documents", { method: "POST", body: new FormData(event.currentTarget) }); const result = await response.json() as { ok: boolean; error?: string }; setLoading(false); if (!result.ok) { setError(result.error ?? "No pudimos subir el documento."); return; } router.push("/dashboard/documentos?ok=" + encodeURIComponent("Documento guardado.")); router.refresh(); }
  return <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="document-title">Título</Label><Input id="document-title" name="title" required maxLength={160} placeholder="Convenio de colaboración" /></div><div className="space-y-1.5"><Label htmlFor="document-slug">Clave del enlace</Label><Input id="document-slug" name="slug" maxLength={120} placeholder="convenio-colaboracion" /><p className="text-xs text-muted-foreground">Usá la misma clave para reemplazar el archivo sin cambiar su enlace.</p></div><div className="space-y-1.5"><Label htmlFor="document-file">PDF</Label><Input id="document-file" name="file" type="file" accept="application/pdf" required /></div><div className="space-y-1.5"><Label htmlFor="document-status">Estado</Label><select id="document-status" name="status" defaultValue="DRAFT" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"><option value="DRAFT">Borrador</option><option value="PUBLISHED">Publicado</option></select></div>{error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}<div className="sm:col-span-2"><Button type="submit" disabled={loading}><Upload />{loading ? "Subiendo…" : "Subir documento"}</Button></div></form>;
}
