CREATE TYPE "CalendarAttendanceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

ALTER TABLE "CalendarEvent"
ADD COLUMN "attendanceConfirmationEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CalendarEventAttendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "CalendarAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "invitationSentAt" TIMESTAMP(3),
    "invitationError" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarEventAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalendarEventAttendance_eventId_userId_key" ON "CalendarEventAttendance"("eventId", "userId");
CREATE UNIQUE INDEX "CalendarEventAttendance_eventId_email_key" ON "CalendarEventAttendance"("eventId", "email");
CREATE INDEX "CalendarEventAttendance_eventId_status_idx" ON "CalendarEventAttendance"("eventId", "status");
CREATE INDEX "CalendarEventAttendance_userId_idx" ON "CalendarEventAttendance"("userId");
CREATE INDEX "CalendarEventAttendance_invitationSentAt_idx" ON "CalendarEventAttendance"("invitationSentAt");

ALTER TABLE "CalendarEventAttendance" ADD CONSTRAINT "CalendarEventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventAttendance" ADD CONSTRAINT "CalendarEventAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;