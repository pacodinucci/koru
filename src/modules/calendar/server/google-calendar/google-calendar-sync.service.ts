import "server-only";

import {
  CalendarAttendanceStatus,
  CalendarEventStatus,
  GoogleCalendarConnectionStatus,
  GoogleCalendarSyncStatus,
} from "@prisma/client";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { buildGoogleCalendarEventPayload } from "@/modules/calendar/server/google-calendar/google-calendar-event";
import { markGoogleCalendarConnectionNeedsReauth } from "@/modules/calendar/server/google-calendar/google-calendar.repository";

class GoogleCalendarApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function getAccessToken(userId: string) {
  const token = await auth.api.getAccessToken({
    body: {
      providerId: "google",
      userId,
    },
  });
  return token.accessToken;
}

async function googleCalendarRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit,
): Promise<T | null> {
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (response.status === 404) {
    throw new GoogleCalendarApiError("google_event_not_found", 404);
  }

  if (!response.ok) {
    const details = await response.text();
    throw new GoogleCalendarApiError(
      `google_calendar_${response.status}:${details.slice(0, 300)}`,
      response.status,
    );
  }

  if (response.status === 204) return null;
  return response.json() as Promise<T>;
}

async function recordSyncFailure(
  connectionId: string,
  eventId: string,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : "google_calendar_unknown";
  await prisma.googleCalendarEventSync.upsert({
    where: { connectionId_eventId: { connectionId, eventId } },
    create: {
      connectionId,
      eventId,
      status: GoogleCalendarSyncStatus.FAILED,
      lastError: message.slice(0, 500),
    },
    update: {
      status: GoogleCalendarSyncStatus.FAILED,
      lastError: message.slice(0, 500),
    },
  });

  if (
    error instanceof GoogleCalendarApiError &&
    (error.status === 401 || error.message.includes("insufficientPermissions"))
  ) {
    await markGoogleCalendarConnectionNeedsReauth(connectionId, message);
  }
}

