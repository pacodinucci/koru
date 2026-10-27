-- Separate area-access administration from event management.
INSERT INTO "Permission" ("id", "key", "section", "action", "label", "updatedAt")
VALUES (
  'perm_calendar_permissions_manage',
  'calendar.permissions.manage',
  'calendar',
  'permissions.manage',
  'Administrar accesos por área del calendario',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;

-- Match the default system-role catalog without granting access to custom roles.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."key" IN ('SUPERADMIN', 'ADMIN')
  AND r."isSystem" = true
  AND p."key" = 'calendar.permissions.manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
