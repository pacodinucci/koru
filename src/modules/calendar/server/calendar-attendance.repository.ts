import "server-only";

import {
  CalendarAttendanceStatus,
  CalendarAudienceType,
  CalendarEventStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAudienceTypesForViewer } from "@/modules/calendar/lib/calendar-audience";

export async function createManualCalendarEventAttendance({
  eventId,
  name,
  email,
}: {
  eventId: string;
  name: string;
  email: string;
}) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, status: CalendarEventStatus.PUBLISHED, attendanceConfirmationEnabled: true },
    select: { id: true },
  });
  if (!event) throw new Error("event_not_available");

  try {
    return await prisma.calendarEventAttendance.create({
      data: { eventId, name, email: email.toLowerCase() },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("already_invited");
    }
    throw error;
  }
}

export async function getExternalCalendarEventAttendance(attendanceId: string) {
  return prisma.calendarEventAttendance.findFirst({
    where: {
      id: attendanceId,
      userId: null,
      event: { status: CalendarEventStatus.PUBLISHED, attendanceConfirmationEnabled: true },
    },
    include: {
      event: { select: { id: true, title: true, startsAt: true, endsAt: true, location: true } },
    },
  });
}

export async function respondToExternalCalendarEvent(attendanceId: string, status: CalendarAttendanceStatus) {
  if (status === CalendarAttendanceStatus.PENDING) throw new Error("invalid_attendance_status");
  return prisma.calendarEventAttendance.update({
    where: { id: attendanceId },
    data: { status, respondedAt: new Date() },
  });
}

export async function listUnsentCalendarEventAttendances(eventId: string, attendanceId?: string) {
  return prisma.calendarEventAttendance.findMany({
    where: {
      eventId,
      ...(attendanceId ? { id: attendanceId } : {}),
      invitationSentAt: null,
      status: CalendarAttendanceStatus.PENDING,
      event: {
        status: CalendarEventStatus.PUBLISHED,
        attendanceConfirmationEnabled: true,
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          location: true,
        },
      },
    },
  });
}

export async function markCalendarInvitationSent(attendanceId: string) {
  return prisma.calendarEventAttendance.update({
    where: { id: attendanceId },
    data: { invitationSentAt: new Date(), invitationError: null },
  });
}

export async function markCalendarInvitationFailed(
  attendanceId: string,
  error: string,
) {
  return prisma.calendarEventAttendance.update({
    where: { id: attendanceId },
    data: { invitationError: error },
  });
}

export async function getCalendarAttendanceForUser(
  eventId: string,
  userId: string,
) {
  return prisma.calendarEventAttendance.findFirst({
    where: {
      eventId,
      userId,
    },
    select: { id: true, status: true, respondedAt: true },
  });
}

export async function respondToCalendarEvent({
  eventId,
  userId,
  status,
}: {
  eventId: string;
  userId: string;
  status: CalendarAttendanceStatus;
}) {
  if (status === CalendarAttendanceStatus.PENDING) {
    throw new Error("invalid_attendance_status");
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) throw new Error("attendance_not_found");

    const event = await tx.calendarEvent.findFirst({
      where: {
        id: eventId,
        status: CalendarEventStatus.PUBLISHED,
        attendanceConfirmationEnabled: true,
        createdById: { not: userId },
        OR: [
          { audienceType: { in: getAudienceTypesForViewer(user.role) } },
          {
            audienceType: CalendarAudienceType.PRIVATE,
            audiences: { some: { userId } },
          },
        ],
      },
      select: { id: true },
    });
    if (!event) throw new Error("attendance_not_found");

    const email = user.email.toLowerCase();
    const attendanceForUser = await tx.calendarEventAttendance.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true },
    });
    const attendanceForEmail = attendanceForUser
      ? null
      : await tx.calendarEventAttendance.findUnique({
          where: { eventId_email: { eventId, email } },
          select: { id: true },
        });
    const attendance = attendanceForUser ?? attendanceForEmail;
    const respondedAt = new Date();

    if (attendance) {
      return tx.calendarEventAttendance.update({
        where: { id: attendance.id },
        data: {
          userId,
          name: user.name,
          email,
          status,
          respondedAt,
        },
      });
    }

    return tx.calendarEventAttendance.create({
      data: {
        eventId,
        userId,
        name: user.name,
        email,
        status,
        respondedAt,
      },
    });
  });
}
