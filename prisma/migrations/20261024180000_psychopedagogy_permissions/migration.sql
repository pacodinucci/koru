BEGIN;

INSERT INTO "Permission" ("id", "key", "section", "action", "label", "updatedAt")
VALUES
  ('permission_psychopedagogy_view', 'psychopedagogy.view', 'Psicopedagogía', 'view', 'Ver', CURRENT_TIMESTAMP),
  ('permission_psychopedagogy_manage', 'psychopedagogy.manage', 'Psicopedagogía', 'manage', 'Gestionar', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- Preserve only roles that previously had effective psychopedagogy access.
-- Custom roles based on other roles must be explicitly granted these permissions.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r CROSS JOIN "Permission" p
WHERE p."key" IN ('psychopedagogy.view', 'psychopedagogy.manage')
  AND (r."baseRole" = 'SUPERADMIN'
    OR (r."baseRole" = 'PSYCHOPEDAGOGY_TEACHER' AND EXISTS (
      SELECT 1 FROM "RolePermission" rp
      JOIN "Permission" existing ON existing."id" = rp."permissionId"
      WHERE rp."roleId" = r."id" AND existing."key" = 'dashboard.access'
    )))
ON CONFLICT DO NOTHING;

COMMIT;
