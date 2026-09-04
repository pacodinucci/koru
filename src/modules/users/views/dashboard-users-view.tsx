import { InvitationStatus, UserRole } from "@prisma/client";
import { SaveIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { isAdminRole } from "@/modules/auth/roles";

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

function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    ADMIN: "Admin",
    ADMIN_TEACHER: "Admin docente",
    SUPERADMIN: "Superadmin",
    TEACHER: "Docente",
    PARENT: "Familia",
  };

  return labels[role];
}

function invitationStatusLabel(status: InvitationStatus) {
  const labels: Record<InvitationStatus, string> = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    REVOKED: "Revocada",
  };

  return labels[status];
}

function invitationStatusVariant(status: InvitationStatus) {
  if (status === InvitationStatus.PENDING) {
    return "secondary" as const;
  }

  if (status === InvitationStatus.ACCEPTED) {
    return "default" as const;
  }

  return "outline" as const;
}

type DashboardUsersViewProps = {
  currentAdminId: string;
};

export async function DashboardUsersView({
  currentAdminId,
}: DashboardUsersViewProps) {
  const [users, invitations, families] = await Promise.all([
    listUsersForAdmin(),
    listUserInvitationsForAdmin(),
    listFamiliesForInvitationAdmin(),
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Autorizar nuevo email</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserInvitationForm families={families} />
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Usuarios creados</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[32%]">Usuario</TableHead>
                <TableHead className="w-[20%]">Rol y alta</TableHead>
                <TableHead className="w-[36%]">Actualizar rol</TableHead>
                <TableHead className="w-[12%] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Todavia no hay usuarios creados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="min-w-0 font-medium">{user.name || "-"}</div>
                      <div className="mt-1 break-all text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isAdminRole(user.role) ? "default" : "secondary"}>
                        {roleLabel(user.role)}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <form
                        action={updateUserRoleAction}
                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="h-8 min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500"
                        >
                          {Object.values(UserRole).map((role) => (
                            <option key={role} value={role}>
                              {roleLabel(role)}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="submit"
                          variant="outline"
                          size="icon-sm"
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
                        disabled={user.id === currentAdminId}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">Emails autorizados</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">Invitación</TableHead>
                <TableHead className="w-[20%]">Rol y estado</TableHead>
                <TableHead className="w-[27%]">Fechas</TableHead>
                <TableHead className="w-[15%]">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Todavia no hay emails autorizados.
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="break-all font-medium">{invitation.email}</div>
                      <div className="mt-1 break-all text-xs text-muted-foreground">
                        Invitó: {invitation.invitedBy?.email ?? "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{roleLabel(invitation.role)}</div>
                      {invitation.family ? <div className="mt-1 text-xs text-muted-foreground">Familia: {invitation.family.name}</div> : null}
                      <Badge className="mt-1" variant={invitationStatusVariant(invitation.status)}>
                        {invitationStatusLabel(invitation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>Creada: {formatDate(invitation.createdAt)}</div>
                      <div className="mt-1 text-muted-foreground">
                        Vence: {formatDate(invitation.expiresAt)}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Aceptada: {formatDate(invitation.acceptedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invitation.status === InvitationStatus.PENDING ? (
                        <div className="flex gap-2">
                          <form action={resendUserInvitationAction}><input type="hidden" name="id" value={invitation.id} /><Button type="submit" variant="outline" className="h-8 max-w-full px-2 text-xs">Reenviar</Button></form>
                          <form action={revokeUserInvitationAction}><input type="hidden" name="id" value={invitation.id} /><Button type="submit" variant="outline" className="h-8 max-w-full px-2 text-xs">Revocar</Button></form>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
