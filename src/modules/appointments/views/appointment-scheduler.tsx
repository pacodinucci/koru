"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription, ResponsiveDialogFooter } from "@/components/ui/responsive-dialog";
import { parseCalendarLocalDateTime } from "@/modules/calendar/lib/calendar-time-zone";
import type { AppointmentInvitationView, AppointmentMode, CreateAppointmentInvitationInput } from "../appointments.contract";
import { appointmentDate, appointmentLabels, appointmentRequest } from "./appointment-client";

type Option = { date: string; time: string };
const field = "w-full rounded-md border bg-background px-3 py-2";
export function AppointmentScheduler({ contactId, recipientName, recipientEmail, open, onOpenChange }: {
  contactId: string; recipientName: string; recipientEmail: string; open: boolean; onOpenChange(open: boolean): void;
}) {
  const endpoint = `/api/dashboard/contacts/admission/${encodeURIComponent(contactId)}/appointments`;
  const [snapshot, setSnapshot] = useState<{ key: string; invitation: AppointmentInvitationView | null } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const [options, setOptions] = useState<Option[]>([{ date: "", time: "" }]);
  const [duration, setDuration] = useState("30");
  const [mode, setMode] = useState<AppointmentMode>("IN_PERSON");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<CreateAppointmentInvitationInput | null>(null);
  const invitation = snapshot?.key === endpoint ? snapshot.invitation : null;
  const loaded = snapshot?.key === endpoint;
  const identity = useRef(endpoint); identity.current = endpoint;
  useEffect(() => {
    const controller = new AbortController(); setLoadError("");
    appointmentRequest<AppointmentInvitationView | null>(endpoint, undefined, controller.signal).then(invitation => {
      if (!controller.signal.aborted) setSnapshot({ key: endpoint, invitation });
    }).catch(cause => { if (!controller.signal.aborted) setLoadError(cause.message); });
    return () => controller.abort();
  }, [endpoint, retry]);
  const currentStatus = invitation?.status === "PENDING" && new Date(invitation.expiresAt) <= new Date() ? "EXPIRED" : invitation?.status;
  const active = currentStatus === "PENDING" || (currentStatus === "CONFIRMED" && invitation?.slots.some(slot => slot.id === invitation.selectedSlotId && new Date(slot.endsAt) > new Date()));
  const starts = options.map(option => {
    try { return parseCalendarLocalDateTime(option.date, option.time); } catch { return null; }
  });
  const valid = starts.every(date => date && date > new Date()) && Number.isInteger(Number(duration)) && Number(duration) >= 5 && Number(duration) <= 240 && !!location.trim();
  async function submit(action?: "resend" | "cancel") {
    if (operation.current || (!action && (!summary || !loaded || active))) return;
    operation.current = true; setBusy(true); setError(""); const key = endpoint;
    try {
      const result = await appointmentRequest<AppointmentInvitationView>(action ? `${endpoint}/${encodeURIComponent(invitation!.id)}` : endpoint, action ? { action } : summary);
      if (identity.current !== key) return;
      setSnapshot({ key, invitation: result });
      if (!action) { onOpenChange(false); setSummary(null); setOptions([{ date: "", time: "" }]); setMessage(""); }
    } catch (cause) { if (identity.current === key) setError(cause instanceof Error ? cause.message : "No pudimos enviar la invitación."); }
    finally { operation.current = false; setBusy(false); }
  }
  function review() {
    if (!valid) return;
    const dates = starts.map(date => date!.toISOString()).sort();
    if (dates.some((date, index) => index > 0 && new Date(date).getTime() < new Date(dates[index - 1]).getTime() + Number(duration) * 60_000)) { setError("Los horarios no pueden repetirse ni superponerse."); return; }
    if (mode === "ONLINE") {
      try { const url = new URL(location); if (url.protocol !== "https:" || url.username || url.password) throw new Error(); }
      catch { setError("Ingresá un enlace HTTPS válido para la cita online."); return; }
    }
    setError(""); setSummary({ startsAt: dates, durationMinutes: Number(duration), mode, location: location.trim(), message: message.trim() });
  }
  const failure = error || loadError;
  return <>
    <section className="space-y-3 rounded-xl border p-5" aria-label="Cita">
      <h2 className="text-lg font-semibold">Cita</h2>
      {failure && <p role="alert">{failure}</p>}
      {loadError && <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Reintentar cita</Button>}
      {!loaded && !loadError && <p role="status">Cargando cita…</p>}
      {loaded && !invitation && <p>Todavía no se envió una invitación.</p>}
      {invitation && <>
        <p className="font-medium">{appointmentLabels[currentStatus!]}</p>
        <p className="break-all">Destinatario: {invitation.recipientEmail}</p>
        {currentStatus === "PENDING" && <p>Horarios reservados hasta {appointmentDate(invitation.expiresAt)}. Reenviar no extiende las 48 horas.</p>}
        <ul className="list-disc pl-5">{invitation.slots.filter(slot => currentStatus !== "CONFIRMED" || slot.id === invitation.selectedSlotId).map(slot => <li key={slot.id}>{appointmentDate(slot.startsAt)} · {invitation.durationMinutes} minutos</li>)}</ul>
        <p>Ciudad de México · {invitation.mode === "ONLINE" ? "Online" : "Presencial"} · {invitation.location}</p>
        {invitation.confirmationEmailFailed && <p role="alert">La cita está confirmada, pero no pudimos entregar todos los mails. Reenviá la confirmación.</p>}
        <div className="flex flex-wrap gap-2">
          {currentStatus === "PENDING" && <><Button variant="outline" disabled={busy} onClick={() => submit("resend")}>Reenviar invitación</Button><Button variant="outline" disabled={busy} onClick={() => submit("cancel")}>Cancelar invitación</Button></>}
          {currentStatus === "CONFIRMED" && <Button variant="outline" disabled={busy} onClick={() => submit("resend")}>Reenviar confirmación</Button>}
        </div>
      </>}
    </section>
    <ResponsiveDialog open={open} onOpenChange={value => { if (!busy) { onOpenChange(value); setError(""); } }}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <ResponsiveDialogHeader><ResponsiveDialogTitle>Agendar cita</ResponsiveDialogTitle><ResponsiveDialogDescription>Ofrecé hasta tres horarios a {recipientName}. Zona horaria: Ciudad de México. Se reservan durante 48 horas.</ResponsiveDialogDescription></ResponsiveDialogHeader>
        <div className="space-y-4 px-6 py-3">
          <p className="break-all">Enviar a: <strong>{recipientEmail}</strong></p>
          {failure && <p role="alert">{failure}</p>}
          {!loaded && !loadError && <p role="status">Cargando cita…</p>}
          {active ? <p>Este contacto ya tiene una invitación o cita activa. Cancelá la invitación pendiente antes de ofrecer otros horarios.</p> : summary ? <>
            <h3 className="font-semibold">Revisar invitación</h3>
            <ul className="list-disc pl-5">{summary.startsAt.map(date => <li key={date}>{appointmentDate(date)} · {summary.durationMinutes} minutos</li>)}</ul>
            <p>{summary.mode === "ONLINE" ? "Online" : "Presencial"}: {summary.location}</p>
            {summary.message && <p className="whitespace-pre-wrap">{summary.message}</p>}
            <p>Todos los horarios quedarán reservados por 48 horas desde el envío inicial.</p>
          </> : <>
            <div className="grid grid-cols-2 gap-3">
              <label>Duración (minutos)<input className={field} aria-label="Duración" type="number" min={5} max={240} value={duration} disabled={busy} onChange={event => setDuration(event.target.value)} /></label>
              <label>Modalidad<select className={field} aria-label="Modalidad" value={mode} disabled={busy} onChange={event => setMode(event.target.value as AppointmentMode)}><option value="IN_PERSON">Presencial</option><option value="ONLINE">Online</option></select></label>
            </div>
            <label className="block">{mode === "ONLINE" ? "Enlace HTTPS de la reunión" : "Lugar"}<input className={field} aria-label="Lugar o enlace" maxLength={500} value={location} disabled={busy} onChange={event => setLocation(event.target.value)} /></label>
            {options.map((option, index) => <fieldset key={index} className="space-y-2 rounded-lg border p-3"><legend className="px-1 text-sm">Opción {index + 1}</legend><div className="grid grid-cols-2 gap-3">
              <label>Fecha<input className={field} aria-label={`Fecha opción ${index + 1}`} type="date" value={option.date} disabled={busy} onChange={event => setOptions(items => items.map((item, i) => i === index ? { ...item, date: event.target.value } : item))} /></label>
              <label>Hora<input className={field} aria-label={`Hora opción ${index + 1}`} type="time" value={option.time} disabled={busy} onChange={event => setOptions(items => items.map((item, i) => i === index ? { ...item, time: event.target.value } : item))} /></label>
            </div>{options.length > 1 && <Button variant="ghost" size="sm" disabled={busy} onClick={() => setOptions(items => items.filter((_, i) => i !== index))}>Quitar opción {index + 1}</Button>}</fieldset>)}
            <Button variant="outline" disabled={busy || options.length >= 3} onClick={() => setOptions(items => [...items, { date: "", time: "" }])}>Agregar otro horario</Button>
            <label className="block">Mensaje opcional<textarea className={field} aria-label="Mensaje opcional" maxLength={2000} value={message} disabled={busy} onChange={event => setMessage(event.target.value)} /></label>
          </>}
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cerrar</Button>
          {!active && (summary ? <><Button variant="outline" disabled={busy} onClick={() => setSummary(null)}>Editar horarios</Button><Button disabled={busy || !loaded} onClick={() => submit()}>Enviar invitación por mail</Button></> : <Button disabled={busy || !loaded || !valid} onClick={review}>Revisar invitación</Button>)}
          {busy && <span role="status">Procesando…</span>}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  </>;
}
