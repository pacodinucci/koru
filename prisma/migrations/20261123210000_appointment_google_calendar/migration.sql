-- Native appointment event binding; existing emailed invitations remain unchanged.
ALTER TABLE "AppointmentInvitation"
  ADD COLUMN "googleAccountId" TEXT,
  ADD COLUMN "googleCalendarId" TEXT,
  ADD COLUMN "googleEventId" TEXT,
  ADD COLUMN "googleEventUrl" TEXT,
  ADD COLUMN "googleRsvpStatus" TEXT,
  ADD COLUMN "googleSyncPending" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "googleCancelPending" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "googleOperationVersion" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "AppointmentInvitation_googleEventId_key" ON "AppointmentInvitation"("googleEventId");
