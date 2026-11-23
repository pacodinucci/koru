import type { PublicAppointmentInvitationView } from "../appointments.contract";

export const appointmentDate = (value: string) => new Date(value).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "long", timeStyle: "short" });
export const appointmentLabels = { PENDING: "Pendiente de elección", CONFIRMED: "Cita confirmada", REJECTED: "Solicitud de nuevos horarios", CANCELLED: "Cancelada", EXPIRED: "Invitación vencida", SEND_FAILED: "No se pudo enviar" };
export async function appointmentRequest<T = PublicAppointmentInvitationView>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal, ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  let result: { invitation?: T; error?: string };
  try { result = await response.json(); } catch { throw new Error("No pudimos cargar la invitación. Intentá nuevamente."); }
  if (!response.ok) throw new Error(result.error || "No pudimos procesar la invitación.");
  if (!("invitation" in result)) throw new Error("La respuesta de la invitación no es válida.");
  return result.invitation as T;
}
