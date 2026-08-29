import {
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventVisibility,
  CalendarRegistrationAccess,
  UserRole,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getAudienceRoles,
  getAudienceTypesForViewer,
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
};

export async function listCalendarEventsForAdmin() {
  return prisma.calendarEvent.findMany({
    orderBy: [{ startsAt: "asc" }],
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      audiences: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      attendances: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          invitationSentAt: true,
          invitationError: true,
        },
      },
    },
  });
}

export async function listCalendarEventsForAdminByRange(
  dateCursor: Date,
  viewMode: CalendarViewMode,
) {
  const { start, end } = getRangeForView(dateCursor, viewMode);

  return prisma.calendarEvent.findMany({
    where: {
      startsAt: { lt: end },
      endsAt: { gte: start },
    },
    orderBy: [{ startsAt: "asc" }],
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      audiences: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      attendances: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          invitationSentAt: true,
          invitationError: true,
        },
      },
    },
  });
}

export async function listUpcomingCalendarEventsForAdmin(limit = 6) {
  return prisma.calendarEvent.findMany({
    where: {
      startsAt: {
        gte: new Date(),
      },
    },
    orderBy: [{ startsAt: "asc" }],
    take: limit,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      audiences: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      attendances: {
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          invitationSentAt: true,
          invitationError: true,
        },
      },
    },
  });
}

export async function listAudienceUsers() {
  return prisma.user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function saveCalendarEvent(input: SaveCalendarEventInput) {
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
          title: input.title,
          description: input.description || null,
          imageUrl: input.imageUrl || null,
          imagePublicId: input.imagePublicId || null,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
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
        title: input.title,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        imagePublicId: input.imagePublicId || null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
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
  return prisma.calendarEvent.update({
    where: { id: eventId },
    data: { status: CalendarEventStatus.CANCELED },
  });
}

export async function listVisibleEventsForUser(userId: string, role: UserRole) {
  return prisma.calendarEvent.findMany({
    where: getVisibleEventsWhere(userId, role),
    orderBy: [{ startsAt: "asc" }],
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
      ...getVisibleEventsWhere(userId, role),
      startsAt: { lt: end },
      endsAt: { gte: start },
    },
    orderBy: [{ startsAt: "asc" }],
  });
}

export async function listUpcomingVisibleEventsForUser(
  userId: string,
  role: UserRole,
  limit = 6,
) {
  return prisma.calendarEvent.findMany({
    where: {
      ...getVisibleEventsWhere(userId, role),
      startsAt: {
        gte: new Date(),
      },
    },
    orderBy: [{ startsAt: "asc" }],
    take: limit,
  });
}

function getVisibleEventsWhere(userId: string, role: UserRole) {
  return {
    status: CalendarEventStatus.PUBLISHED,
    OR: [
      { audienceType: { in: getAudienceTypesForViewer(role) } },
      {
        audienceType: CalendarAudienceType.PRIVATE,
        audiences: { some: { userId } },
      },
    ],
  };
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
  const visibilityWhere = viewer
    ? getVisibleEventsWhere(viewer.id, viewer.role)
    : {
        status: CalendarEventStatus.PUBLISHED,
        visibility: CalendarEventVisibility.PUBLIC,
        audienceType: CalendarAudienceType.ALL,
      };

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
  const visibilityWhere = viewer
    ? getVisibleEventsWhere(viewer.id, viewer.role)
    : {
        status: CalendarEventStatus.PUBLISHED,
        visibility: CalendarEventVisibility.PUBLIC,
        audienceType: CalendarAudienceType.ALL,
      };

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
      location: true,
      visibility: true,
      registrationsEnabled: true,
      attendanceConfirmationEnabled: true,
      attendances: {
        where: { userId: viewer?.id ?? "__anonymous__" },
        select: { id: true, status: true },
        take: 1,
      },
    },
  });
}
export async function getCalendarEventAttendanceForAdmin(eventId: string) {
  return prisma.calendarEvent.findUnique({
    where: { id: eventId },
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
