import {
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventVisibility,
  CalendarRegistrationAccess,
  UserRole,
  type Prisma,
} from "@prisma/client";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { getCalendarReadWhere, getCalendarEditWhere, assertCalendarEventEditable } from "@/modules/calendar/server/calendar-access";
import { isInternalCalendarRole } from "@/modules/calendar/lib/calendar-access";
import { prisma } from "@/lib/prisma";
import {
  getAudienceRoles,
} from "@/modules/calendar/lib/calendar-audience";
import { getRangeForView, type CalendarViewMode } from "@/modules/dashboard/lib/calendar-range";

type SaveCalendarEventInput = {
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
  allDay: boolean;
  location?: string;
  status: CalendarEventStatus;
  visibility: CalendarEventVisibility;
  audienceType: CalendarAudienceType;
  kind: "EVENT" | "MEETING";
  registrationsEnabled: boolean;
  attendanceConfirmationEnabled: boolean;
  registrationAccess: CalendarRegistrationAccess;
  createdById: string;
  privateAudienceUserIds: string[];
  accessScope?: "LEGACY" | "INTERNAL" | "AREAS" | "PEOPLE";
  responsibleAreaId?: string | null;
  involvedAreaIds?: string[];
  audienceAreaIds?: string[];
};

export async function listCalendarEventsForAdmin() {
  const where = await managementReadWhere();
  return prisma.calendarEvent.findMany({
    where,
    orderBy: [{ startsAt: "asc" }],
    include: {
      areaLinks: { include: { area: true } },
      audienceAreas: true,
      createdBy: { select: { id: true, name: true, email: true } },
      audiences: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      attendances: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          status: true,
          invitationSentAt: true,
          invitationError: true,
          respondedAt: true,
        },
      },
    },
  }).then(sanitizeManagementEvents);
}

export async function listCalendarEventsForAdminByRange(
  dateCursor: Date,
  viewMode: CalendarViewMode,
) {
  const { start, end } = getRangeForView(dateCursor, viewMode);
  const where = await managementReadWhere();

  return prisma.calendarEvent.findMany({
    where: {
      ...where,
      status: { not: CalendarEventStatus.CANCELED },
      startsAt: { lt: end },
      endsAt: { gte: start },
    },
    orderBy: [{ startsAt: "asc" }],
    include: {
      areaLinks: { include: { area: true } },
      audienceAreas: true,
      createdBy: { select: { id: true, name: true, email: true } },
      audiences: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      attendances: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          status: true,
          invitationSentAt: true,
          invitationError: true,
          respondedAt: true,
        },
      },
    },
  }).then(sanitizeManagementEvents);
}

export async function listUpcomingCalendarEventsForAdmin(limit = 6) {
  const where = await managementReadWhere();
  return prisma.calendarEvent.findMany({
    where: {
      ...where,
      status: { not: CalendarEventStatus.CANCELED },
      startsAt: {
        gte: new Date(),
      },
    },
    orderBy: [{ startsAt: "asc" }],
    take: limit,
    include: {
      areaLinks: { include: { area: true } },
      audienceAreas: true,
      createdBy: { select: { id: true, name: true, email: true } },
      audiences: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      attendances: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          status: true,
          invitationSentAt: true,
          invitationError: true,
          respondedAt: true,
        },
      },
    },
  }).then(sanitizeManagementEvents);
}

export async function listAudienceUsers() {
  return prisma.user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, role: true },
  });
}

