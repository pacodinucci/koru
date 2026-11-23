-- Additive interview agenda. Existing contact and calendar records are untouched.
CREATE TABLE "AppointmentInvitation" (
  "id" TEXT NOT NULL,
  "admissionId" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "initiatorId" TEXT NOT NULL,
  "initiatorEmail" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "tokenCipher" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "durationMinutes" INTEGER NOT NULL,
  "mode" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "message" TEXT,
  "selectedSlotId" TEXT,
  "confirmationEmailFailed" BOOLEAN NOT NULL DEFAULT false,
  "resendCount" INTEGER NOT NULL DEFAULT 0,
  "slots" JSONB NOT NULL,
  "lastEndsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentInvitation_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "AdmissionInquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AppointmentInvitation_status_check" CHECK ("status" IN ('SENDING','PENDING','CONFIRMED','REJECTED','CANCELLED','EXPIRED','SEND_FAILED')),
  CONSTRAINT "AppointmentInvitation_mode_check" CHECK ("mode" IN ('IN_PERSON','ONLINE')),
  CONSTRAINT "AppointmentInvitation_duration_check" CHECK ("durationMinutes" BETWEEN 5 AND 240),
  CONSTRAINT "AppointmentInvitation_slots_check" CHECK (jsonb_typeof("slots") = 'array' AND jsonb_array_length("slots") BETWEEN 1 AND 3)
);
CREATE UNIQUE INDEX "AppointmentInvitation_tokenHash_key" ON "AppointmentInvitation"("tokenHash");
CREATE INDEX "AppointmentInvitation_admissionId_createdAt_idx" ON "AppointmentInvitation"("admissionId", "createdAt");
CREATE INDEX "AppointmentInvitation_status_lastEndsAt_idx" ON "AppointmentInvitation"("status", "lastEndsAt");
