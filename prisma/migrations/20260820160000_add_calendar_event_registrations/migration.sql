CREATE TYPE "CalendarRegistrationAccess" AS ENUM ('PUBLIC', 'MEMBERS');

ALTER TABLE "CalendarEvent"
ADD COLUMN "registrationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "registrationAccess" "CalendarRegistrationAccess" NOT NULL DEFAULT 'PUBLIC';

CREATE TABLE "CalendarEventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarEventRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalendarEventRegistration_eventId_userId_key" ON "CalendarEventRegistration"("eventId", "userId");
CREATE UNIQUE INDEX "CalendarEventRegistration_eventId_email_key" ON "CalendarEventRegistration"("eventId", "email");
CREATE INDEX "CalendarEventRegistration_eventId_createdAt_idx" ON "CalendarEventRegistration"("eventId", "createdAt");
CREATE INDEX "CalendarEventRegistration_userId_idx" ON "CalendarEventRegistration"("userId");

ALTER TABLE "CalendarEventRegistration" ADD CONSTRAINT "CalendarEventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventRegistration" ADD CONSTRAINT "CalendarEventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
