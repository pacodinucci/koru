import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";
import { getExternalCalendarEventAttendance } from "@/modules/calendar/server/calendar-attendance.repository";

function signature(attendance: { id: string; eventId: string; email: string }) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`calendar-external-invitation-v1:${attendance.id}:${attendance.eventId}:${attendance.email.toLowerCase()}`)
    .digest("base64url");
}

export function createExternalCalendarInvitationToken(attendance: { id: string; eventId: string; email: string }) {
  return `${attendance.id}.${signature(attendance)}`;
}

export async function getExternalCalendarInvitationByToken(token: string) {
  const separator = token.indexOf(".");
  if (separator < 1 || separator === token.length - 1 || token.length > 256) return null;

  const attendance = await getExternalCalendarEventAttendance(token.slice(0, separator));
  if (!attendance) return null;

  const actual = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(signature(attendance));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  return attendance;
}