export async function saveCalendarEvent(input: SaveCalendarEventInput) {
  const actor = await getAuthenticatedUser();
  if (!actor || actor.id !== input.createdById) throw new Error("event_forbidden");
  if (input.id) await assertCalendarEventEditable(input.id, actor);
  const accessScope = input.accessScope ?? "LEGACY";
  if (accessScope === "LEGACY" && !actor.permissionKeys.includes("calendar.manage")) throw new Error("event_forbidden");
  const involvedAreaIds = [...new Set(input.involvedAreaIds ?? [])];
  const audienceAreaIds = [...new Set(input.audienceAreaIds ?? [])];
  if (accessScope !== "LEGACY") {
    if (!isInternalCalendarRole(actor.role) || !input.responsibleAreaId || !involvedAreaIds.includes(input.responsibleAreaId)) throw new Error("invalid_event_areas");
    if (input.visibility !== "MEMBERS") throw new Error("institutional_event_members_only");
    if (accessScope === "AREAS" && audienceAreaIds.length === 0) throw new Error("missing_audience_areas");
    if (accessScope === "PEOPLE" && !input.privateAudienceUserIds.includes(actor.id)) throw new Error("organizer_must_be_authorized");
    const areaIds = [...new Set([...involvedAreaIds, ...audienceAreaIds, input.responsibleAreaId])];
    if (await prisma.calendarArea.count({ where: { id: { in: areaIds } } }) !== areaIds.length) throw new Error("invalid_event_areas");
    const grants = await prisma.calendarAreaGrant.findMany({ where: { userId: actor.id } });
    if (!actor.permissionKeys.includes("calendar.manage") && !grants.some(g => g.areaId === input.responsibleAreaId && g.canEdit)) throw new Error("event_forbidden");
    if (accessScope === "AREAS" && !grants.some(g => audienceAreaIds.includes(g.areaId))) throw new Error("organizer_must_be_authorized");
    // Keep existing notification/snapshot machinery safe by materializing the current authorized audience.
    const people = await prisma.user.findMany({ where: accessScope === "PEOPLE"
      ? { id: { in: input.privateAudienceUserIds } }
      : { role: { not: "PARENT" }, ...(accessScope === "AREAS" ? { calendarAreaGrants: { some: { areaId: { in: audienceAreaIds } } } } : {}) }, select: { id: true, role: true } });
    if (accessScope === "PEOPLE" && people.length !== new Set(input.privateAudienceUserIds).size) throw new Error("invalid_private_audience_user");
    input.privateAudienceUserIds = people.filter(p => accessScope === "PEOPLE" || isInternalCalendarRole(p.role)).map(p => p.id);
    input.audienceType = CalendarAudienceType.PRIVATE;
  }
  const areaData = {
    accessScope,
    responsibleAreaId: input.responsibleAreaId || null,
  };

  const uniquePrivateAudienceUserIds = Array.from(
    new Set(input.privateAudienceUserIds),
  );

  if (input.endsAt < input.startsAt) throw new Error("invalid_event_range");

  if (
    input.audienceType === CalendarAudienceType.PRIVATE &&
    uniquePrivateAudienceUserIds.length === 0
  ) {
    throw new Error("missing_private_audience");
  }

  if (input.audienceType === CalendarAudienceType.PRIVATE) {
    const existingUsers = await prisma.user.count({
      where: { id: { in: uniquePrivateAudienceUserIds } },
    });
    if (existingUsers !== uniquePrivateAudienceUserIds.length) {
      throw new Error("invalid_private_audience_user");
    }
  }

  return prisma.$transaction(async (tx) => {
    if (input.id) {
      const previous = await tx.calendarEvent.findUnique({
        where: { id: input.id },
        select: { attendanceConfirmationEnabled: true },
      });
      if (!previous) throw new Error("event_not_found");

      const event = await tx.calendarEvent.update({
        where: { id: input.id },
        data: {
          ...areaData,
          areaLinks: { deleteMany: {}, create: involvedAreaIds.map(areaId => ({ areaId })) },
          audienceAreas: { deleteMany: {}, create: (accessScope === "AREAS" ? audienceAreaIds : []).map(areaId => ({ areaId })) },
          title: input.title,
          description: input.description || null,
          imageUrl: input.imageUrl || null,
          imagePublicId: input.imagePublicId || null,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          timeZone: input.timeZone,
          allDay: input.allDay,
          location: input.location || null,
          status: input.status,
          visibility: input.visibility,
          audienceType: input.audienceType,
          kind: input.kind,
          registrationsEnabled: input.registrationsEnabled,
          attendanceConfirmationEnabled: input.attendanceConfirmationEnabled,
          registrationAccess:
            input.visibility === CalendarEventVisibility.PUBLIC
              ? CalendarRegistrationAccess.PUBLIC
              : CalendarRegistrationAccess.MEMBERS,
          audiences: {
            deleteMany: {},
            create:
              input.audienceType === CalendarAudienceType.PRIVATE
                ? uniquePrivateAudienceUserIds.map((userId) => ({ userId }))
                : [],
          },
        },
      });

      if (input.imageUrl) {
        await tx.mediaAsset.updateMany({ where: { url: input.imageUrl, purpose: "CALENDAR", calendarEventId: null }, data: { calendarEventId: event.id, attachedAt: new Date() } });
      }

      if (!previous.attendanceConfirmationEnabled && input.attendanceConfirmationEnabled) {
        await createAttendanceSnapshot(tx, {
          eventId: event.id,
          createdById: input.createdById,
          audienceType: input.audienceType,
          privateAudienceUserIds: uniquePrivateAudienceUserIds,
        });
      }

      return event;
    }

    const event = await tx.calendarEvent.create({
      data: {
        ...areaData,
        areaLinks: { create: involvedAreaIds.map(areaId => ({ areaId })) },
        audienceAreas: { create: (accessScope === "AREAS" ? audienceAreaIds : []).map(areaId => ({ areaId })) },
        title: input.title,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        imagePublicId: input.imagePublicId || null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timeZone: input.timeZone,
        allDay: input.allDay,
        location: input.location || null,
        status: input.status,
        visibility: input.visibility,
        audienceType: input.audienceType,
        kind: input.kind,
        registrationsEnabled: input.registrationsEnabled,
        attendanceConfirmationEnabled: input.attendanceConfirmationEnabled,
        registrationAccess:
          input.visibility === CalendarEventVisibility.PUBLIC
            ? CalendarRegistrationAccess.PUBLIC
            : CalendarRegistrationAccess.MEMBERS,
        createdById: input.createdById,
        audiences: {
          create:
            input.audienceType === CalendarAudienceType.PRIVATE
              ? uniquePrivateAudienceUserIds.map((userId) => ({ userId }))
              : [],
        },
      },
    });

    if (input.imageUrl) {
      await tx.mediaAsset.updateMany({ where: { url: input.imageUrl, purpose: "CALENDAR", calendarEventId: null }, data: { calendarEventId: event.id, attachedAt: new Date() } });
    }

    if (input.attendanceConfirmationEnabled) {
      await createAttendanceSnapshot(tx, {
        eventId: event.id,
        createdById: input.createdById,
        audienceType: input.audienceType,
        privateAudienceUserIds: uniquePrivateAudienceUserIds,
      });
    }

    return event;
  });
}

