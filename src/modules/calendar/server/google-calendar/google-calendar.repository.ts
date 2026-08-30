import "server-only";

import { GoogleCalendarConnectionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { GOOGLE_CALENDAR_SCOPE } from "@/modules/calendar/server/google-calendar/google-calendar-event";

function hasCalendarScope(scope: string | null) {
  return scope?.split(/[ ,]+/).includes(GOOGLE_CALENDAR_SCOPE) ?? false;
}

export async function getGoogleCalendarConnectionForUser(userId: string) {
  return prisma.googleCalendarConnection.findUnique({
    where: { userId },
    select: {
      id: true,
      accountId: true,
      calendarId: true,
      status: true,
      syncConfirmedEvents: true,
      lastError: true,
      connectedAt: true,
      account: {
        select: { scope: true },
      },
    },
  });
}

export async function getGoogleCalendarConnectionState(userId: string) {
  const connection = await getGoogleCalendarConnectionForUser(userId);
  if (!connection) return { status: "NOT_CONNECTED" as const };

  return {
    status: connection.status,
    syncConfirmedEvents: connection.syncConfirmedEvents,
    hasRequiredScope: hasCalendarScope(connection.account.scope),
    lastError: connection.lastError,
  };
}

export async function activateGoogleCalendarConnection(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "google" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, scope: true },
  });

  if (!account || !hasCalendarScope(account.scope)) {
    throw new Error("google_calendar_scope_missing");
  }

  return prisma.googleCalendarConnection.upsert({
    where: { userId },
    create: {
      userId,
      accountId: account.id,
      status: GoogleCalendarConnectionStatus.ACTIVE,
    },
    update: {
      accountId: account.id,
      status: GoogleCalendarConnectionStatus.ACTIVE,
      syncConfirmedEvents: true,
      lastError: null,
      connectedAt: new Date(),
    },
  });
}

export async function disableGoogleCalendarConnection(userId: string) {
  return prisma.googleCalendarConnection.updateMany({
    where: { userId },
    data: {
      status: GoogleCalendarConnectionStatus.DISABLED,
      syncConfirmedEvents: false,
      lastError: null,
    },
  });
}

export async function markGoogleCalendarConnectionNeedsReauth(
  connectionId: string,
  error: string,
) {
  return prisma.googleCalendarConnection.update({
    where: { id: connectionId },
    data: {
      status: GoogleCalendarConnectionStatus.NEEDS_REAUTH,
      lastError: error.slice(0, 500),
    },
  });
}
