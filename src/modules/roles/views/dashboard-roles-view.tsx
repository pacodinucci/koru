import { UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { permissionCatalog } from "@/modules/auth/permissions/permission-catalog";
import {
  createRoleAction,
  deleteRoleAction,
  updateRoleAction,
} from "@/modules/roles/server/role.actions";

type RoleItem = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  baseRole: UserRole;
  isProtected: boolean;
  isActive: boolean;
  permissions: Array<{ permission: { key: string } }>;
  _count: { users: number; invitations: number };
};

const groupedPermissions = permissionCatalog.reduce<
  Record<string, (typeof permissionCatalog)[number][]>
>((groups, permission) => {
  (groups[permission.section] ??= []).push(permission);
  return groups;
}, {});

function PermissionFields({
  selected,
  editable,
}: {
  selected: Set<string>;
  editable: Set<string>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Object.entries(groupedPermissions).map(([section, permissions]) => (
        <fieldset key={section} className="rounded-xl border border-slate-200 p-3">
          <legend className="px-1 text-sm font-semibold">{section}</legend>
          <div className="space-y-2">
            {permissions.map((permission) => {
              const checked = selected.has(permission.key);
              const canEdit = editable.has(permission.key);
              return (
                <label key={permission.key} className="flex items-start gap-2 text-sm">
                  {checked && !canEdit ? (
                    <input type="hidden" name="permissions" value={permission.key} />
                  ) : null}
                  <input
                    type="checkbox"
                    name="permissions"
                    value={permission.key}
                    defaultChecked={checked}
                    disabled={!canEdit}
                    className="mt-1"
                  />
                  <span>{permission.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function BaseRoleSelect({
  value,
  disabled = false,
  allowSuperAdmin,
}: {
  value: UserRole;
  disabled?: boolean;
  allowSuperAdmin: boolean;
}) {
  const roles = Object.values(UserRole).filter(
    (role) => allowSuperAdmin || role !== UserRole.SUPERADMIN || value === UserRole.SUPERADMIN,
  );
  return (
    <select
      name="baseRole"
      defaultValue={value}
      disabled={disabled}
      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100"
    >
      {roles.map((role) => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
  );
}

export function DashboardRolesView({
  roles,
  canManage,
  actorPermissions,
  currentRoleKey,
}: {
  roles: RoleItem[];
  canManage: boolean;
  actorPermissions: string[];
  currentRoleKey: string | null;
}) {
  const editablePermissions = new Set(canManage ? actorPermissions : []);
  const isSuperAdmin = currentRoleKey === "SUPERADMIN";

  return (
    <div className="space-y-4">
      {canManage ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Crear rol</CardTitle></CardHeader>
          <CardContent>
            <form action={createRoleAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <input name="name" required minLength={2} placeholder="Nombre del rol" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
                <input name="description" placeholder="Descripción" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
                <BaseRoleSelect value={UserRole.ADMIN} allowSuperAdmin={isSuperAdmin} />
              </div>
              <PermissionFields selected={new Set()} editable={editablePermissions} />
              <Button type="submit">Crear rol</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Tenés acceso de lectura. La modificación de roles requiere el permiso Gestionar roles.
        </p>
      )}

      {roles.map((role) => {
        const selected = new Set(role.permissions.map(({ permission }) => permission.key));
        const assigned = role._count.users + role._count.invitations;
        const canManageRole = canManage && (role.key !== "SUPERADMIN" || isSuperAdmin);
        const roleEditablePermissions = new Set(canManageRole ? actorPermissions : []);

        return (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                <span>{role.name} {role.isProtected ? "· Sistema" : ""}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {role._count.users} usuarios · {role._count.invitations} invitaciones
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form action={updateRoleAction} className="space-y-4">
                <input type="hidden" name="id" value={role.id} />
                {role.isProtected ? <input type="hidden" name="name" value={role.name} /> : null}
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    name="name"
                    defaultValue={role.name}
                    disabled={role.isProtected || !canManageRole}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
                  />
                  <input
                    name="description"
                    defaultValue={role.description ?? ""}
                    disabled={!canManageRole}
                    placeholder="Descripción"
                    className="h-9 rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
                  />
                  <BaseRoleSelect
                    value={role.baseRole}
                    disabled={role.isProtected || !canManageRole}
                    allowSuperAdmin={isSuperAdmin}
                  />
                </div>
                {role.isProtected ? <input type="hidden" name="baseRole" value={role.baseRole} /> : null}
                <PermissionFields selected={selected} editable={roleEditablePermissions} />
                <div className="flex flex-wrap items-center gap-3">
                  {canManageRole && !role.isProtected ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="isActive" defaultChecked={role.isActive} />
                      Rol activo
                    </label>
                  ) : null}
                  {canManageRole ? <Button type="submit">Guardar permisos</Button> : null}
                </div>
              </form>
              {canManageRole && !role.isProtected ? (
                <form action={deleteRoleAction}>
                  <input type="hidden" name="id" value={role.id} />
                  <Button type="submit" variant="outline" disabled={assigned > 0}>Eliminar rol</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
