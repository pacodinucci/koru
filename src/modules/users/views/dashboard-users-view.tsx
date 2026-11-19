import { InvitationStatus } from "@prisma/client";
import { SaveIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSearchableTable } from "@/modules/dashboard/components/dashboard-searchable-table";
import {

  listFamiliesForInvitationAdmin,
  listUserInvitationsForAdmin,
  listUsersForAdmin,
  resendUserInvitationAction,
  revokeUserInvitationAction,
  updateUserRoleAction,
} from "@/modules/users/server/user-invitations.actions";
import { CreateUserInvitationForm } from "@/modules/users/components/create-user-invitation-form";
import { UserDeleteButton } from "@/modules/users/components/user-delete-button";
import { listAssignableRoles } from "@/modules/roles/server/role.repository";

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function invitationStatusLabel(status: InvitationStatus) {
  const labels: Record<InvitationStatus, string> = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    REVOKED: "Revocada",
  };

  return labels[status];
}

const invitationStatusVariants: Record<InvitationStatus, "warning" | "success" | "muted"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REVOKED: "muted",
};

function invitationStatusVariant(status: InvitationStatus) {
  return invitationStatusVariants[status];
}

type DashboardUsersViewProps = {
  currentAdminId: string;
  canManage: boolean;
  actorPermissions: string[];
  currentRoleKey: string | null;
};

export async function DashboardUsersView({
  currentAdminId,
  canManage,
  actorPermissions,
  currentRoleKey,
}: DashboardUsersViewProps) {
  const [users, invitations, families, availableRoles] = await Promise.all([
    listUsersForAdmin(),
    listUserInvitationsForAdmin(),
    listFamiliesForInvitationAdmin(),
    listAssignableRoles(),
  ]);
  const actorPermissionSet = new Set(actorPermissions);
  const roles = currentRoleKey === "SUPERADMIN"
    ? availableRoles
    : availableRoles.filter(
        (role) =>
          role.baseRole !== "SUPERADMIN" &&
          role.permissions.every(({ permission }) => actorPermissionSet.has(permission.key)),
      );

  const userRows = users.map((user) => {
    const roleLabel = user.accessRole?.name ?? user.role;
    const createdAt = formatDate(user.createdAt);
    return {
      id: user.id,
      // Only values the row already renders may feed the live search.
      searchText: [user.name || "-", user.email, roleLabel, createdAt].join(" "),
      content: (
        <TableRow key={user.id}>
          <TableCell>
            <div className="min-w-0 font-medium">{user.name || "-"}</div>
            <div className="mt-1 break-all text-xs text-muted-foreground">
              {user.email}
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={user.accessRole?.baseRole === "SUPERADMIN" ? "special" : "info"}>
              {roleLabel}
            </Badge>
            <div className="mt-1 text-xs text-muted-foreground">
              {createdAt}
            </div>
          </TableCell>
          <TableCell>
            <form
              action={updateUserRoleAction}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
            >
              <input type="hidden" name="userId" value={user.id} />
              <select
                name="accessRoleId"
                defaultValue={user.accessRoleId ?? ""}
                className="h-8 min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                variant="outline"
                size="icon-sm"
                disabled={!canManage}
                aria-label={`Guardar rol de ${user.email}`}
              >
                <SaveIcon className="h-4 w-4" />
              </Button>
            </form>
          </TableCell>
          <TableCell className="text-center">
            <UserDeleteButton
              userId={user.id}
              userEmail={user.email}
              disabled={!canManage || user.id === currentAdminId}
            />
          </TableCell>
        </TableRow>
      ),
    };
  });

  const invitationRows = invitations.map((invitation) => {
    const roleLabel = invitation.accessRole?.name ?? invitation.role;
    const statusLabel = invitationStatusLabel(invitation.status);
    const createdAt = formatDate(invitation.createdAt);
    const expiresAt = formatDate(invitation.expiresAt);
    const acceptedAt = formatDate(invitation.acceptedAt);
    const invitedBy = invitation.invitedBy?.email ?? "-";
    const familyLabel = invitation.family ? `Familia: ${invitation.family.name}` : "";
    return {
      id: invitation.id,
      searchText: [
        invitation.email,
        `Invitó: ${invitedBy}`,
        roleLabel,
        familyLabel,
        statusLabel,
        `Creada: ${createdAt}`,
        `Vence: ${expiresAt}`,
        `Aceptada: ${acceptedAt}`,
      ].join(" "),
      content: (
        <TableRow key={invitation.id}>
          <TableCell>
            <div className="break-all font-medium">{invitation.email}</div>
            <div className="mt-1 break-all text-xs text-muted-foreground">
              Invitó: {invitedBy}
            </div>
          </TableCell>
          <TableCell>
            <div>{roleLabel}</div>
            {invitation.family ? <div className="mt-1 text-xs text-muted-foreground">Familia: {invitation.family.name}</div> : null}
            <Badge className="mt-1" variant={invitationStatusVariant(invitation.status)}>
              {statusLabel}
            </Badge>
          </TableCell>
          <TableCell className="text-xs">
            <div>Creada: {createdAt}</div>
            <div className="mt-1 text-muted-foreground">
              Vence: {expiresAt}
            </div>
            <div className="mt-1 text-muted-foreground">
              Aceptada: {acceptedAt}
            </div>
          </TableCell>
          <TableCell>
            {canManage && invitation.status === InvitationStatus.PENDING ? (
              <div className="flex gap-2">
                <form action={resendUserInvitationAction}><input type="hidden" name="id" value={invitation.id} /><Button type="submit" variant="outline" className="h-8 max-w-full px-2 text-xs">Reenviar</Button></form>
                <form action={revokeUserInvitationAction}><input type="hidden" name="id" value={invitation.id} /><Button type="submit" variant="outline" className="h-8 max-w-full px-2 text-xs">Revocar</Button></form>
              </div>
            ) : (
              "-"
            )}
          </TableCell>
        </TableRow>
      ),
    };
  });

  return (
    <div className="min-w-0 space-y-6">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Autorizar nuevo email</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateUserInvitationForm families={families} roles={roles} />
          </CardContent>
        </Card>
      ) : null}

      <section aria-labelledby="users-list-heading" className="min-w-0 space-y-2">
        <h2 id="users-list-heading" className="text-base font-semibold">
          Usuarios creados
        </h2>
        <DashboardSearchableTable
          searchId="users-search"
          searchPlaceholder="Buscar por nombre o email"
          header={
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Usuario</TableHead>
                <TableHead className="w-[20%]">Rol y alta</TableHead>
                <TableHead className="w-[36%]">Actualizar rol</TableHead>
                <TableHead className="w-[12%] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
          }
          rows={userRows}
          columnCount={4}
          emptyMessage="Todavia no hay usuarios creados."
          tableClassName="min-w-[720px]"
        />
      </section>

      <section aria-labelledby="users-invitations-heading" className="min-w-0 space-y-2">
        <h2 id="users-invitations-heading" className="text-base font-semibold">
          Emails autorizados
        </h2>
        <DashboardSearchableTable
          searchId="users-invitations-search"
          searchPlaceholder="Buscar por email o rol"
          header={
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">Invitación</TableHead>
                <TableHead className="w-[20%]">Rol y estado</TableHead>
                <TableHead className="w-[27%]">Fechas</TableHead>
                <TableHead className="w-[15%]">Acción</TableHead>
              </TableRow>
            </TableHeader>
          }
          rows={invitationRows}
          columnCount={4}
          emptyMessage="Todavia no hay emails autorizados."
          tableClassName="min-w-[720px]"
        />
      </section>
    </div>
  );
}
