import type { UserRole } from "@prisma/client";

export const permissionCatalog = [
  { key: "dashboard.access", section: "Dashboard", label: "Acceder al dashboard" },
  { key: "blog.view", section: "Blog", label: "Ver" },
  { key: "blog.manage", section: "Blog", label: "Gestionar" },
  { key: "content.view", section: "Contenido y diseño", label: "Ver" },
  { key: "content.manage", section: "Contenido y diseño", label: "Gestionar" },
  { key: "calendar.view", section: "Calendario", label: "Ver" },
  { key: "calendar.manage", section: "Calendario", label: "Gestionar" },
  { key: "cash-fund.view", section: "Caja chica", label: "Ver" },
  { key: "cash-fund.operate", section: "Caja chica", label: "Operar" },
  { key: "cash-fund.configure", section: "Caja chica", label: "Configurar" },
  { key: "inventory.view", section: "Inventario", label: "Ver" },
  { key: "inventory.operate", section: "Inventario", label: "Operar" },
  { key: "inventory.configure", section: "Inventario", label: "Configurar" },
  { key: "documents.view", section: "Documentos", label: "Ver" },
  { key: "documents.manage", section: "Documentos", label: "Gestionar" },
  { key: "families.view", section: "Familias", label: "Ver" },
  { key: "families.manage", section: "Familias", label: "Gestionar" },
  { key: "families.payments", section: "Familias", label: "Gestionar pagos" },
  { key: "families.waive-balance", section: "Familias", label: "Condonar saldos" },
  { key: "students.view", section: "Alumnos", label: "Ver" },
  { key: "students.manage", section: "Alumnos", label: "Gestionar" },
  { key: "teachers.view", section: "Docentes", label: "Ver" },
  { key: "teachers.manage", section: "Docentes", label: "Gestionar" },
  { key: "exams.view", section: "Notas", label: "Ver" },
  { key: "exams.manage", section: "Notas", label: "Gestionar" },
  { key: "users.view", section: "Usuarios", label: "Ver" },
  { key: "users.manage", section: "Usuarios", label: "Gestionar" },
  { key: "mailing.view", section: "Mailing", label: "Ver" },
  { key: "mailing.send", section: "Mailing", label: "Enviar" },
  { key: "roles.view", section: "Roles", label: "Ver" },
  { key: "roles.manage", section: "Roles", label: "Gestionar" },
] as const;

export type PermissionKey = (typeof permissionCatalog)[number]["key"];

const allPermissions = permissionCatalog.map(({ key }) => key);
const adminPermissions = allPermissions.filter(
  (key) =>
    !["cash-fund.configure", "inventory.configure", "families.waive-balance", "roles.manage"].includes(key),
);

export const legacyRolePermissions: Record<UserRole, readonly PermissionKey[]> = {
  SUPERADMIN: allPermissions,
  ADMIN: adminPermissions,
  ADMIN_OPERATOR: [
    "dashboard.access",
    "cash-fund.view",
    "cash-fund.operate",
    "inventory.view",
    "inventory.operate",
    "families.view",
    "families.payments",
  ],
  ADMIN_TEACHER: [
    "dashboard.access",
    "calendar.view",
    "cash-fund.view",
    "inventory.view",
    "students.view",
    "exams.view",
    "exams.manage",
  ],
  TEACHER: [
    "dashboard.access",
    "calendar.view",
    "cash-fund.view",
    "inventory.view",
    "students.view",
    "exams.view",
    "exams.manage",
  ],
  PARENT: [],
};

export function hasPermission(
  permissions: readonly string[],
  permission: PermissionKey,
) {
  return permissions.includes(permission);
}

