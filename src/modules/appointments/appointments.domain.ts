import type { AppointmentInvitationView, AppointmentSlotView, AppointmentStatus, CreateAppointmentInvitationInput, PublicAppointmentInvitationView } from "./appointments.contract";

const HOUR = 60 * 60 * 1000;
export class AppointmentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type AppointmentRecord = {
  id: string; admissionId: string; recipientName: string; recipientEmail: string;
  initiatorId: string; initiatorEmail: string; tokenHash: string; tokenCipher: string;
  status: AppointmentStatus | "SENDING"; expiresAt: Date; sentAt: Date | null;
  durationMinutes: number; mode: "IN_PERSON" | "ONLINE"; location: string; message: string | null;
  selectedSlotId: string | null; confirmationEmailFailed: boolean; resendCount: number;
  createdAt: Date; slots: AppointmentSlotView[];
};
export type AppointmentStore = {
  listActive(): Promise<AppointmentRecord[]>;
  latest(admissionId: string): Promise<AppointmentRecord | null>;
  find(id: string): Promise<AppointmentRecord | null>;
  byHash(hash: string): Promise<AppointmentRecord | null>;
  insert(record: AppointmentRecord): Promise<AppointmentRecord>;
  update(id: string, patch: Partial<AppointmentRecord>): Promise<AppointmentRecord>;
};
export type AppointmentDependencies = {
  withLock<T>(action: (store: AppointmentStore) => Promise<T>): Promise<T>;
  now(): Date; id(): string; token(): string; hash(token: string): string;
  seal(token: string): string; unseal(cipher: string): string;
  deliver(kind: "invitation" | "confirmation" | "rejection", record: AppointmentRecord, token?: string): Promise<boolean>;
};
function state(record: AppointmentRecord, now: Date): AppointmentStatus {
  if (record.status === "SENDING") return record.expiresAt <= now ? "SEND_FAILED" : "PENDING";
  return record.status === "PENDING" && record.expiresAt <= now ? "EXPIRED" : record.status;
}
function activeSlots(record: AppointmentRecord, now: Date) {
  const status = state(record, now);
  if (status === "CONFIRMED") return record.slots.filter(slot => slot.id === record.selectedSlotId && new Date(slot.endsAt) > now);
  return status === "PENDING" ? record.slots.filter(slot => new Date(slot.endsAt) > now) : [];
}
function publicView(record: AppointmentRecord, now: Date): PublicAppointmentInvitationView {
  return {
    status: state(record, now), recipientName: record.recipientName.trim().split(/\s+/)[0] || "Familia",
    expiresAt: record.expiresAt.toISOString(), durationMinutes: record.durationMinutes,
    mode: record.mode, location: record.location, message: record.message,
    slots: record.slots.map(slot => ({ ...slot })), selectedSlotId: record.selectedSlotId,
  };
}
function adminView(record: AppointmentRecord, now: Date): AppointmentInvitationView {
  return { ...publicView(record, now), id: record.id, recipientEmail: record.recipientEmail, sentAt: record.sentAt?.toISOString() ?? null, confirmationEmailFailed: record.confirmationEmailFailed };
}
function parseInput(value: unknown, now: Date): CreateAppointmentInvitationInput {
  if (!value || typeof value !== "object") throw new AppointmentError("Datos de cita no válidos.");
  const input = value as CreateAppointmentInvitationInput;
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 5 || input.durationMinutes > 240 || !["IN_PERSON", "ONLINE"].includes(input.mode)) throw new AppointmentError("Indicá modalidad y duración entre 5 y 240 minutos.");
  const location = typeof input.location === "string" ? input.location.trim() : "";
  if (!location || location.length > 500 || (input.message !== undefined && (typeof input.message !== "string" || input.message.length > 2000))) throw new AppointmentError("Indicá el lugar o enlace y un mensaje de hasta 2000 caracteres.");
  if (input.mode === "ONLINE") {
    let valid = false;
    try { const url = new URL(location); valid = url.protocol === "https:" && !!url.hostname && !url.username && !url.password; } catch { /* Invalid URL. */ }
    if (!valid) throw new AppointmentError("Ingresá un enlace HTTPS válido para la cita online.");
  }
  const times = input.startsAt;
  const error = () => new AppointmentError("Elegí entre uno y tres horarios futuros, distintos y sin superposición.");
  if (!Array.isArray(times) || times.length < 1 || times.length > 3) throw error();
  const starts = times.map(time => typeof time === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(time) ? new Date(time).getTime() : NaN).sort((a, b) => a - b);
  if (starts.some((time, index) => !Number.isFinite(time) || time <= now.getTime() || (index > 0 && time < starts[index - 1] + input.durationMinutes * 60_000))) throw error();
  return { durationMinutes: input.durationMinutes, mode: input.mode, location, message: input.message?.trim(), startsAt: starts.map(time => new Date(time).toISOString()) };
}
const unavailable = () => new AppointmentError("Invitación no disponible.", 404);
const inactive = () => new AppointmentError("La invitación ya no admite esta acción.", 409);

