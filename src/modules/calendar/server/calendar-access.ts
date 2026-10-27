import "server-only";

import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAudienceTypesForViewer } from "@/modules/calendar/lib/calendar-audience";
import { isInternalCalendarRole } from "@/modules/calendar/lib/calendar-access";

type Viewer = { id: string; role: string };
type Manager = Viewer & { permissionKeys: readonly string[] };

export async function getCalendarReadWhere(viewer?: Viewer): Promise<Prisma.CalendarEventWhereInput> {
  const legacy: Prisma.CalendarEventWhereInput = viewer
    ? { OR: [
        { audienceType: { in: getAudienceTypesForViewer(viewer.role as UserRole) } },
        { audienceType: "PRIVATE", audiences: { some: { userId: viewer.id } } },
      ] }
    : { visibility: "PUBLIC", audienceType: "ALL" };
  const scopes: Prisma.CalendarEventWhereInput[] = [{ accessScope: "LEGACY", ...legacy }];
  if (viewer) {
    // Explicit recipients never inherit access from area membership or management.
    scopes.push({ accessScope: "PEOPLE", audiences: { some: { userId: viewer.id } } });
    if (isInternalCalendarRole(viewer.role)) {
      const grants = await prisma.calendarAreaGrant.findMany({ where: { userId: viewer.id }, select: { areaId: true } });
      scopes.push({ accessScope: "INTERNAL" });
      scopes.push({ accessScope: "AREAS", audienceAreas: { some: { areaId: { in: grants.map(g => g.areaId) } } } });
    }
  }
  return { status: "PUBLISHED", OR: scopes };
}

export async function getCalendarEditWhere(viewer: Manager): Promise<Prisma.CalendarEventWhereInput> {
  const manager = viewer.permissionKeys.includes("calendar.manage");
  const clauses: Prisma.CalendarEventWhereInput[] = manager ? [{ accessScope: "LEGACY" }] : [];
  if (isInternalCalendarRole(viewer.role)) {
    const grants = await prisma.calendarAreaGrant.findMany({ where: { userId: viewer.id }, select: { areaId: true, canEdit: true } });
    const read = await getCalendarReadWhere(viewer);
    // Draft/canceled records still need their audience restriction checked.
    const { status: _status, ...audience } = read;
    void _status;
    clauses.push({ AND: [
      { accessScope: { in: ["INTERNAL", "AREAS", "PEOPLE"] } },
      audience,
      ...(manager ? [] : [{ responsibleAreaId: { in: grants.filter(g => g.canEdit).map(g => g.areaId) } }]),
    ] });
  }
  return { OR: clauses };
}

export async function assertCalendarEventEditable(eventId: string, viewer: Manager) {
  const event = await prisma.calendarEvent.findFirst({ where: { id: eventId, ...await getCalendarEditWhere(viewer) }, select: { id: true, accessScope: true } });
  if (!event) throw new Error("event_forbidden");
  return event;
}

export async function canUserReadCalendarEvent(eventId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user) return false;
  return Boolean(await prisma.calendarEvent.findFirst({ where: { id: eventId, ...await getCalendarReadWhere(user) }, select: { id: true } }));
}

