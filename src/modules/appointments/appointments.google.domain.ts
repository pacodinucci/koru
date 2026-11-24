import { AppointmentError, type AppointmentDependencies, type AppointmentRecord, type createAppointmentService } from "./appointments.domain";
import type { AppointmentInvitationView } from "./appointments.contract";
import type { AppointmentGoogleConnection, AppointmentGoogleEvent, AppointmentGoogleInput } from "./server/appointments.google";

type Actor = { id: string; email?: string };
type Dependencies = Pick<AppointmentDependencies, "withLock" | "now" | "id" | "token" | "hash" | "seal"> & {
  legacy: Pick<ReturnType<typeof createAppointmentService>, "latest" | "manage" | "publicView" | "respond">;
  deliverVisit(record: AppointmentRecord): Promise<boolean>;
  google: {
    connection(userId: string): Promise<AppointmentGoogleConnection>;
    eventId(id: string): string;
    create(connection: AppointmentGoogleConnection, input: AppointmentGoogleInput): Promise<AppointmentGoogleEvent>;
    get(connection: AppointmentGoogleConnection, id: string): Promise<AppointmentGoogleEvent | null>;
    cancel(connection: AppointmentGoogleConnection, id: string): Promise<void>;
  };
};
const inactive = () => new AppointmentError("La cita ya no admite esta acción.", 409);
const missing = () => new AppointmentError("Invitación no disponible.", 404);
const providerFailure = () => new AppointmentError("No pudimos confirmar la operación con Google Calendar. El horario sigue reservado; actualizá la respuesta antes de volver a intentarlo.", 502);
function view(row: AppointmentRecord, actor?: Actor): AppointmentInvitationView {
  return {
    id: row.id, status: row.status === "SENDING" ? "PENDING" : row.status,
    recipientName: row.recipientName.trim().split(/\s+/)[0] || "Familia", recipientEmail: row.recipientEmail,
    expiresAt: row.expiresAt.toISOString(), sentAt: row.sentAt?.toISOString() || null,
    durationMinutes: row.durationMinutes, mode: row.mode, location: row.location, message: row.message,
    slots: row.slots.map(slot => ({ ...slot })), selectedSlotId: row.selectedSlotId, confirmationEmailFailed: row.confirmationEmailFailed,
    provider: "GOOGLE_CALENDAR", googleEventUrl: row.googleEventUrl || null,
    googleRsvpStatus: (row.googleRsvpStatus || "needsAction") as AppointmentInvitationView["googleRsvpStatus"],
    googleSyncPending: !!row.googleSyncPending, canManageGoogle: actor?.id === row.initiatorId,
  };
}
function parse(value: unknown, now: Date) {
  if (!value || typeof value !== "object") throw new AppointmentError("Datos de cita no válidos.");
  const input = value as { startsAt: unknown; durationMinutes: number; mode: "IN_PERSON" | "ONLINE"; location: string; message?: string };
  if (!Array.isArray(input.startsAt) || input.startsAt.length !== 1 || typeof input.startsAt[0] !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(input.startsAt[0])) throw new AppointmentError("Elegí una sola fecha y hora futura para la cita.");
  const start = new Date(input.startsAt[0]);
  if (!Number.isFinite(start.getTime()) || start <= now) throw new AppointmentError("Elegí una sola fecha y hora futura para la cita.");
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 5 || input.durationMinutes > 240 || !["IN_PERSON", "ONLINE"].includes(input.mode)) throw new AppointmentError("Indicá modalidad y duración entre 5 y 240 minutos.");
  if (typeof input.location !== "string" || !input.location.trim() || input.location.length > 500 || (input.message !== undefined && (typeof input.message !== "string" || input.message.length > 2000))) throw new AppointmentError("Indicá el lugar o enlace y un mensaje de hasta 2000 caracteres.");
  if (input.mode === "ONLINE") {
    try { const url = new URL(input.location); if (url.protocol !== "https:" || !url.hostname || url.username || url.password) throw new Error(); }
    catch { throw new AppointmentError("Ingresá un enlace HTTPS válido para la cita online."); }
  }
  return { startsAt: start.toISOString(), endsAt: new Date(start.getTime() + input.durationMinutes * 60000).toISOString(), durationMinutes: input.durationMinutes, mode: input.mode, location: input.location.trim(), message: input.message?.trim() || null };
}
function intervals(row: AppointmentRecord, now: Date) {
  if (!["SENDING", "PENDING", "CONFIRMED"].includes(row.status)) return [];
  if (!row.googleEventId && row.status !== "CONFIRMED" && row.expiresAt <= now) return [];
  return row.slots.filter(slot => new Date(slot.endsAt) > now && (row.status !== "CONFIRMED" || slot.id === row.selectedSlotId));
}
function googleInput(row: AppointmentRecord): AppointmentGoogleInput {
  return { id: row.id, recipientName: row.recipientName, recipientEmail: row.recipientEmail, startsAt: row.slots[0].startsAt, endsAt: row.slots[0].endsAt, mode: row.mode, location: row.location, message: row.message };
}
export function createGoogleAppointmentService(deps: Dependencies) {
  async function boundConnection(row: AppointmentRecord) {
    let connection: AppointmentGoogleConnection;
    try { connection = await deps.google.connection(row.initiatorId); }
    catch { throw new AppointmentError("Conectá tu cuenta de Google Calendar desde Calendario para actualizar esta cita.", 409); }
    if (connection.accountId !== row.googleAccountId || connection.calendarId !== row.googleCalendarId) throw new AppointmentError("La cita pertenece a otra cuenta de Google. Reconectá la cuenta del organizador.", 409);
    return connection;
  }
  async function apply(row: AppointmentRecord, event: AppointmentGoogleEvent | null, actor: Actor, connection: AppointmentGoogleConnection) {
    // Withdraw a declined native invitation before releasing its interval: a late RSVP
    // must not resurrect a booking after another family reserves that time.
    if (event?.status !== "cancelled" && event?.responseStatus === "declined") {
      const pending = await deps.withLock(async store => {
        const current = await store.find(row.id);
        if (!current) throw missing();
        if (current.googleOperationVersion !== row.googleOperationVersion || current.status === "CANCELLED" || current.status === "REJECTED") return null;
        return store.update(row.id, { googleRsvpStatus: "declined", googleCancelPending: true, googleSyncPending: true });
      });
      if (pending) return cancel(pending, connection, actor);
    }
    let visit: AppointmentRecord | undefined;
    const result = await deps.withLock(async store => {
      const current = await store.find(row.id);
      if (!current) throw missing();
      if (current.googleOperationVersion !== row.googleOperationVersion || current.googleCancelPending || current.status === "CANCELLED") return view(current, actor);
      const status = !event || event.status === "cancelled" ? "CANCELLED" : event.responseStatus === "accepted" ? "CONFIRMED" : event.responseStatus === "declined" ? "REJECTED" : "PENDING";
      const sendVisit = event?.status === "confirmed" && ["PENDING", "CONFIRMED"].includes(status) && (!current.sentAt || current.confirmationEmailFailed);
      const updated = await store.update(row.id, {
        confirmationEmailFailed: sendVisit || current.confirmationEmailFailed,
        status, selectedSlotId: status === "CONFIRMED" ? current.slots[0].id : null,
        googleRsvpStatus: event?.responseStatus || current.googleRsvpStatus, googleEventUrl: event?.htmlLink || current.googleEventUrl,
        googleSyncPending: false, sentAt: event ? current.sentAt || deps.now() : current.sentAt,
      });
      if (sendVisit) visit = updated;
      return view(updated, actor);
    });
    if (!visit) return result;
    // Mail runs outside the reservation transaction. Its failure must not undo Google.
    let delivered = false;
    try { delivered = await deps.deliverVisit(visit); } catch { /* Explicit sync can retry mail independently. */ }
    return deps.withLock(async store => {
      const current = await store.find(row.id);
      if (!current) throw missing();
      if (current.googleOperationVersion !== row.googleOperationVersion || !["PENDING", "CONFIRMED"].includes(current.status)) return view(current, actor);
      return view(await store.update(row.id, { confirmationEmailFailed: !delivered }), actor);
    });
  }
  async function cancel(row: AppointmentRecord, connection: AppointmentGoogleConnection, actor: Actor) {
    try { await deps.google.cancel(connection, row.id); }
    catch { throw providerFailure(); }
    return deps.withLock(async store => {
      const current = await store.find(row.id);
      if (!current) throw missing();
      if (current.googleOperationVersion !== row.googleOperationVersion) return view(current, actor);
      return view(await store.update(row.id, { status: current.googleRsvpStatus === "declined" ? "REJECTED" : "CANCELLED", googleCancelPending: false, googleSyncPending: false }), actor);
    });
  }
  return {
    async connection(userId: string) {
      try { await deps.google.connection(userId); return { connected: true }; } catch { return { connected: false }; }
    },
    async latest(admissionId: string, actor?: Actor) {
      const row = await deps.withLock(store => store.latest(admissionId));
      return row?.googleEventId ? view(row, actor) : deps.legacy.latest(admissionId);
    },
    async create(contact: { id: string; name: string; email: string }, actor: { id: string; email: string }, value: unknown) {
      const input = parse(value, deps.now());
      let connection: AppointmentGoogleConnection;
      try { connection = await deps.google.connection(actor.id); }
      catch { throw new AppointmentError("Conectá tu cuenta de Google Calendar desde Calendario para agendar la cita.", 409); }
      const row = await deps.withLock(async store => {
        const now = deps.now(); parse(value, now);
        const active = await store.listActive();
        if (active.some(existing => existing.admissionId === contact.id && (intervals(existing, now).length || (!existing.googleEventId && existing.status === "PENDING" && existing.expiresAt > now)))) throw new AppointmentError("Este contacto ya tiene una invitación o cita activa.", 409);
        if (active.some(existing => intervals(existing, now).some(slot => input.startsAt < slot.endsAt && input.endsAt > slot.startsAt))) throw new AppointmentError("El horario ya está reservado. Elegí otro.", 409);
        const id = deps.id(); const token = deps.token();
        return store.insert({
          id, admissionId: contact.id, recipientName: contact.name, recipientEmail: contact.email, initiatorId: actor.id, initiatorEmail: actor.email,
          tokenHash: deps.hash(token), tokenCipher: deps.seal(token), status: "SENDING", expiresAt: new Date(input.endsAt), sentAt: null,
          durationMinutes: input.durationMinutes, mode: input.mode, location: input.location, message: input.message,
          slots: [{ id: deps.id(), startsAt: input.startsAt, endsAt: input.endsAt }], selectedSlotId: null, confirmationEmailFailed: false, resendCount: 0, createdAt: now,
          googleAccountId: connection.accountId, googleCalendarId: connection.calendarId, googleEventId: deps.google.eventId(id), googleEventUrl: null,
          googleRsvpStatus: "needsAction", googleSyncPending: true, googleCancelPending: false, googleOperationVersion: 1,
        });
      });
      try { return await apply(row, await deps.google.create(connection, googleInput(row)), actor, connection); }
      catch (error) {
        if (error && typeof error === "object" && "outcome" in error && ["rejected", "unavailable"].includes(String(error.outcome))) {
          const failure = await deps.withLock(async store => {
            const current = await store.find(row.id);
            if (!current) throw missing();
            // Recovery or cancellation may have superseded this request while Google responded.
            // A stale failure must never release an interval backed by a recovered live event.
            if (current.googleOperationVersion !== row.googleOperationVersion || current.status !== "SENDING") return { released: false, current };
            return { released: true, current: await store.update(row.id, { status: "SEND_FAILED", googleSyncPending: false }) };
          });
          if (!failure.released) return view(failure.current, actor);
          throw new AppointmentError("No pudimos enviar la invitación de Google Calendar. El horario se liberó; podés reintentar.", 502);
        }
        // Unknown delivery outcome retains the interval. Explicit refresh recovers the deterministic event.
        const current = await deps.withLock(store => store.find(row.id));
        if (!current) throw providerFailure();
        return view(current, actor);
      }
    },
    async manage(admissionId: string, id: string, action: string, actor?: Actor) {
      const original = await deps.withLock(store => store.find(id));
      if (!original || original.admissionId !== admissionId) throw missing();
      if (!original.googleEventId) {
        if (action === "sync") throw inactive();
        return deps.legacy.manage(admissionId, id, action);
      }
      if (!actor || actor.id !== original.initiatorId) throw new AppointmentError("Solo el administrador que agenda puede actualizar esta cita de Google.", 403);
      if (!["sync", "cancel"].includes(action)) throw inactive();
      if (original.status === "SEND_FAILED") throw inactive();
      if (["CANCELLED", "REJECTED"].includes(original.status)) return view(original, actor);
      if (action === "cancel" && original.status === "SENDING") throw new AppointmentError("Primero actualizá la respuesta para verificar el envío en Google Calendar.", 409);
      const connection = await boundConnection(original);
      const row = await deps.withLock(async store => {
        const current = await store.find(id);
        if (!current) throw missing();
        return store.update(id, { googleOperationVersion: (current.googleOperationVersion || 0) + 1, googleSyncPending: true, googleCancelPending: action === "cancel" || !!current.googleCancelPending });
      });
      if (row.googleCancelPending) return cancel(row, connection, actor);
      try {
        let event = await deps.google.get(connection, id);
        // Explicit recovery of an uncertain creation reuses the original immutable event ID and payload.
        if (!event && row.status === "SENDING") event = await deps.google.create(connection, googleInput(row));
        return await apply(row, event, actor, connection);
      } catch { throw providerFailure(); }
    },
    publicView: deps.legacy.publicView,
    respond: deps.legacy.respond,
  };
}