export function createAppointmentService(deps: AppointmentDependencies) {
  async function deliver(kind: "invitation" | "confirmation" | "rejection", record: AppointmentRecord, token?: string) {
    try { return await deps.deliver(kind, record, token); } catch { return false; }
  }
  async function notifyConfirmation(record: AppointmentRecord) {
    let sent = false;
    try { sent = await deliver("confirmation", record, deps.unseal(record.tokenCipher)); } catch { /* Keep the confirmed booking and expose a retry warning. */ }
    return deps.withLock(store => store.update(record.id, { confirmationEmailFailed: !sent }));
  }
  async function lookup(store: AppointmentStore, token: string) {
    if (typeof token !== "string" || !token || token.length > 256) throw unavailable();
    const record = await store.byHash(deps.hash(token));
    if (!record || record.status === "SENDING" || record.status === "SEND_FAILED") throw unavailable();
    return record;
  }
  return {
    async latest(admissionId: string) {
      return deps.withLock(async store => { const record = await store.latest(admissionId); return record ? adminView(record, deps.now()) : null; });
    },
    async create(contact: { id: string; name: string; email: string }, actor: { id: string; email: string }, value: unknown) {
      const input = parseInput(value, deps.now());
      const token = deps.token();
      const record = await deps.withLock(async store => {
        const now = deps.now();
        // Revalidate inside the lock: a queued request must not reserve a past interval.
        parseInput(input, now);
        const records = await store.listActive();
        if (records.some(row => row.admissionId === contact.id && (state(row, now) === "PENDING" || activeSlots(row, now).length > 0))) throw new AppointmentError("Este contacto ya tiene una invitación o cita activa.", 409);
        const slots = input.startsAt.map(startsAt => ({ id: deps.id(), startsAt, endsAt: new Date(new Date(startsAt).getTime() + input.durationMinutes * 60_000).toISOString() }));
        if (records.some(row => activeSlots(row, now).some(held => slots.some(slot => slot.startsAt < held.endsAt && slot.endsAt > held.startsAt)))) throw new AppointmentError("Uno de los horarios ya está reservado. Elegí otro.", 409);
        return store.insert({ id: deps.id(), admissionId: contact.id, recipientName: contact.name, recipientEmail: contact.email, initiatorId: actor.id, initiatorEmail: actor.email, tokenHash: deps.hash(token), tokenCipher: deps.seal(token), status: "SENDING", expiresAt: new Date(now.getTime() + 10 * 60_000), sentAt: null, ...input, message: input.message || null, selectedSlotId: null, confirmationEmailFailed: false, resendCount: 0, createdAt: now, slots });
      });
      // The provider must accept delivery before the family's full 48-hour window starts.
      // Initial mail explains the relative window; the public page shows the authoritative deadline.
      const sent = await deliver("invitation", record, token);
      const sentAt = deps.now();
      const expiresAt = new Date(sentAt.getTime() + 48 * HOUR);
      const finished = await deps.withLock(async store => {
        const current = await store.find(record.id);
        if (!current || current.status !== "SENDING" || current.expiresAt <= deps.now()) throw new AppointmentError("El envío tardó demasiado. Volvé a intentar.", 503);
        return store.update(record.id, sent ? { status: "PENDING", sentAt, expiresAt } : { status: "SEND_FAILED" });
      });
      if (!sent) throw new AppointmentError("No pudimos enviar la invitación. Los horarios se liberaron; podés reintentar.", 502);
      return adminView(finished, deps.now());
    },
    async manage(admissionId: string, id: string, action: string) {
      const record = await deps.withLock(async store => {
        const row = await store.find(id);
        if (!row || row.admissionId !== admissionId) throw unavailable();
        const status = state(row, deps.now());
        if (action === "cancel" && status === "PENDING" && row.status !== "SENDING") return store.update(id, { status: "CANCELLED" });
        if (action !== "resend" || row.status === "SENDING" || !["PENDING", "CONFIRMED"].includes(status)) throw inactive();
        return store.update(id, { resendCount: row.resendCount + 1 });
      });
      if (action === "resend") {
        if (record.status === "CONFIRMED") return adminView(await notifyConfirmation(record), deps.now());
        if (!await deliver("invitation", record, deps.unseal(record.tokenCipher))) throw new AppointmentError("No pudimos reenviar el mail. Se conserva el vencimiento original.", 502);
      }
      return adminView(record, deps.now());
    },
    async publicView(token: string) {
      return deps.withLock(async store => publicView(await lookup(store, token), deps.now()));
    },
    async respond(token: string, action: { action: string; slotId?: string }) {
      const transition = await deps.withLock(async store => {
        const record = await lookup(store, token);
        if (record.status === "CONFIRMED" && action.action === "confirm" && record.selectedSlotId === action.slotId) return { record, notify: false };
        if (state(record, deps.now()) !== "PENDING") throw inactive();
        if (action.action === "reject") return { record: await store.update(record.id, { status: "REJECTED" }), notify: true };
        const slot = record.slots.find(slot => slot.id === action.slotId);
        if (action.action !== "confirm" || !slot || new Date(slot.startsAt) <= deps.now()) throw new AppointmentError("Horario no disponible.", 409);
        return { record: await store.update(record.id, { status: "CONFIRMED", selectedSlotId: slot.id, confirmationEmailFailed: true }), notify: true };
      });
      let record = transition.record;
      if (transition.notify) {
        if (record.status === "CONFIRMED") record = await notifyConfirmation(record);
        else await deliver("rejection", record);
      }
      return publicView(record, deps.now());
    },
  };
}
