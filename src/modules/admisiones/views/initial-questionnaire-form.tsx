"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUESTIONNAIRE_INTRO, QUESTIONNAIRE_PRIVACY, QUESTIONNAIRE_SECTIONS, QUESTIONNAIRE_VERSION } from "@/modules/admissions/initial-questionnaire";

export function InitialQuestionnaireForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  // Freeze the exact attempted payload: an uncertain retry must not send edited answers with the old key.
  const attempt = useRef<{ idempotencyKey: string; answers: Record<string, string | number> } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true; setPending(true); setError("");
    const website = String(new FormData(event.currentTarget).get("website") ?? "");
    if (!attempt.current) attempt.current = { idempotencyKey: crypto.randomUUID(), answers: { ...values, age: Number(values.age) } };
    try {
      const response = await fetch("/api/admissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionnaireVersion: QUESTIONNAIRE_VERSION, ...attempt.current, website }) });
      const result = await response.json();
      if (!response.ok || !result.success) {
        // Validation and conflict responses prove that this content was not saved; allow corrections.
        if (response.status === 400 || response.status === 409) attempt.current = null;
        setError(result.error ?? "No pudimos enviar el cuestionario. Intentá de nuevo.");
        return;
      }
      setSent(true); setValues({}); attempt.current = null;
    } catch { setError("No pudimos confirmar el envío. Reintentá para confirmar el mismo cuestionario sin duplicarlo."); }
    finally { sending.current = false; setPending(false); }
  }
  if (sent) return <section role="status" className="space-y-5 rounded-xl border bg-white p-8"><h1 className="text-2xl font-semibold">Gracias por acercarse a Koru</h1><p>Recibimos su cuestionario inicial. Nos pondremos en contacto para continuar la vinculación.</p><Link className="underline" href="/admisiones">Volver a Admisiones</Link></section>;
  return <form onSubmit={submit} className="space-y-6">
    <header className="space-y-3"><p>KORU · Organismo Social de Aprendizaje</p><h1 className="text-3xl font-semibold">CUESTIONARIO INICIAL DE VINCULACIÓN</h1><h2 className="text-xl">Bienvenidos</h2>{QUESTIONNAIRE_INTRO.map((text) => <p key={text}>{text}</p>)}<p className="text-sm text-muted-foreground">Un cuestionario por hija/o. Los datos generales son obligatorios; las demás respuestas son opcionales. No es necesario tener una cuenta.</p></header>
    <fieldset disabled={pending || attempt.current !== null} className="space-y-5 disabled:opacity-80">
      {QUESTIONNAIRE_SECTIONS.map((section) => <Card key={section.title}><CardHeader><CardTitle>{section.title}</CardTitle></CardHeader><CardContent className="space-y-5">{section.description && <p>{section.description}</p>}{section.questions.map((question) => <div key={question.key} className="space-y-2"><label htmlFor={question.key} className="block text-sm font-medium">{question.label} {question.required ? <span aria-hidden="true">*</span> : <span className="font-normal text-muted-foreground">(Opcional)</span>}</label>{question.type === "textarea" ? <textarea id={question.key} name={question.key} rows={3} maxLength={question.maxLength} value={values[question.key] ?? ""} onChange={(e) => setValues({ ...values, [question.key]: e.target.value })} className="min-h-24 w-full rounded-md border bg-background p-3" /> : <input id={question.key} name={question.key} type={question.type} required={question.required} maxLength={question.maxLength} min={question.type === "number" ? 0 : undefined} max={question.type === "number" ? 25 : question.type === "date" ? new Date().toISOString().slice(0, 10) : undefined} step={question.type === "number" ? 1 : undefined} value={values[question.key] ?? ""} onChange={(e) => setValues({ ...values, [question.key]: e.target.value })} className="w-full rounded-md border bg-background p-3" />}</div>)}</CardContent></Card>)}
    </fieldset>
    <div className="hidden" aria-hidden="true"><label htmlFor="website">Sitio web</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
    <p className="text-sm text-muted-foreground">{QUESTIONNAIRE_PRIVACY}</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {attempt.current && !pending && <p className="text-sm">Conservamos las respuestas del intento anterior. Reintentá para confirmar su recepción antes de iniciar otro envío.</p>}
    <Button type="submit" disabled={pending}>{pending ? "Enviando…" : attempt.current ? "Reintentar el mismo envío" : "Enviar cuestionario"}</Button>
  </form>;
}