async function createAttendanceSnapshot(
  tx: Prisma.TransactionClient,
  {
    eventId,
    createdById,
    audienceType,
    privateAudienceUserIds,
  }: {
    eventId: string;
    createdById: string;
    audienceType: CalendarAudienceType;
    privateAudienceUserIds: string[];
  },
) {
  const roles = getAudienceRoles(audienceType);
  const users = await tx.user.findMany({
    where: {
      id: audienceType === CalendarAudienceType.PRIVATE
        ? { in: privateAudienceUserIds }
        : { not: createdById },
      ...(roles ? { role: { in: roles } } : {}),
    },
    select: { id: true, name: true, email: true },
  });

  if (users.length === 0) return;

  await tx.calendarEventAttendance.createMany({
    data: users.map((user) => ({
      eventId,
      userId: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
    })),
    skipDuplicates: true,
  });
}

export async function cancelCalendarEvent(eventId: string) {
  const actor = await getAuthenticatedUser();
  if (!actor) throw new Error("event_forbidden");
  await assertCalendarEventEditable(eventId, actor);
  return prisma.calendarEvent.update({
    where: { id: eventId },
    data: { status: CalendarEventStatus.CANCELED },
  });
}

export async function listVisibleEventsForUser(userId: string, role: UserRole) {
  return prisma.calendarEvent.findMany({
    where: await getCalendarReadWhere({ id: userId, role }),
    orderBy: [{ startsAt: "asc" }],
    select: getVisibleEventSelect(userId),
  });
}

export async function listVisibleEventsForUserByRange(
  userId: string,
  role: UserRole,
  dateCursor: Date,
  viewMode: CalendarViewMode,
) {
  const { start, end } = getRangeForView(dateCursor, viewMode);

  return prisma.calendarEvent.findMany({
    where: {
      ...await getCalendarReadWhere({ id: userId, role }),
      startsAt: { lt: end },
      endsAt: { gte: start },
    },
    orderBy: [{ startsAt: "asc" }],
    select: getVisibleEventSelect(userId),
  });
}

