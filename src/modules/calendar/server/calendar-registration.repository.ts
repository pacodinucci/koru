import {
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventVisibility,
  CalendarRegistrationAccess,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type Viewer = { id: string; role: UserRole };

function visibleWhere(viewer?: Viewer) {
  if (!viewer) {
    return {
      status: CalendarEventStatus.PUBLISHED,
      visibility: CalendarEventVisibility.PUBLIC,
      audienceType: CalendarAudienceType.ALL,
    };
  }

  const audienceByRole: Record<UserRole, CalendarAudienceType> = {
    ADMIN: CalendarAudienceType.ALL,
    PARENT: CalendarAudienceType.PARENTS,
    TEACHER: CalendarAudienceType.TEACHERS,
  };

  return {
    status: CalendarEventStatus.PUBLISHED,
    OR: [
      { audienceType: CalendarAudienceType.ALL },
      { audienceType: audienceByRole[viewer.role] },
      { audienceType: CalendarAudienceType.PRIVATE, audiences: { some: { userId: viewer.id } } },
    ],
  };
}

export async function getCalendarEventForViewer(id: string, viewer?: Viewer) {
  return prisma.calendarEvent.findFirst({
    where: { id, ...visibleWhere(viewer) },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      location: true,
      registrationsEnabled: true,
      visibility: true,
    },
  });
}

export async function registerForCalendarEvent({
  eventId,
  viewer,
  name,
  email,
  phone,
}: {
  eventId: string;
  viewer?: Viewer;
  name: string;
  email: string;
  phone: string;
}) {
  const event = await getCalendarEventForViewer(eventId, viewer);
  if (!event) throw new Error("event_not_found");
  if (!event.registrationsEnabled) throw new Error("registrations_disabled");
  if (event.visibility === CalendarEventVisibility.MEMBERS && !viewer) {
    throw new Error("members_only");
  }

  try {
    return await prisma.calendarEventRegistration.create({
      data: { eventId, userId: viewer?.id, name, email: email.toLowerCase(), phone },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new Error("already_registered");
    }
    throw error;
  }
}
