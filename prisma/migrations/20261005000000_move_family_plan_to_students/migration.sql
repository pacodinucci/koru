BEGIN;

ALTER TABLE "Student" ADD COLUMN "planId" TEXT;

-- Copy legacy assignments while retaining all original family plan data.
UPDATE "Student" AS student
SET "planId" = family."planId"
FROM "Family" AS family
WHERE student."familyId" = family."id" AND family."planId" IS NOT NULL;

CREATE INDEX "Student_planId_idx" ON "Student"("planId");
ALTER TABLE "Student" ADD CONSTRAINT "Student_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
