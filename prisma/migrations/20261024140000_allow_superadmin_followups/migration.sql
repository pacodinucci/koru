BEGIN;

-- Preserve existing teacher authors; Superadmin records reference the actual user.
ALTER TABLE "PsychopedagogyEntry"
  ALTER COLUMN "teacherId" DROP NOT NULL,
  ADD COLUMN "authorUserId" TEXT,
  ADD CONSTRAINT "PsychopedagogyEntry_author_check"
    CHECK ("teacherId" IS NOT NULL OR "authorUserId" IS NOT NULL);

ALTER TABLE "PsychopedagogyAccompaniment"
  ALTER COLUMN "teacherId" DROP NOT NULL,
  ADD COLUMN "authorUserId" TEXT,
  ADD CONSTRAINT "PsychopedagogyAccompaniment_author_check"
    CHECK ("teacherId" IS NOT NULL OR "authorUserId" IS NOT NULL);

CREATE INDEX "PsychopedagogyEntry_authorUserId_idx" ON "PsychopedagogyEntry"("authorUserId");
CREATE INDEX "PsychopedagogyAccompaniment_authorUserId_idx" ON "PsychopedagogyAccompaniment"("authorUserId");

ALTER TABLE "PsychopedagogyEntry" ADD CONSTRAINT "PsychopedagogyEntry_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyAccompaniment" ADD CONSTRAINT "PsychopedagogyAccompaniment_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
