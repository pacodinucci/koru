import {
  CalendarAudienceType,
  CalendarEventStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type SaveCalendarEventInput = {
  id?: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  location?: string;
  status: CalendarEventStatus;
  audienceType: CalendarAudienceType;
  kind: "EVENT" | "MEETING";
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

  if (input.endsAt < input.startsAt) {
    throw new Error("invalid_event_range");
  }

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

  if (input.id) {
    return prisma.calendarEvent.update({
      where: { id: input.id },
      data: {
        title: input.title,
        description: input.description || null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        allDay: input.allDay,
        location: input.location || null,
        status: input.status,
        audienceType: input.audienceType,
        kind: input.kind,
        audiences: {
          deleteMany: {},
          create:
            input.audienceType === CalendarAudienceType.PRIVATE
              ? uniquePrivateAudienceUserIds.map((userId) => ({ userId }))
              : [],
        },
      },
    });
  }

  return prisma.calendarEvent.create({
    data: {
      title: input.title,
      description: input.description || null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      allDay: input.allDay,
      location: input.location || null,
      status: input.status,
      audienceType: input.audienceType,
      kind: input.kind,
      createdById: input.createdById,
      audiences: {
        create:
          input.audienceType === CalendarAudienceType.PRIVATE
            ? uniquePrivateAudienceUserIds.map((userId) => ({ userId }))
            : [],
      },
    },
  });
}

export async function cancelCalendarEvent(eventId: string) {
  return prisma.calendarEvent.update({
    where: { id: eventId },
    data: { status: CalendarEventStatus.CANCELED },
  });
}

export async function listVisibleEventsForUser(userId: string, role: UserRole) {
  const audienceByRole: Record<UserRole, CalendarAudienceType> = {
    ADMIN: CalendarAudienceType.ALL,
    PARENT: CalendarAudienceType.PARENTS,
    TEACHER: CalendarAudienceType.TEACHERS,
  };

  const audience = audienceByRole[role];

  return prisma.calendarEvent.findMany({
    where: {
      status: CalendarEventStatus.PUBLISHED,
      OR: [
        { audienceType: CalendarAudienceType.ALL },
        { audienceType: audience },
        {
          audienceType: CalendarAudienceType.PRIVATE,
          audiences: { some: { userId } },
        },
      ],
    },
    orderBy: [{ startsAt: "asc" }],
  });
}
