-- Remove teacher profiles that were created manually before teachers became User role extensions.
-- These profiles have no linked User and are no longer valid in the current domain model.
DELETE FROM "StudentTeacher"
WHERE "teacherId" IN (
  SELECT "id"
  FROM "TeacherProfile"
  WHERE "userId" IS NULL
);

DELETE FROM "TeacherProfile"
WHERE "userId" IS NULL;