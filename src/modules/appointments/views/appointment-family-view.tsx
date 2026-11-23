"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PublicAppointmentInvitationView } from "../appointments.contract";
import { appointmentDate, appointmentRequest } from "./appointment-client";

export function AppointmentFamilyView({ token }: { token: string }) {
  const endpoint = `/api/public/appointments/${encodeURIComponent(token)}`;
  const [snapshot, setSnapshot] = useState<{ key: string; invitation: PublicAppointmentInvitationView } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [selection, setSelection] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const operation = useRef(false); const identity = useRef(endpoint); identity.current = endpoint;
  const invitation = snapshot?.key === endpoint ? snapshot.invitation : null;
  const error = failure?.key === endpoint ? failure.message : "";
  useEffect(() => {
    const controller = new AbortController(); setFailure(null); setSelection("");
    appointmentRequest(endpoint, undefined, controller.signal).then(invitation => {
      if (!controller.signal.aborted) setSnapshot({ key: endpoint, invitation });
    }).catch(cause => { if (!controller.signal.aborted) setFailure({ key: endpoint, message: cause.message }); });
    return () => controller.abort();
  }, [endpoint, retry]);
  const expired = invitation?.status === "PENDING" && new Date(invitation.expiresAt) <= new Date();
  const pending = invitation?.status === "PENDING" && !expired;
  async function respond(action: "confirm" | "reject") {
    if (operation.current || !pending || (action === "confirm" && !selection)) return;
    operation.current = true; setBusy(true); setFailure(null); const key = endpoint;
    try {
      const result = await appointmentRequest(endpoint, action === "confirm" ? { action, slotId: selection } : { action });
      if (identity.current === key) setSnapshot({ key, invitation: result });
    } catch (cause) { if (identity.current === key) setFailure({ key, message: cause instanceof Error ? cause.message : "No pudimos confirmar tu elección." }); }
    finally { operation.current = false; setBusy(false); }
  }
  return <main className="mx-auto min-h-screen w-full max-w-2xl space-y-5 px-6 py-12">
    <p className="font-medium text-primary">Koru · Cita de admisión</p>
    <h1 className="text-3xl font-semibold">{invitation?.status === "CONFIRMED" ? "Cita confirmada" : "Elegí un horario para tu cita"}</h1>
    {error && <div role="alert"><p>{error}</p>{!invitation && <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Reintentar</Button>}</div>}
    {!invitation && !error && <p role="status">Cargando invitación…</p>}
    {invitation && <>
      <p>Hola, {invitation.recipientName}.</p>
      {pending && <>
        <p>Los horarios están reservados hasta {appointmentDate(invitation.expiresAt)}. Elegí una opción y confirmá tu cita.</p>
        <p>Zona horaria: Ciudad de México (America/Mexico_City).</p>
        <fieldset className="space-y-3"><legend className="mb-2 font-medium">Horarios disponibles</legend>{invitation.slots.map(slot => <label key={slot.id} className="flex items-start gap-3 rounded-lg border p-4">
          <input type="radio" name="appointment-slot" value={slot.id} checked={selection === slot.id} disabled={busy || new Date(slot.startsAt) <= new Date()} onChange={() => setSelection(slot.id)} />
          <span>{appointmentDate(slot.startsAt)} · {invitation.durationMinutes} minutos{new Date(slot.startsAt) <= new Date() && " · Horario pasado"}</span>
        </label>)}</fieldset>
      </>}
      {invitation.status === "CONFIRMED" && <>
        <p>Tu cita ya quedó confirmada. No necesitás volver a reservar.</p>
        {invitation.slots.filter(slot => slot.id === invitation.selectedSlotId).map(slot => <p key={slot.id} className="text-lg font-semibold">{appointmentDate(slot.startsAt)} · {invitation.durationMinutes} minutos</p>)}
        <p>Zona horaria: Ciudad de México (America/Mexico_City).</p>
      </>}
      {(pending || invitation.status === "CONFIRMED") && <>
        <p>{invitation.mode === "ONLINE" ? "Online" : "Presencial"}: {invitation.location}</p>
        {invitation.mode === "ONLINE" && invitation.status === "CONFIRMED" && /^https:\/\//i.test(invitation.location) && <a className="underline" href={invitation.location} target="_blank" rel="noopener noreferrer">Abrir enlace de la reunión</a>}
        {invitation.message && <p className="whitespace-pre-wrap break-words">{invitation.message}</p>}
      </>}
      {(expired || invitation.status === "EXPIRED") && <p>Esta invitación venció y los horarios se liberaron. Contactá a Koru para recibir nuevas opciones.</p>}
      {invitation.status === "CANCELLED" && <p>Esta invitación fue cancelada. Contactá a Koru para coordinar otra propuesta.</p>}
      {invitation.status === "REJECTED" && <p>Gracias por avisarnos. Notificamos a Koru para que puedan ofrecerte nuevos horarios.</p>}
      {pending && <div className="flex flex-wrap gap-3"><Button disabled={busy || !selection || !invitation.slots.some(slot => slot.id === selection && new Date(slot.startsAt) > new Date())} onClick={() => respond("confirm")}>Confirmar cita</Button><Button variant="outline" disabled={busy} onClick={() => respond("reject")}>Ninguno de estos horarios me sirve</Button></div>}
      {busy && <p role="status">Guardando tu elección…</p>}
    </>}
  </main>;
}
