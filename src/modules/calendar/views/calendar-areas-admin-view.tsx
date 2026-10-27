import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { CalendarAreaAccessManager } from "@/modules/calendar/components/calendar-area-access-manager";
import {
  calendarInternalRoles,
  listCalendarAreas,
} from "@/modules/calendar/server/calendar-areas.repository";

export async function CalendarAreasAdminView() {
  await requirePermission("calendar.permissions.manage");

  const [areas, users] = await Promise.all([
    listCalendarAreas(),
    prisma.user.findMany({
      where: { role: { in: calendarInternalRoles } },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Permisos del calendario</h1>
        <p className="text-sm text-muted-foreground">
          Asigná a cada usuario interno permisos de consulta o de consulta y edición por área.
          Estos permisos se aplican a los eventos actuales y futuros según su audiencia y área responsable.
          Las familias no pueden recibir estos accesos. El ingreso a esta sección se configura desde Roles
          con el permiso «Administrar accesos por área».
        </p>
      </header>
      <CalendarAreaAccessManager areas={areas} users={users} />
    </div>
  );
}
