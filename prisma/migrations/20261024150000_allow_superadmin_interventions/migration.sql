BEGIN;

-- Preserve existing teacher authors; Superadmin records reference the actual user.
ALTER TABLE "PsychopedagogyIntervention"
  ALTER COLUMN "teacherId" DROP NOT NULL,
  ADD COLUMN "authorUserId" TEXT,
  ADD CONSTRAINT "PsychopedagogyIntervention_author_check"
    CHECK ("teacherId" IS NOT NULL OR "authorUserId" IS NOT NULL);

CREATE INDEX "PsychopedagogyIntervention_authorUserId_idx" ON "PsychopedagogyIntervention"("authorUserId");

ALTER TABLE "PsychopedagogyIntervention" ADD CONSTRAINT "PsychopedagogyIntervention_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
