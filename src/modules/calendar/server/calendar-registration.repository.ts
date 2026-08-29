import {
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventVisibility,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAudienceTypesForViewer } from "@/modules/calendar/lib/calendar-audience";

type Viewer = { id: string; role: UserRole };

function visibleWhere(viewer?: Viewer) {
  if (!viewer) {
    return {
      status: CalendarEventStatus.PUBLISHED,
      visibility: CalendarEventVisibility.PUBLIC,
      audienceType: CalendarAudienceType.ALL,
    };
  }


  return {
    status: CalendarEventStatus.PUBLISHED,
    OR: [
      { audienceType: { in: getAudienceTypesForViewer(viewer.role) } },
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

export async function calendarEventRequiresAuthentication(id: string) {
  const event = await prisma.calendarEvent.findFirst({
    where: {
      id,
      status: CalendarEventStatus.PUBLISHED,
      visibility: CalendarEventVisibility.MEMBERS,
    },
    select: { id: true },
  });

  return Boolean(event);
}