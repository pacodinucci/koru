import type { AppointmentInvitationView, PublicAppointmentInvitationView } from "../appointments.contract";

export type GoogleRsvpStatus = NonNullable<AppointmentInvitationView["googleRsvpStatus"]>;

/** Admin-only Google additions come from the shared contract; absent provider means a legacy emailed invitation. */
export type AdminAppointmentInvitationView = AppointmentInvitationView;

export type AdminAppointmentSnapshot = {
  invitation: AdminAppointmentInvitationView | null;
  googleCalendar: { connected: boolean };
};

/** Existing project Google Calendar connection UI; do not invent another path. */
export const googleCalendarSettingsPath = "/calendario";

export const appointmentDate = (value: string) => new Date(value).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "long", timeStyle: "short" });
export const appointmentLabels = { PENDING: "Pendiente de elección", CONFIRMED: "Cita confirmada", REJECTED: "Solicitud de nuevos horarios", CANCELLED: "Cancelada", EXPIRED: "Invitación vencida", SEND_FAILED: "No se pudo enviar" };
export const googleRsvpLabels: Record<GoogleRsvpStatus, string> = {
  needsAction: "Pendiente de respuesta",
  tentative: "Confirmación tentativa",
  accepted: "Cita confirmada",
  declined: "Cancelada por la familia",
};

/** Only trusted Google Calendar event URLs may become a renderable link. */
export function googleEventUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const trusted = url.hostname === "calendar.google.com" || (url.hostname === "www.google.com" && url.pathname.startsWith("/calendar"));
    return trusted ? url.toString() : null;
  } catch { return null; }
}

type AppointmentEnvelope = { invitation?: unknown; googleCalendar?: { connected?: unknown }; error?: string };

async function appointmentEnvelope(url: string, body?: unknown, signal?: AbortSignal): Promise<AppointmentEnvelope> {
  const response = await fetch(url, { cache: "no-store", signal, ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  let result: AppointmentEnvelope;
  try { result = await response.json(); } catch { throw new Error("No pudimos cargar la invitación. Intentá nuevamente."); }
  if (!response.ok) throw new Error(result.error || "No pudimos procesar la invitación.");
  if (!("invitation" in result)) throw new Error("La respuesta de la invitación no es válida.");
  return result;
}

export async function appointmentRequest<T = PublicAppointmentInvitationView>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return (await appointmentEnvelope(url, body, signal)).invitation as T;
}

/** Admin GET carries {invitation, googleCalendar}. A missing flag is treated as disconnected. */
export async function appointmentAdminSnapshot(url: string, signal?: AbortSignal): Promise<AdminAppointmentSnapshot> {
  const result = await appointmentEnvelope(url, undefined, signal);
  return {
    invitation: (result.invitation ?? null) as AdminAppointmentInvitationView | null,
    googleCalendar: { connected: result.googleCalendar?.connected === true },
  };
}