export async function listUpcomingVisibleEventsForUser(
  userId: string,
  role: UserRole,
  limit = 6,
) {
  return prisma.calendarEvent.findMany({
    where: {
      ...await getCalendarReadWhere({ id: userId, role }),
      startsAt: {
        gte: new Date(),
      },
    },
    orderBy: [{ startsAt: "asc" }],
    take: limit,
    select: getVisibleEventSelect(userId),
  });
}

function getVisibleEventSelect(userId: string) {
  return {
    id: true,
    title: true,
    description: true,
    imageUrl: true,
    startsAt: true,
    endsAt: true,
    timeZone: true,
    allDay: true,
    location: true,
    visibility: true,
    audienceType: true,
    status: true,
    kind: true,
    registrationsEnabled: true,
    attendanceConfirmationEnabled: true,
    attendances: {
      where: { userId },
      select: { id: true, name: true, email: true, status: true },
      take: 1,
    },
  } satisfies Prisma.CalendarEventSelect;
}
export async function listPublicCalendarEventsByRange({
  viewer,
  start,
  end,
}: {
  viewer?: { id: string; role: UserRole };
  start: Date;
  end: Date;
}) {
  const visibilityWhere = await getCalendarReadWhere(viewer);

  return prisma.calendarEvent.findMany({
    where: {
      ...visibilityWhere,
      startsAt: { lt: end },
      endsAt: { gte: start },
    },
    orderBy: [{ startsAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      startsAt: true,
      endsAt: true,
      timeZone: true,
      location: true,
      visibility: true,
      registrationsEnabled: true,
      registrationAccess: true,
    },
  });
}

export async function listUpcomingPublicCalendarEvents({
  viewer,
  limit = 4,
}: {
  viewer?: { id: string; role: UserRole };
  limit?: number;
} = {}) {
  const visibilityWhere = await getCalendarReadWhere(viewer);

  return prisma.calendarEvent.findMany({
    where: {
      ...visibilityWhere,
      startsAt: { gte: new Date() },
    },
    orderBy: [{ startsAt: "asc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      startsAt: true,
      endsAt: true,
      timeZone: true,
      location: true,
      visibility: true,
      registrationsEnabled: true,
      attendanceConfirmationEnabled: true,
      attendances: {
        where: { userId: viewer?.id ?? "__anonymous__" },
        select: { id: true, name: true, email: true, status: true },
        take: 1,
      },
    },
  });
}
export async function getCalendarEventAttendanceForAdmin(eventId: string) {
  const actor = await getAuthenticatedUser();
  if (!actor) return null;
  return prisma.calendarEvent.findFirst({
    where: { id: eventId, ...await getCalendarEditWhere(actor) },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      location: true,
      kind: true,
      registrationsEnabled: true,
      attendanceConfirmationEnabled: true,
      attendances: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          invitationSentAt: true,
          invitationError: true,
          respondedAt: true,
        },
      },
      registrations: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },
    },
  });
}

async function managementReadWhere(): Promise<Prisma.CalendarEventWhereInput> {
  const actor = await getAuthenticatedUser();
  if (!actor) return { id: { in: [] } };
  return { OR: [await getCalendarReadWhere(actor), await getCalendarEditWhere(actor)] };
}

async function sanitizeManagementEvents<T extends { id: string; audiences: Array<{ userId: string }>; attendances: Array<{ id: string; userId: string | null; name: string; email: string; status: "PENDING" | "CONFIRMED" | "DECLINED"; invitationSentAt: Date | null; invitationError: string | null; respondedAt: Date | null }> }>(events: T[]) {
  const actor = await getAuthenticatedUser();
  const editable = actor ? await prisma.calendarEvent.findMany({ where: { id: { in: events.map(e => e.id) }, ...await getCalendarEditWhere(actor) }, select: { id: true } }) : [];
  const ids = new Set(editable.map(e => e.id));
  return events.map(event => ({ ...event, canEdit: ids.has(event.id), audiences: ids.has(event.id) ? event.audiences : [], attendances: ids.has(event.id) ? event.attendances : [] }));
}
