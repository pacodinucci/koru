-- Add Contactos to the existing dynamic role catalog. No contact payloads are touched.
INSERT INTO "Permission" ("id", "key", "section", "action", "label", "updatedAt") VALUES
('perm_contacts_view', 'contacts.view', 'Contactos', 'view', 'Ver', CURRENT_TIMESTAMP),
('perm_contacts_manage', 'contacts.manage', 'Contactos', 'manage', 'Gestionar', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET "section" = EXCLUDED."section", "action" = EXCLUDED."action", "label" = EXCLUDED."label", "updatedAt" = CURRENT_TIMESTAMP;

-- Preserve custom-role choices: initial grants apply only to the two system roles.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role."isSystem" = true
  AND role."key" IN ('ADMIN', 'SUPERADMIN')
  AND permission."key" IN ('contacts.view', 'contacts.manage')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
