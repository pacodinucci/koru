import "server-only";
import { createElement } from "react";
import { EmailMessageType } from "@prisma/client";
import { Html, Head, Preview, Body, Container, Heading, Text, Button } from "@react-email/components";
import { env } from "@/lib/env";
import { sendMail } from "@/modules/mailing/server/mailing.service";
import type { AppointmentRecord } from "../appointments.domain";

const format = (value: string | Date) => new Date(value).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "full", timeStyle: "short" });
function AppointmentEmail({ kind, record, url }: { kind: string; record: AppointmentRecord; url: string }) {
  const title = kind === "invitation" ? "Elegí un horario para tu cita" : kind === "confirmation" ? "Cita confirmada" : "Se necesitan nuevos horarios";
  const slots = kind === "confirmation" ? record.slots.filter(slot => slot.id === record.selectedSlotId) : record.slots;
  return <Html lang="es"><Head /><Preview>{title}</Preview><Body style={{ backgroundColor: "#f8faf7", fontFamily: "Arial, sans-serif" }}><Container style={{ padding: 24 }}>
    <Heading>Koru · {title}</Heading><Text>{record.recipientName}</Text>
    {kind === "rejection" ? <Text>La familia indicó que ninguno de los horarios propuestos le sirve. Los horarios se liberaron. Podés enviar una nueva propuesta desde el contacto.</Text> : <>
      {slots.map(slot => <Text key={slot.id}>{format(slot.startsAt)} — {record.durationMinutes} minutos</Text>)}
      <Text>Zona horaria: Ciudad de México (America/Mexico_City).</Text>
      <Text>{record.mode === "ONLINE" ? "Online" : "Presencial"}: {record.location}</Text>
      {record.message && <Text style={{ whiteSpace: "pre-wrap" }}>{record.message}</Text>}
      {kind === "invitation" && <Text>{record.sentAt ? `Estos horarios están reservados hasta el ${format(record.expiresAt)}.` : "Estos horarios quedan reservados durante 48 horas desde el envío exitoso de esta invitación. Consultá el vencimiento exacto en el enlace."} Elegí uno antes del vencimiento. Si ninguno te sirve, podés indicarlo desde el mismo enlace.</Text>}
    </>}
    <Button href={url} style={{ padding: "12px 20px", backgroundColor: "#55764d", color: "#fff", borderRadius: 6 }}>{kind === "invitation" ? "Elegir horario" : kind === "rejection" ? "Ver contacto" : "Ver cita"}</Button>
  </Container></Body></Html>;
}
function VisitEmail({ record }: { record: AppointmentRecord }) {
  return <Html lang="es"><Head /><Preview>Tu visita a Koru</Preview><Body style={{ backgroundColor: "#f8faf7", fontFamily: "Arial, sans-serif" }}><Container style={{ padding: 24 }}>
    <Heading>Tu visita a Koru</Heading>
    <Text>Hola, {record.recipientName}.</Text>
    <Text>Gracias por completar el cuestionario inicial. Durante esta cita podremos conversar sobre lo que nos compartiste, conocer mejor a tu familia y resolver tus dudas sobre Koru.</Text>
    <Text>{format(record.slots[0].startsAt)} — {record.durationMinutes} minutos.</Text>
    <Text>Zona horaria: Ciudad de México (America/Mexico_City).</Text>
    <Text>{record.mode === "ONLINE" ? "La visita será online. Enlace" : "La visita será presencial. Lugar"}: {record.location}</Text>
    {record.message && <Text style={{ whiteSpace: "pre-wrap" }}>{record.message}</Text>}
    <Text>Recibirás por separado una invitación de Google Calendar desde la cuenta de quien organiza la cita. Para confirmar tu asistencia, aceptá esa invitación. Este correo es informativo y no reemplaza la invitación de calendario.</Text>
  </Container></Body></Html>;
}
export async function deliverAppointmentVisitMail(record: AppointmentRecord) {
  const result = await sendMail({
    type: EmailMessageType.MANUAL, subject: "Koru · Tu visita a Koru",
    to: [{ email: record.recipientEmail, name: record.recipientName }],
    react: createElement(VisitEmail, { record }),
    payload: { appointmentInvitationId: record.id, kind: "visit", audience: "family" },
    idempotencyKey: `appointment-${record.id}-visit-family`,
  });
  return result.status === "sent";
}
export async function deliverAppointmentMail(kind: "invitation" | "confirmation" | "rejection", record: AppointmentRecord, token?: string) {
  const base = env.APP_URL || env.BETTER_AUTH_URL;
  const privateUrl = new URL(`/dashboard/contactos/admission/${encodeURIComponent(record.admissionId)}`, base).toString();
  const familyUrl = kind !== "rejection" && token ? new URL(`/citas/${encodeURIComponent(token)}`, base).toString() : undefined;
  if (kind === "invitation" && !familyUrl) return false;
  const targets = kind === "confirmation" ? [
    { email: record.recipientEmail, name: record.recipientName, audience: "family", url: familyUrl || new URL("/", base).toString() },
    { email: record.initiatorEmail, audience: "admin", url: privateUrl },
  ] : [{ email: kind === "invitation" ? record.recipientEmail : record.initiatorEmail, name: kind === "invitation" ? record.recipientName : undefined, audience: kind === "invitation" ? "family" : "admin", url: familyUrl || privateUrl }];
  const results = await Promise.all(targets.map(async target => {
    try {
      const result = await sendMail({ type: EmailMessageType.MANUAL, subject: `Koru · ${kind === "invitation" ? "Invitación a una cita" : kind === "confirmation" ? "Cita confirmada" : "Solicitud de nuevos horarios"}`, to: [{ email: target.email, name: target.name }], react: createElement(AppointmentEmail, { kind, record, url: target.url }),
        // Token stays only in the email body, never in the persisted payload or idempotency key.
        payload: { appointmentInvitationId: record.id, kind, audience: target.audience },
        idempotencyKey: `appointment-${record.id}-${kind}-${target.audience}-${kind === "invitation" ? record.resendCount : 0}` });
      return result.status === "sent";
    } catch { return false; }
  }));
  return results.every(Boolean);
}
