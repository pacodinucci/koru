import {
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventVisibility,
  CalendarRegistrationAccess,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { after } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { sendPendingCalendarEventInvitations } from "@/modules/calendar/server/calendar-invitation.service";
import { syncEventForConfirmedUsers } from "@/modules/calendar/server/google-calendar/google-calendar-sync.service";
import { saveCalendarEvent } from "@/modules/dashboard/server/calendar.repository";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return getString(formData, key) === "on";
}

function parseDurationMinutes(value: string) {
  const minutes = Number.parseInt(value, 10);
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error("invalid_duration");
  if (minutes > 24 * 60) throw new Error("duration_too_long");
  return minutes;
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("invalid_date");
  return parsed;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user?.permissionKeys.includes("calendar.manage")) {
    return NextResponse.redirect(new URL("/dashboard/calendar?error=forbidden", request.url), 303);
  }

  try {
    const formData = await request.formData();
    const id = getString(formData, "id").trim();
    const title = getString(formData, "title").trim();
    if (!title) throw new Error("missing_title");

    const eventDate = getString(formData, "eventDate").trim();
    const startTime = getString(formData, "startTime").trim();
    const startsAt = combineDateAndTime(eventDate, startTime);
    const durationMinutes = parseDurationMinutes(getString(formData, "durationMinutes").trim());
    const visibilityValue = getString(formData, "visibility");
    const visibility = Object.values(CalendarEventVisibility).includes(visibilityValue as CalendarEventVisibility)
      ? visibilityValue as CalendarEventVisibility
      : CalendarEventVisibility.MEMBERS;
    const audienceValue = getString(formData, "audienceType");
    const audienceType = visibility === CalendarEventVisibility.PUBLIC
      ? CalendarAudienceType.ALL
      : Object.values(CalendarAudienceType).includes(audienceValue as CalendarAudienceType)
        ? audienceValue as CalendarAudienceType
        : CalendarAudienceType.ALL;
    const attendanceConfirmationEnabled = getBoolean(formData, "attendanceConfirmationEnabled");
    const privateAudienceUserIds = visibility === CalendarEventVisibility.PUBLIC
      ? []
      : formData.getAll("privateAudienceUserIds")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);

    const event = await saveCalendarEvent({
      id: id || undefined,
      title,
      description: getString(formData, "description").trim(),
      imageUrl: getString(formData, "imageUrl").trim(),
      imagePublicId: getString(formData, "imagePublicId").trim(),
      startsAt,
      endsAt: new Date(startsAt.getTime() + durationMinutes * 60_000),
      allDay: getBoolean(formData, "allDay"),
      location: getString(formData, "location").trim(),
      status: CalendarEventStatus.PUBLISHED,
      visibility,
      audienceType,
      kind: getString(formData, "kind") === "MEETING" ? "MEETING" : "EVENT",
      registrationsEnabled: getBoolean(formData, "registrationsEnabled"),
      attendanceConfirmationEnabled,
      registrationAccess: visibility === CalendarEventVisibility.PUBLIC
        ? CalendarRegistrationAccess.PUBLIC
        : CalendarRegistrationAccess.MEMBERS,
      privateAudienceUserIds,
      createdById: user.id,
    });

    after(async () => {
      if (attendanceConfirmationEnabled) await sendPendingCalendarEventInvitations(event.id);
      await syncEventForConfirmedUsers(event.id);
    });

    return NextResponse.redirect(
      new URL(`/dashboard/calendar?ok=${attendanceConfirmationEnabled ? "invitation_scheduled" : "saved"}`, request.url),
      303,
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    return NextResponse.redirect(
      new URL(`/dashboard/calendar?error=${encodeURIComponent(code)}`, request.url),
      303,
    );
  }
}