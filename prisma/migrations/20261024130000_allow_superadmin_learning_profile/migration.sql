BEGIN;

ALTER TABLE "PsychopedagogyLearningProfile"
  ALTER COLUMN "updatedById" DROP NOT NULL,
  ADD COLUMN "updatedByUserId" TEXT;

ALTER TABLE "PsychopedagogyLearningProfile"
  ADD CONSTRAINT "PsychopedagogyLearningProfile_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PsychopedagogyLearningProfile"
  ADD CONSTRAINT "PsychopedagogyLearningProfile_editor_check"
  CHECK ("updatedById" IS NOT NULL OR "updatedByUserId" IS NOT NULL);

CREATE INDEX "PsychopedagogyLearningProfile_updatedByUserId_idx"
  ON "PsychopedagogyLearningProfile"("updatedByUserId");

COMMIT;
