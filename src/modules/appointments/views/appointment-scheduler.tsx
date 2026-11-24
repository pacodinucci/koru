"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription, ResponsiveDialogFooter } from "@/components/ui/responsive-dialog";
import { parseCalendarLocalDateTime } from "@/modules/calendar/lib/calendar-time-zone";
import type { AppointmentMode, CreateAppointmentInvitationInput } from "../appointments.contract";
import { appointmentAdminSnapshot, appointmentDate, appointmentLabels, appointmentRequest, googleCalendarSettingsPath, googleEventUrl, googleRsvpLabels, type AdminAppointmentInvitationView } from "./appointment-client";

const field = "h-9 min-w-0 w-full rounded-md border bg-background px-2.5 text-sm";
export function AppointmentScheduler({ contactId, recipientName, recipientEmail, open, onOpenChange }: {
  contactId: string; recipientName: string; recipientEmail: string; open: boolean; onOpenChange(open: boolean): void;
}) {
  const endpoint = `/api/dashboard/contacts/admission/${encodeURIComponent(contactId)}/appointments`;
  const [snapshot, setSnapshot] = useState<{ key: string; invitation: AdminAppointmentInvitationView | null; connected: boolean } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [mode, setMode] = useState<AppointmentMode>("IN_PERSON");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState<CreateAppointmentInvitationInput | null>(null);
  const invitation = snapshot?.key === endpoint ? snapshot.invitation : null;
  const loaded = snapshot?.key === endpoint;
  const connected = snapshot?.key === endpoint ? snapshot.connected : false;
  const identity = useRef(endpoint); identity.current = endpoint;
  useEffect(() => {
    const controller = new AbortController(); setLoadError("");
    appointmentAdminSnapshot(endpoint, controller.signal).then(result => {
      if (!controller.signal.aborted) setSnapshot({ key: endpoint, invitation: result.invitation, connected: result.googleCalendar.connected });
    }).catch(cause => { if (!controller.signal.aborted) setLoadError(cause.message); });
    return () => controller.abort();
  }, [endpoint, retry]);
  const isGoogle = invitation?.provider === "GOOGLE_CALENDAR";
  const rsvp = invitation?.googleRsvpStatus ?? null;
  const syncPending = invitation?.googleSyncPending === true;
  // A native Google invitation has no 48 hour window: it ends at the appointment end, cancellation or decline.
  const currentStatus = isGoogle || !invitation ? invitation?.status : invitation.status === "PENDING" && new Date(invitation.expiresAt) <= new Date() ? "EXPIRED" : invitation.status;
  const active = (currentStatus === "PENDING" && (!isGoogle || !!invitation?.slots.some(slot => new Date(slot.endsAt) > new Date()))) || (currentStatus === "CONFIRMED" && !!invitation?.slots.some(slot => slot.id === invitation.selectedSlotId && new Date(slot.endsAt) > new Date()));
  const statusLabel = isGoogle ? (currentStatus === "CANCELLED" ? "Cancelada" : rsvp ? googleRsvpLabels[rsvp] : "Esperando respuesta de Google") : invitation ? appointmentLabels[currentStatus!] : "";
  const unresolved = isGoogle && currentStatus === "PENDING" && (syncPending || !rsvp);
  const eventUrl = isGoogle ? googleEventUrl(invitation?.googleEventUrl) : null;
  const canManageNative = isGoogle && invitation?.canManageGoogle === true;
  const managed = isGoogle ? canManageNative : true;
  const startsAt = (() => { try { return parseCalendarLocalDateTime(date, time); } catch { return null; } })();
  const valid = !!startsAt && startsAt > new Date() && Number.isInteger(Number(duration)) && Number(duration) >= 5 && Number(duration) <= 240 && !!location.trim();
  async function submit(action?: "resend" | "cancel" | "sync") {
    if (operation.current || (!action && (!summary || !loaded || active || !connected))) return;
    operation.current = true; setBusy(true); setError(""); const key = endpoint;
    try {
      const result = await appointmentRequest<AdminAppointmentInvitationView>(action ? `${endpoint}/${encodeURIComponent(invitation!.id)}` : endpoint, action ? { action } : summary);
      if (identity.current !== key) return;
      setSnapshot(previous => ({ key, invitation: result, connected: previous?.key === key ? previous.connected : connected }));
      if (!action) { onOpenChange(false); setSummary(null); setDate(""); setTime(""); }
    } catch (cause) { if (identity.current === key) setError(cause instanceof Error ? cause.message : "No pudimos enviar la invitación."); }
    finally { operation.current = false; setBusy(false); }
  }
  function review() {
    if (!valid || !startsAt) return;
    if (mode === "ONLINE") {
      try { const url = new URL(location); if (url.protocol !== "https:" || url.username || url.password) throw new Error(); }
      catch { setError("Ingresá un enlace HTTPS válido para la cita online."); return; }
    }
    setError(""); setSummary({ startsAt: [startsAt.toISOString()], durationMinutes: Number(duration), mode, location: location.trim() });
  }
  const failure = error || loadError;
  return <>
    <section className="space-y-3 rounded-xl border p-5 font-montserrat" aria-label="Cita">
      <h2 className="text-lg font-semibold">Cita</h2>
      {failure && <p role="alert">{failure}</p>}
      {loadError && <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Reintentar cita</Button>}
      {!loaded && !loadError && <p role="status">Cargando cita…</p>}
      {loaded && !invitation && <p>Todavía no se envió una invitación.</p>}
      {invitation && <>
        <p className="font-medium">{statusLabel}</p>
        <p className="break-all">Destinatario: {invitation.recipientEmail}</p>
        {isGoogle ? <>
          {rsvp && <p>Última respuesta observada: {googleRsvpLabels[rsvp]}</p>}
          {unresolved && <p role="status">{syncPending ? "Google todavía no confirmó esta invitación. Actualizá la respuesta para ver el estado real; no asumimos que ya se envió." : "Todavía no registramos la respuesta de la familia en Google Calendar. Actualizá la respuesta para consultar el estado real."}</p>}
          {eventUrl && <p><a href={eventUrl} target="_blank" rel="noopener noreferrer">Ver el evento en Google Calendar</a></p>}
        </> : currentStatus === "PENDING" && <p>Horarios reservados hasta {appointmentDate(invitation.expiresAt)}. Reenviar no extiende las 48 horas.</p>}
        <ul className="list-disc pl-5">{invitation.slots.filter(slot => currentStatus !== "CONFIRMED" || slot.id === invitation.selectedSlotId).map(slot => <li key={slot.id}>{appointmentDate(slot.startsAt)} · {invitation.durationMinutes} minutos</li>)}</ul>
        <p>{invitation.mode === "ONLINE" ? "Online" : "Presencial"} · {invitation.location}</p>
        {invitation.confirmationEmailFailed && isGoogle && active && <p role="alert">La invitación de Google se conserva, pero no pudimos entregar el correo informativo de Koru. Usá Actualizar respuesta para reintentar ese correo.</p>}
        {invitation.confirmationEmailFailed && !isGoogle && <p role="alert">La cita está confirmada, pero no pudimos entregar todos los mails. Reenviá la confirmación.</p>}
        <div className="flex flex-wrap items-center gap-2">
          {isGoogle ? (managed ? <>
            <Button variant="outline" disabled={busy} onClick={() => submit("sync")}>Actualizar respuesta</Button>
            {active && <Button variant="outline" disabled={busy} onClick={() => submit("cancel")}>Cancelar cita</Button>}
          </> : <p>Solo el administrador que envió la invitación puede actualizar la respuesta o cancelar la cita.</p>) : <>
            {currentStatus === "PENDING" && <><Button variant="outline" disabled={busy} onClick={() => submit("resend")}>Reenviar invitación</Button><Button variant="outline" disabled={busy} onClick={() => submit("cancel")}>Cancelar invitación</Button></>}
            {currentStatus === "CONFIRMED" && <Button variant="outline" disabled={busy} onClick={() => submit("resend")}>Reenviar confirmación</Button>}
          </>}
        </div>
      </>}
    </section>
    <ResponsiveDialog open={open} onOpenChange={value => { if (!busy) { onOpenChange(value); setError(""); } }}>
      <ResponsiveDialogContent className="sm:max-w-xl font-montserrat">
        <ResponsiveDialogHeader><ResponsiveDialogTitle>Agendar cita</ResponsiveDialogTitle><ResponsiveDialogDescription>Enviar invitación de Google Calendar a {recipientName}, con un solo horario. La familia responde desde el correo de Google Calendar. También recibe un correo de Koru con los detalles de la visita.</ResponsiveDialogDescription></ResponsiveDialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-6 py-3">
          <p className="break-all">Enviar a: <strong>{recipientEmail}</strong></p>
          <p>Organizador: quien agenda, desde su cuenta de Google Calendar conectada. La invitación no ocupa tu agenda escolar de Calendario.</p>
          {failure && <p role="alert">{failure}</p>}
          {!loaded && !loadError && <p role="status">Cargando cita…</p>}
          {loaded && !connected && <div role="alert" className="space-y-2 rounded-md border p-3"><p>Conectá tu cuenta de Google Calendar para enviar esta invitación. Sin esa conexión no se envía nada.</p><a className="text-sm font-semibold underline" href={googleCalendarSettingsPath}>Conectar Google Calendar</a></div>}
          {active ? <p>Este contacto ya tiene una invitación o cita activa. Cancelala antes de enviar otra invitación.</p> : summary ? <>
            <h3 className="font-semibold">Revisar invitación</h3>
            <ul className="list-disc pl-5">{summary.startsAt.map(date => <li key={date}>{appointmentDate(date)} · {summary.durationMinutes} minutos</li>)}</ul>
            <p>{summary.mode === "ONLINE" ? "Online" : "Presencial"}: {summary.location}</p>
            <p>Se envía una sola invitación de Google Calendar desde la cuenta conectada de quien agenda. La familia confirma desde ese correo y el horario queda reservado hasta la cita o su cancelación.</p>
          </> : <>
            <div className="grid grid-cols-2 gap-3">
              <label>Duración (minutos)<input className={field} aria-label="Duración" type="number" min={5} max={240} value={duration} disabled={busy} onChange={event => setDuration(event.target.value)} /></label>
              <label>Modalidad<select className={field} aria-label="Modalidad" value={mode} disabled={busy} onChange={event => setMode(event.target.value as AppointmentMode)}><option value="IN_PERSON">Presencial</option><option value="ONLINE">Online</option></select></label>
            </div>
            <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] items-center gap-2 rounded-md border px-2 py-1.5"><legend className="sr-only">Horario de la cita</legend>
              <input className={field} aria-label="Fecha de la cita" type="date" value={date} disabled={busy} onChange={event => setDate(event.target.value)} />
              <input className={field} aria-label="Hora de la cita" type="time" value={time} disabled={busy} onChange={event => setTime(event.target.value)} />
            </fieldset>
            <label className="block">{mode === "ONLINE" ? "Enlace HTTPS de la reunión" : "Lugar"}<input className={field} aria-label="Lugar o enlace" maxLength={500} value={location} disabled={busy} onChange={event => setLocation(event.target.value)} /></label>
          </>}
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cerrar</Button>
          {!active && (summary ? <><Button variant="outline" disabled={busy} onClick={() => setSummary(null)}>Editar horario</Button><Button disabled={busy || !loaded || !connected} onClick={() => submit()}>Enviar invitación de Google Calendar</Button></> : <Button disabled={busy || !loaded || !valid} onClick={review}>Revisar invitación</Button>)}
          {busy && <span role="status">Procesando…</span>}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  </>;
}
