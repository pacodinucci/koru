import { AppointmentError, type createAppointmentService } from "./appointments.domain";

type Actor = { id: string; email: string; role: string; permissions: readonly string[] };
type Service = Omit<ReturnType<typeof createAppointmentService>, "latest" | "manage"> & {
  latest(admissionId: string, actor?: Actor): ReturnType<ReturnType<typeof createAppointmentService>["latest"]>;
  manage(admissionId: string, invitationId: string, action: string, actor?: Actor): ReturnType<ReturnType<typeof createAppointmentService>["manage"]>;
  connection?(userId: string): Promise<{ connected: boolean }>;
};
type Dependencies = {
  origin: string;
  actor(): Promise<{ id: string; email: string; role: string; permissions: readonly string[] } | null>;
  contact(id: string): Promise<{ id: string; name: string; email: string } | null>;
  service: Service;
};
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow", Vary: "Cookie" } });
async function input(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new AppointmentError("Datos no válidos.");
  const decoder = new TextDecoder(); let text = ""; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new AppointmentError("Solicitud demasiado grande.", 413); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { const value = JSON.parse(text); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); return value; }
  catch { throw new AppointmentError("Datos no válidos."); }
}
function originGuard(request: Request, origin: string) {
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") throw new AppointmentError("Origen no autorizado.", 403);
}
function handleError(error: unknown) {
  if (error instanceof AppointmentError) return json({ error: error.message }, error.status);
  if (error && typeof error === "object" && "code" in error && ["P2021", "P2022"].includes(String(error.code))) return json({ error: "Citas no disponibles: falta actualizar la base de datos." }, 503);
  return json({ error: "No pudimos procesar la cita. Intentá nuevamente." }, 500);
}
export function createAppointmentHandlers(deps: Dependencies) {
  return {
    async admin(request: Request, admissionId: string, invitationId?: string) {
      try {
        if (!["GET", "POST"].includes(request.method) || (invitationId && request.method !== "POST")) throw new AppointmentError("Método no permitido.", 405);
        const actor = await deps.actor();
        const permission = request.method === "POST" ? "contacts.manage" : "contacts.view";
        if (!actor || !["ADMIN", "SUPERADMIN"].includes(actor.role) || !actor.permissions.includes(permission)) throw new AppointmentError("Acceso no autorizado.", 403);
        if (request.method === "POST") originGuard(request, deps.origin);
        if (!admissionId || admissionId.length > 128 || (invitationId && invitationId.length > 128)) throw new AppointmentError("Contacto no encontrado.", 404);
        const contact = await deps.contact(admissionId);
        if (!contact) throw new AppointmentError("Contacto no encontrado.", 404);
        if (request.method === "GET") return json({ invitation: await deps.service.latest(admissionId, actor), googleCalendar: deps.service.connection ? await deps.service.connection(actor.id) : { connected: false } });
        const body = await input(request);
        if (invitationId) {
          if (Object.keys(body).length !== 1 || !["cancel", "resend", "sync"].includes(String(body.action))) throw new AppointmentError("Acción no válida.");
          return json({ invitation: await deps.service.manage(admissionId, invitationId, String(body.action), actor) });
        }
        if (Object.keys(body).some(key => !["startsAt", "durationMinutes", "mode", "location", "message"].includes(key))) throw new AppointmentError("Datos no válidos.");
        return json({ invitation: await deps.service.create(contact, actor, body) });
      } catch (error) { return handleError(error); }
    },
    async public(request: Request, token: string) {
      try {
        if (!["GET", "POST"].includes(request.method)) throw new AppointmentError("Método no permitido.", 405);
        if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new AppointmentError("Invitación no disponible.", 404);
        if (request.method === "GET") return json({ invitation: await deps.service.publicView(token) });
        originGuard(request, deps.origin);
        const body = await input(request);
        if (!((body.action === "reject" && Object.keys(body).length === 1) || (body.action === "confirm" && Object.keys(body).length === 2 && typeof body.slotId === "string" && body.slotId.length > 0 && body.slotId.length <= 128))) throw new AppointmentError("Acción no válida.");
        return json({ invitation: await deps.service.respond(token, { action: String(body.action), slotId: body.slotId as string | undefined }) });
      } catch (error) { return handleError(error); }
    },
  };
}
