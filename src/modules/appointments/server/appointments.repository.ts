import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma, type AppointmentInvitation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encryptInvitationToken, decryptInvitationToken } from "@/modules/users/server/invitation-token-cipher";
import { createAppointmentService, type AppointmentRecord, type AppointmentStore } from "../appointments.domain";
import type { AppointmentSlotView } from "../appointments.contract";
import { deliverAppointmentMail, deliverAppointmentVisitMail } from "./appointments.mail";
import { createGoogleAppointmentService } from "../appointments.google.domain";
import { getAppointmentGoogleConnection, appointmentGoogleEventId, createAppointmentGoogleEvent, getAppointmentGoogleEvent, cancelAppointmentGoogleEvent } from "./appointments.google";

function record(row: AppointmentInvitation): AppointmentRecord {
  return { ...row, status: row.status as AppointmentRecord["status"], mode: row.mode as AppointmentRecord["mode"], slots: row.slots as unknown as AppointmentSlotView[] };
}
function store(tx: Prisma.TransactionClient): AppointmentStore {
  return {
    listActive: async () => {
      const now = new Date();
      return (await tx.appointmentInvitation.findMany({ where: { OR: [
        { status: { in: ["SENDING", "PENDING"] }, expiresAt: { gt: now } },
        { status: "CONFIRMED", lastEndsAt: { gt: now } },
      ] } })).map(record);
    },
    latest: async admissionId => { const row = await tx.appointmentInvitation.findFirst({ where: { admissionId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }); return row ? record(row) : null; },
    find: async id => { const row = await tx.appointmentInvitation.findUnique({ where: { id } }); return row ? record(row) : null; },
    byHash: async tokenHash => { const row = await tx.appointmentInvitation.findUnique({ where: { tokenHash } }); return row ? record(row) : null; },
    insert: async input => {
      // Explicit allow-list: never persist public-input properties outside the record contract.
      const { id, admissionId, recipientName, recipientEmail, initiatorId, initiatorEmail, tokenHash, tokenCipher, status, expiresAt, sentAt, durationMinutes, mode, location, message, selectedSlotId, confirmationEmailFailed, resendCount, createdAt, slots, googleAccountId, googleCalendarId, googleEventId, googleEventUrl, googleRsvpStatus, googleSyncPending, googleCancelPending, googleOperationVersion } = input;
      return record(await tx.appointmentInvitation.create({ data: { id, admissionId, recipientName, recipientEmail, initiatorId, initiatorEmail, tokenHash, tokenCipher, status, expiresAt, sentAt, durationMinutes, mode, location, message, selectedSlotId, confirmationEmailFailed, resendCount, createdAt, googleAccountId, googleCalendarId, googleEventId, googleEventUrl, googleRsvpStatus, googleSyncPending, googleCancelPending, googleOperationVersion, slots: slots as unknown as Prisma.InputJsonValue, lastEndsAt: new Date(slots.reduce((last, slot) => slot.endsAt > last ? slot.endsAt : last, "")) } }));
    },
    update: async (id, patch) => {
      const { status, expiresAt, sentAt, selectedSlotId, confirmationEmailFailed, resendCount, googleEventUrl, googleRsvpStatus, googleSyncPending, googleCancelPending, googleOperationVersion } = patch;
      return record(await tx.appointmentInvitation.update({ where: { id }, data: { status, expiresAt, sentAt, selectedSlotId, confirmationEmailFailed, resendCount, googleEventUrl, googleRsvpStatus, googleSyncPending, googleCancelPending, googleOperationVersion } }));
    },
  };
}
const dependencies = {
  // One transaction-scoped lock for the single admission-interview agenda, across all processes.
  // READ COMMITTED ensures reads AFTER acquiring the lock see the previous holder's committed changes.
  withLock: <T>(action: (store: AppointmentStore) => Promise<T>): Promise<T> => prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(721462019::bigint)`;
    return action(store(tx));
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5000, timeout: 10000 }),
  now: () => new Date(), id: randomUUID,
  token: () => randomBytes(32).toString("base64url"),
  hash: (token: string) => createHash("sha256").update(token).digest("hex"),
  seal: encryptInvitationToken, unseal: decryptInvitationToken,
  deliver: deliverAppointmentMail,
};
export const legacyAppointments = createAppointmentService(dependencies);
export const appointments = createGoogleAppointmentService({
  ...dependencies, legacy: legacyAppointments, deliverVisit: deliverAppointmentVisitMail,
  google: { connection: getAppointmentGoogleConnection, eventId: appointmentGoogleEventId, create: createAppointmentGoogleEvent, get: getAppointmentGoogleEvent, cancel: cancelAppointmentGoogleEvent },
});
