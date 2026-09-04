-- Assign only students whose linked parent users all belong to one same family.
-- Students without a clear family remain untouched for administrative review.
WITH resolved_family AS (
  SELECT
    guardian."studentId",
    MIN(parent."familyId") AS "familyId"
  FROM "StudentGuardian" AS guardian
  INNER JOIN "user" AS parent ON parent.id = guardian."userId"
  WHERE parent."familyId" IS NOT NULL
  GROUP BY guardian."studentId"
  HAVING COUNT(DISTINCT parent."familyId") = 1
)
UPDATE "Student" AS student
SET "familyId" = resolved_family."familyId"
FROM resolved_family
WHERE student.id = resolved_family."studentId"
  AND student."familyId" IS NULL;