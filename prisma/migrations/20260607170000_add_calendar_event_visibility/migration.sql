CREATE TYPE "CalendarEventVisibility" AS ENUM ('PUBLIC', 'MEMBERS');

ALTER TABLE "CalendarEvent"
ADD COLUMN "visibility" "CalendarEventVisibility" NOT NULL DEFAULT 'MEMBERS';

CREATE INDEX "CalendarEvent_status_visibility_startsAt_idx"
ON "CalendarEvent"("status", "visibility", "startsAt");
