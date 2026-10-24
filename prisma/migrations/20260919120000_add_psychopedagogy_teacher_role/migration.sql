-- Commit the enum extension before using its value (PostgreSQL enum safety).
BEGIN;
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PSYCHOPEDAGOGY_TEACHER';
COMMIT;

BEGIN;
INSERT INTO "Role" ("id", "key", "name", "description", "baseRole", "isSystem", "isProtected", "isActive", "updatedAt")
VALUES ('role_psychopedagogy_teacher', 'PSYCHOPEDAGOGY_TEACHER', 'Docente psicopedagógico',
  'Seguimiento psicopedagógico global y lectura de expedientes de alumnos',
  'PSYCHOPEDAGOGY_TEACHER', true, true, true, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id" FROM "Role" r CROSS JOIN "Permission" p
WHERE r."key" = 'PSYCHOPEDAGOGY_TEACHER'
  AND p."key" IN ('dashboard.access', 'students.view')
ON CONFLICT DO NOTHING;

-- Preserve explicit dynamic assignments; only fill missing role references.
UPDATE "user" SET "accessRoleId" = r."id"
FROM "Role" r
WHERE r."key" = 'PSYCHOPEDAGOGY_TEACHER'
  AND "user"."role"::text = r."key" AND "user"."accessRoleId" IS NULL;

UPDATE "UserInvitation" SET "accessRoleId" = r."id"
FROM "Role" r
WHERE r."key" = 'PSYCHOPEDAGOGY_TEACHER'
  AND "UserInvitation"."role"::text = r."key" AND "UserInvitation"."accessRoleId" IS NULL;
COMMIT;
