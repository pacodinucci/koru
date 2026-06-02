import { InvitationStatus, UserRole } from "@prisma/client";

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
  createUserInvitationAction,
  listUserInvitationsForAdmin,
  listUsersForAdmin,
  revokeUserInvitationAction,
  updateUserRoleAction,
} from "@/modules/users/server/user-invitations.actions";

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

export async function DashboardUsersView() {
  const [users, invitations] = await Promise.all([
    listUsersForAdmin(),
    listUserInvitationsForAdmin(),
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Autorizar nuevo email</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={createUserInvitationAction}
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="familia@ejemplo.com"
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
            />
            <select
              name="role"
              defaultValue={UserRole.PARENT}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
            <Button type="submit" className="h-9">
              Crear invitacion
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuarios creados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Actualizar rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Todavia no hay usuarios creados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === UserRole.ADMIN ? "default" : "secondary"}>
                        {roleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <form
                        action={updateUserRoleAction}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs outline-none focus:border-slate-500"
                        >
                          {Object.values(UserRole).map((role) => (
                            <option key={role} value={role}>
                              {roleLabel(role)}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variant="outline" className="h-8 px-3 text-xs">
                          Guardar
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emails autorizados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Invito</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead>Aceptada</TableHead>
                <TableHead>Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Todavia no hay emails autorizados.
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>{roleLabel(invitation.role)}</TableCell>
                    <TableCell>
                      <Badge variant={invitationStatusVariant(invitation.status)}>
                        {invitationStatusLabel(invitation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invitation.invitedBy?.email ?? "-"}
                    </TableCell>
                    <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                    <TableCell>{formatDate(invitation.acceptedAt)}</TableCell>
                    <TableCell>
                      {invitation.status === InvitationStatus.PENDING ? (
                        <form action={revokeUserInvitationAction}>
                          <input type="hidden" name="id" value={invitation.id} />
                          <Button
                            type="submit"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                          >
                            Revocar
                          </Button>
                        </form>
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
