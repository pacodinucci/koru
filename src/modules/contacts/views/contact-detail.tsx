"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUESTIONNAIRE_SECTIONS, QUESTIONNAIRE_VERSION } from "@/modules/admissions/initial-questionnaire";
import { SOURCE_LABELS, STATUS_LABELS, type ContactDetail as Detail, type ContactStatus } from "../contacts.domain";
import { CreateFamilyDialog } from "@/modules/families/components/create-family-dialog";
import { AppointmentScheduler } from "@/modules/appointments/views/appointment-scheduler";

export function ContactDetail({ source, id, canManage, canSchedule = false, canManageFamilies = false }: { source: string; id: string; canManage: boolean; canSchedule?: boolean; canManageFamilies?: boolean }) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const params = useSearchParams();
  const [loaded, setLoaded] = useState<{ key: string; item: Detail } | null>(null);
  const [failure, setFailure] = useState<{ key: string; error: string } | null>(null);
  const [pending, setPending] = useState(false); const [retry, setRetry] = useState(0);
  const endpoint = `/api/dashboard/contacts/${encodeURIComponent(source)}/${encodeURIComponent(id)}`;
  const requestKey = `${endpoint}:${retry}`;
  const item = loaded?.key === requestKey ? loaded.item : null;
  const error = failure?.key === requestKey ? failure.error : "";
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      if (!controller.signal.aborted) setLoaded({ key: requestKey, item: result.item });
    }).catch((cause) => { if (!controller.signal.aborted) setFailure({ key: requestKey, error: cause.message || "No pudimos cargar el contacto." }); });
    return () => controller.abort();
  }, [endpoint, requestKey]);
  async function update(status: ContactStatus) {
    if (pending || !canManage) return;
    setPending(true); setFailure(null);
    try {
      const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setLoaded((previous) => previous?.key === requestKey ? { ...previous, item: { ...previous.item, status } } : previous);
    } catch { setFailure({ key: requestKey, error: "No pudimos actualizar el estado. Se conserva el estado anterior." }); }
    finally { setPending(false); }
  }
  return <div className="max-w-4xl space-y-6"><Button nativeButton={false} variant="ghost" size="sm" render={<Link href={`/dashboard/contactos?${params}`} />}><ArrowLeft /> Volver a Contactos</Button><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Detalle del contacto</h1>{item?.source === "admission" && canManage && canSchedule && <Button onClick={() => setScheduleOpen(true)}>Agendar cita</Button>}</div>
    {error && <div role="alert"><p>{error}</p>{!item && <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>Reintentar</Button>}</div>}
    {!item ? !error && <p role="status">Cargando contacto…</p> : <>
      <section className="space-y-2 rounded-xl border p-5"><h2 className="text-xl font-semibold">{item.name || "Sin nombre"}</h2><p>{SOURCE_LABELS[item.source]}</p><p>{new Date(item.receivedAt).toLocaleString("es-AR")}</p><p className="break-all">{item.email}</p><p>{item.phone || "Sin teléfono"}</p><label className="block">Estado<select className="ml-3 rounded border p-2" disabled={pending || !canManage} value={item.status} onChange={(event) => update(event.target.value as ContactStatus)}>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{pending && <p role="status">Guardando estado…</p>}<p className="text-sm text-muted-foreground">Marcar Respondido solo registra el seguimiento; no envía mensajes.</p></section>
      {item.source === "admission" && canManage && canManageFamilies && <CreateFamilyDialog admissionInquiryId={item.id} initialName={item.name} initialEmail={item.email} />}
      {item.source === "admission" && canManage && canSchedule && <AppointmentScheduler key={item.id} contactId={id} recipientName={item.name || "Familia"} recipientEmail={item.email} open={scheduleOpen} onOpenChange={setScheduleOpen} />}
      {item.source === "contact" ? <section className="rounded-xl border p-5"><h2 className="mb-3 text-lg font-semibold">Mensaje original</h2><p className="whitespace-pre-wrap break-words">{item.message}</p></section> : item.questionnaireVersion !== QUESTIONNAIRE_VERSION ? <p role="alert">No está disponible la definición de esta versión del cuestionario. No se reinterpretaron las respuestas.</p> : QUESTIONNAIRE_SECTIONS.map((section) => <section key={section.title} className="space-y-4 rounded-xl border p-5"><h2 className="text-lg font-semibold">{section.title}</h2>{section.description && <p>{section.description}</p>}<dl className="space-y-4">{section.questions.map((question) => <div key={question.key}><dt className="font-medium">{question.label}</dt><dd className="whitespace-pre-wrap break-words">{String(item.answers?.[question.key] ?? "") || "Sin respuesta"}</dd></div>)}</dl></section>)}
    </>}
  </div>;
}
