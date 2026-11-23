BEGIN;

-- Leave historical instruments unclassified and preserve their teacher authors.
CREATE TYPE "PsychopedagogyInstrumentKind" AS ENUM ('QUESTIONNAIRE', 'ASSESSMENT', 'INTERVIEW', 'TEST', 'OTHER');

ALTER TABLE "PsychopedagogyInstrument"
  ADD COLUMN "kind" "PsychopedagogyInstrumentKind",
  ALTER COLUMN "teacherId" DROP NOT NULL,
  ADD COLUMN "authorUserId" TEXT,
  ADD CONSTRAINT "PsychopedagogyInstrument_author_check"
    CHECK ("teacherId" IS NOT NULL OR "authorUserId" IS NOT NULL);

CREATE INDEX "PsychopedagogyInstrument_authorUserId_idx" ON "PsychopedagogyInstrument"("authorUserId");

ALTER TABLE "PsychopedagogyInstrument" ADD CONSTRAINT "PsychopedagogyInstrument_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
