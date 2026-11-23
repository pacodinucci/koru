import type { UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setCalendarAreaGrantAction } from "@/modules/calendar/server/calendar-areas.actions";

type InternalUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AreaWithGrants = {
  id: string;
  name: string;
  color: string;
  grants: Array<{ userId: string; canEdit: boolean }>;
};

export function CalendarAreaAccessManager({
  areas,
  users,
}: {
  areas: AreaWithGrants[];
  users: InternalUser[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Consulta permite ver los eventos dirigidos al área. Consulta y edición permite además
        editar los eventos que esa área tiene a su cargo, siempre que la persona pueda verlos.
        Sin acceso de área elimina esta asignación, pero no otros permisos que ya tenga el usuario.
        Estos accesos no habilitan el ingreso al panel ni permiten ver eventos restringidos a otras personas.
      </p>
      {areas.length === 0 ? (
        <p className="rounded-xl border p-4 text-sm">No hay áreas institucionales disponibles.</p>
      ) : null}
      {areas.map((area) => (
        <Card key={area.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: area.color }}
              />
              {area.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay usuarios internos disponibles.</p>
            ) : null}
            {users.map((user) => {
              const grant = area.grants.find((item) => item.userId === user.id);
              const accessLevel = grant ? (grant.canEdit ? "edit" : "read") : "none";
              const selectId = `area-access-${area.id}-${user.id}`;
              return (
                <form
                  key={`${user.id}-${accessLevel}`}
                  action={setCalendarAreaGrantAction}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <input type="hidden" name="areaId" value={area.id} />
                  <input type="hidden" name="userId" value={user.id} />
                  <label htmlFor={selectId} className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium">{user.name}</span>
                    <span className="break-all text-muted-foreground">{user.email}</span>
                  </label>
                  <select
                    id={selectId}
                    name="accessLevel"
                    defaultValue={accessLevel}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="none">Sin acceso de área</option>
                    <option value="read">Consulta</option>
                    <option value="edit">Consulta y edición</option>
                  </select>
                  <Button type="submit" variant="outline">Guardar acceso</Button>
                </form>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
