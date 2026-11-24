import "server-only";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AppointmentGoogleConnection = { userId: string; accountId: string; calendarId: string };
export type AppointmentGoogleInput = { id: string; recipientName: string; recipientEmail: string; startsAt: string; endsAt: string; mode: "IN_PERSON" | "ONLINE"; location: string; message: string | null };
export type AppointmentGoogleEvent = { id: string; htmlLink: string | null; status: "confirmed" | "cancelled"; responseStatus: "needsAction" | "accepted" | "declined" | "tentative" };
export class AppointmentGoogleError extends Error {
  constructor(public outcome: "rejected" | "unknown" | "unavailable") {
    super(outcome === "unavailable" ? "Conectá tu cuenta de Google Calendar desde Calendario para agendar la cita." : "No pudimos confirmar la operación con Google Calendar. Actualizá la respuesta antes de volver a intentarlo.");
  }
}
const scope = "https://www.googleapis.com/auth/calendar.events.owned";
async function connected(userId: string) {
  const row = await prisma.googleCalendarConnection.findUnique({ where: { userId }, include: { account: true } });
  if (!row || row.status !== "ACTIVE" || row.account.userId !== userId || row.account.providerId !== "google" || !row.account.scope?.split(/[ ,]+/).includes(scope)) throw new AppointmentGoogleError("unavailable");
  return row;
}
export async function getAppointmentGoogleConnection(userId: string): Promise<AppointmentGoogleConnection> {
  const row = await connected(userId);
  return { userId, accountId: row.accountId, calendarId: "primary" };
}
export const appointmentGoogleEventId = (id: string) => `koruappointment${createHash("sha256").update(id).digest("hex")}`;
async function request(connection: AppointmentGoogleConnection, suffix: string, method: string, body?: unknown) {
  const row = await connected(connection.userId);
  if (row.accountId !== connection.accountId || connection.calendarId !== "primary") throw new AppointmentGoogleError("unavailable");
  let accessToken: string;
  try {
    const token = await auth.api.getAccessToken({ body: { providerId: "google", userId: connection.userId, accountId: row.account.accountId } });
    accessToken = token.accessToken;
    if (!accessToken) throw new Error();
  } catch { throw new AppointmentGoogleError("unavailable"); }
  let response: Response;
  try {
    response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events${suffix}`, {
      method, headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
    });
  } catch { throw new AppointmentGoogleError("unknown"); }
  if ([401, 403].includes(response.status)) {
    await prisma.googleCalendarConnection.updateMany({ where: { id: row.id }, data: { status: "NEEDS_REAUTH", lastError: "appointment_google_access_denied" } }).catch(() => {});
    throw new AppointmentGoogleError(method === "POST" ? "rejected" : "unavailable");
  }
  if (!response.ok && ![404, 409, 410].includes(response.status)) throw new AppointmentGoogleError(response.status >= 500 ? "unknown" : "rejected");
  return response;
}
type EventBody = {
  id?: string; status?: string; htmlLink?: string;
  extendedProperties?: { private?: { koruAppointmentId?: string; koruRecipientEmail?: string } };
  attendees?: { email?: string; responseStatus?: string }[];
};
async function readEvent(response: Response, id: string): Promise<AppointmentGoogleEvent> {
  let body: EventBody;
  try { body = await response.json(); } catch { throw new AppointmentGoogleError("unknown"); }
  if (body.id !== appointmentGoogleEventId(id) || body.extendedProperties?.private?.koruAppointmentId !== id) throw new AppointmentGoogleError("unknown");
  const recipient = body.extendedProperties.private.koruRecipientEmail;
  const attendee = body.attendees?.find(value => value.email?.toLowerCase() === recipient?.toLowerCase());
  if (body.status !== "cancelled" && (!recipient || !attendee)) throw new AppointmentGoogleError("unknown");
  const responseStatus = attendee?.responseStatus;
  return { id: body.id, htmlLink: body.htmlLink || null, status: body.status === "cancelled" ? "cancelled" : "confirmed", responseStatus: responseStatus === "accepted" || responseStatus === "declined" || responseStatus === "tentative" ? responseStatus : "needsAction" };
}
export async function getAppointmentGoogleEvent(connection: AppointmentGoogleConnection, id: string): Promise<AppointmentGoogleEvent | null> {
  const response = await request(connection, `/${appointmentGoogleEventId(id)}`, "GET");
  if ([404, 410].includes(response.status)) return null;
  if (!response.ok) throw new AppointmentGoogleError("unknown");
  return readEvent(response, id);
}
export async function createAppointmentGoogleEvent(connection: AppointmentGoogleConnection, input: AppointmentGoogleInput): Promise<AppointmentGoogleEvent> {
  const payload = {
    id: appointmentGoogleEventId(input.id), summary: `Koru · Cita de admisión · ${input.recipientName}`,
    description: input.message || "Cita de admisión Koru. Respondé a esta invitación para confirmar tu asistencia.", location: input.location,
    start: { dateTime: input.startsAt, timeZone: "America/Mexico_City" }, end: { dateTime: input.endsAt, timeZone: "America/Mexico_City" },
    attendees: [{ email: input.recipientEmail, displayName: input.recipientName, responseStatus: "needsAction" }],
    guestsCanModify: false, guestsCanInviteOthers: false, guestsCanSeeOtherGuests: false,
    extendedProperties: { private: { koruAppointmentId: input.id, koruRecipientEmail: input.recipientEmail } },
  };
  try {
    const response = await request(connection, "?sendUpdates=all", "POST", payload);
    if (response.ok) return await readEvent(response, input.id);
    if (response.status !== 409) throw new AppointmentGoogleError("rejected");
  } catch (error) {
    if (!(error instanceof AppointmentGoogleError) || error.outcome !== "unknown") throw error;
    // A lost response is not a failed insertion. Recover by deterministic ID, never retry a mutation here.
    try { const existing = await getAppointmentGoogleEvent(connection, input.id); if (existing) return existing; } catch { /* Keep the original uncertain outcome. */ }
    throw error;
  }
  // A duplicate response proves an event may already exist. Failure to read it
  // (including expired credentials) cannot safely release the local reservation.
  try {
    const existing = await getAppointmentGoogleEvent(connection, input.id);
    if (existing) return existing;
  } catch { /* Preserve uncertainty after an existing-event response. */ }
  throw new AppointmentGoogleError("unknown");
}
export async function cancelAppointmentGoogleEvent(connection: AppointmentGoogleConnection, id: string): Promise<void> {
  const event = await getAppointmentGoogleEvent(connection, id);
  if (!event || event.status === "cancelled") return;
  const response = await request(connection, `/${appointmentGoogleEventId(id)}?sendUpdates=all`, "DELETE");
  if (!response.ok && ![404, 410].includes(response.status)) throw new AppointmentGoogleError("unknown");
}
