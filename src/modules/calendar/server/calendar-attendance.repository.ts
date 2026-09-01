import "server-only";

import { CalendarAttendanceStatus, CalendarEventStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listUnsentCalendarEventAttendances(eventId: string) {
  return prisma.calendarEventAttendance.findMany({
    where: {
      eventId,
      invitationSentAt: null,
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

export async function markCalendarInvitationFailed(attendanceId: string, error: string) {
  return prisma.calendarEventAttendance.update({
    where: { id: attendanceId },
    data: { invitationError: error },
  });
}

export async function getCalendarAttendanceForUser(eventId: string, userId: string) {
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

  const result = await prisma.calendarEventAttendance.updateMany({
    where: {
      eventId,
      userId,
      event: {
        status: CalendarEventStatus.PUBLISHED,
        attendanceConfirmationEnabled: true,
      },
    },
    data: { status, respondedAt: new Date() },
  });

  if (result.count === 0) throw new Error("attendance_not_found");
}