async function removeGoogleEvent(
  connection: {
    id: string;
    userId: string;
    accountId: string;
    calendarId: string;
  },
  eventId: string,
) {
  const sync = await prisma.googleCalendarEventSync.findUnique({
    where: {
      connectionId_eventId: {
        connectionId: connection.id,
        eventId,
      },
    },
  });

  if (!sync?.googleEventId || sync.status === GoogleCalendarSyncStatus.REMOVED) {
    return;
  }

  try {
    const accessToken = await getAccessToken(connection.userId);
    const path = `/calendars/${encodeURIComponent(connection.calendarId)}/events/${encodeURIComponent(sync.googleEventId)}`;
    await googleCalendarRequest(accessToken, path, { method: "DELETE" });
    await prisma.googleCalendarEventSync.update({
      where: { id: sync.id },
      data: {
        status: GoogleCalendarSyncStatus.REMOVED,
        lastError: null,
        lastSyncedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof GoogleCalendarApiError && error.status === 404) {
      await prisma.googleCalendarEventSync.update({
        where: { id: sync.id },
        data: {
          status: GoogleCalendarSyncStatus.REMOVED,
          lastError: null,
          lastSyncedAt: new Date(),
        },
      });
      return;
    }
    await recordSyncFailure(connection.id, eventId, error);
  }
}

export async function syncConfirmedAttendanceToGoogle(
  userId: string,
  eventId: string,
) {
  const connection = await prisma.googleCalendarConnection.findFirst({
    where: {
      userId,
      status: GoogleCalendarConnectionStatus.ACTIVE,
      syncConfirmedEvents: true,
    },
    select: {
      id: true,
      userId: true,
      accountId: true,
      calendarId: true,
    },
  });
  if (!connection) return;

  const event = await prisma.calendarEvent.findFirst({
    where: {
      id: eventId,
      status: CalendarEventStatus.PUBLISHED,
      attendanceConfirmationEnabled: true,
      attendances: {
        some: {
          userId,
          status: CalendarAttendanceStatus.CONFIRMED,
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      location: true,
    },
  });

  if (!event) {
    await removeGoogleEvent(connection, eventId);
    return;
  }

  const sync = await prisma.googleCalendarEventSync.upsert({
    where: {
      connectionId_eventId: {
        connectionId: connection.id,
        eventId,
      },
    },
    create: {
      connectionId: connection.id,
      eventId,
      status: GoogleCalendarSyncStatus.PENDING,
    },
    update: {
      status: GoogleCalendarSyncStatus.PENDING,
      lastError: null,
    },
  });

  try {
    const accessToken = await getAccessToken(userId);
    const payload = buildGoogleCalendarEventPayload(
      event,
      env.APP_URL ?? env.BETTER_AUTH_URL,
    );
    const calendarPath = `/calendars/${encodeURIComponent(connection.calendarId)}/events`;

    let googleEventId = sync.googleEventId;
    if (googleEventId) {
      try {
        await googleCalendarRequest(
          accessToken,
          `${calendarPath}/${encodeURIComponent(googleEventId)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
      } catch (error) {
        if (!(error instanceof GoogleCalendarApiError) || error.status !== 404) {
          throw error;
        }
        googleEventId = null;
      }
    }

    if (!googleEventId) {
      const created = await googleCalendarRequest<{ id: string }>(
        accessToken,
        calendarPath,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      if (!created?.id) throw new Error("google_calendar_missing_event_id");
      googleEventId = created.id;
    }

    await prisma.googleCalendarEventSync.update({
      where: { id: sync.id },
      data: {
        googleEventId,
        status: GoogleCalendarSyncStatus.SYNCED,
        lastError: null,
        lastSyncedAt: new Date(),
      },
    });
  } catch (error) {
    await recordSyncFailure(connection.id, eventId, error);
  }
}

export async function removeAttendanceFromGoogle(
  userId: string,
  eventId: string,
) {
  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      accountId: true,
      calendarId: true,
    },
  });
  if (!connection) return;
  await removeGoogleEvent(connection, eventId);
}

export async function syncEventForConfirmedUsers(eventId: string) {
  const attendances = await prisma.calendarEventAttendance.findMany({
    where: {
      eventId,
      status: CalendarAttendanceStatus.CONFIRMED,
      userId: { not: null },
    },
    select: { userId: true },
  });

  await Promise.allSettled(
    attendances
      .map((attendance) => attendance.userId)
      .filter((userId): userId is string => Boolean(userId))
      .map((userId) => syncConfirmedAttendanceToGoogle(userId, eventId)),
  );
}

export async function removeEventFromGoogleCalendars(eventId: string) {
  const syncs = await prisma.googleCalendarEventSync.findMany({
    where: {
      eventId,
      googleEventId: { not: null },
      status: { not: GoogleCalendarSyncStatus.REMOVED },
    },
    select: {
      connection: {
        select: {
          id: true,
          userId: true,
          accountId: true,
          calendarId: true,
        },
      },
    },
  });

  await Promise.allSettled(
    syncs.map(({ connection }) => removeGoogleEvent(connection, eventId)),
  );
}

export async function syncUpcomingConfirmedEventsForUser(userId: string) {
  const attendances = await prisma.calendarEventAttendance.findMany({
    where: {
      userId,
      status: CalendarAttendanceStatus.CONFIRMED,
      event: {
        status: CalendarEventStatus.PUBLISHED,
        endsAt: { gte: new Date() },
      },
    },
    select: { eventId: true },
  });

  for (const attendance of attendances) {
    await syncConfirmedAttendanceToGoogle(userId, attendance.eventId);
  }
}

export async function removeAllGoogleEventsForUser(userId: string) {
  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      accountId: true,
      calendarId: true,
      eventSyncs: {
        where: {
          googleEventId: { not: null },
          status: { not: GoogleCalendarSyncStatus.REMOVED },
        },
        select: { eventId: true },
      },
    },
  });

  if (!connection) return;

  for (const sync of connection.eventSyncs) {
    await removeGoogleEvent(connection, sync.eventId);
  }
}
