-- TeacherProfile is an extension of users with role TEACHER.
-- Create missing profiles for existing teacher users.
INSERT INTO "TeacherProfile" (
  "id",
  "userId",
  "displayName",
  "email",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('teacher_profile_', u."id"),
  u."id",
  COALESCE(NULLIF(u."name", ''), u."email"),
  u."email",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "user" u
WHERE u."role" = 'TEACHER'
  AND NOT EXISTS (
    SELECT 1 FROM "TeacherProfile" tp WHERE tp."userId" = u."id"
  );

-- Keep linked teacher profiles in sync with their teacher user identity.
UPDATE "TeacherProfile" tp
SET
  "displayName" = COALESCE(NULLIF(u."name", ''), u."email"),
  "email" = u."email",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "user" u
WHERE tp."userId" = u."id"
  AND u."role" = 'TEACHER';

-- If a linked user is no longer TEACHER, keep history but make the profile inactive.
UPDATE "TeacherProfile" tp
SET
  "isActive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "user" u
WHERE tp."userId" = u."id"
  AND u."role" <> 'TEACHER';

-- Existing manually-created orphan profiles remain for history, but are no longer active/selectable.
UPDATE "TeacherProfile"
SET
  "isActive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "userId" IS NULL;
