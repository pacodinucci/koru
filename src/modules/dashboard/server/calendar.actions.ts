"use server";

import {
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventVisibility,
  CalendarRegistrationAccess,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { sendPendingCalendarEventInvitations } from "@/modules/calendar/server/calendar-invitation.service";
import {
  removeEventFromGoogleCalendars,
  syncEventForConfirmedUsers,
} from "@/modules/calendar/server/google-calendar/google-calendar-sync.service";
import {
  cancelCalendarEvent,
  saveCalendarEvent,
} from "@/modules/dashboard/server/calendar.repository";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return getString(formData, key) === "on";
}

function parseAudience(value: string): CalendarAudienceType {
  return Object.values(CalendarAudienceType).includes(value as CalendarAudienceType)
    ? value as CalendarAudienceType
    : CalendarAudienceType.ALL;
}

function parseVisibility(value: string): CalendarEventVisibility {
  return Object.values(CalendarEventVisibility).includes(value as CalendarEventVisibility)
    ? value as CalendarEventVisibility
    : CalendarEventVisibility.MEMBERS;
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

export async function saveCalendarEventAction(formData: FormData) {
  const user = await requireAdmin("/dashboard/calendar?error=forbidden");
  let savedEventId: string;
  let shouldNotify = false;

  try {
    const id = getString(formData, "id").trim();
    const title = getString(formData, "title").trim();
    if (!title) throw new Error("missing_title");

    const description = getString(formData, "description").trim();
    const imageUrl = getString(formData, "imageUrl").trim();
    const imagePublicId = getString(formData, "imagePublicId").trim();
    const eventDate = getString(formData, "eventDate").trim();
    const startTime = getString(formData, "startTime").trim();
    const durationMinutes = parseDurationMinutes(getString(formData, "durationMinutes").trim());
    const startsAt = combineDateAndTime(eventDate, startTime);
    const visibility = parseVisibility(getString(formData, "visibility"));
    const audienceType = visibility === CalendarEventVisibility.PUBLIC
      ? CalendarAudienceType.ALL
      : parseAudience(getString(formData, "audienceType"));
    const attendanceConfirmationEnabled = getBoolean(formData, "attendanceConfirmationEnabled");
    const privateAudienceUserIds = visibility === CalendarEventVisibility.PUBLIC
      ? []
      : formData
          .getAll("privateAudienceUserIds")
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean);

    const savedEvent = await saveCalendarEvent({
      id: id || undefined,
      title,
      description,
      imageUrl,
      imagePublicId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + durationMinutes * 60_000),
      allDay: getBoolean(formData, "allDay"),
      location: getString(formData, "location").trim(),
      visibility,
      audienceType,
      status: CalendarEventStatus.PUBLISHED,
      kind: getString(formData, "kind") === "MEETING" ? "MEETING" : "EVENT",
      registrationsEnabled: getBoolean(formData, "registrationsEnabled"),
      attendanceConfirmationEnabled,
      registrationAccess: visibility === CalendarEventVisibility.PUBLIC
        ? CalendarRegistrationAccess.PUBLIC
        : CalendarRegistrationAccess.MEMBERS,
      privateAudienceUserIds,
      createdById: user.id,
    });

    savedEventId = savedEvent.id;
    shouldNotify = attendanceConfirmationEnabled;
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    redirect(`/dashboard/calendar?error=${encodeURIComponent(code)}`);
  }

  after(async () => {
    if (shouldNotify) {
      await sendPendingCalendarEventInvitations(savedEventId);
    }
    await syncEventForConfirmedUsers(savedEventId);
  });

  redirect(`/dashboard/calendar?ok=${shouldNotify ? "invitation_scheduled" : "saved"}`);
}

export async function cancelCalendarEventAction(formData: FormData) {
  await requireAdmin("/dashboard/calendar?error=forbidden");
  const id = getString(formData, "id").trim();
  if (!id) redirect("/dashboard/calendar?error=missing_event_id");

  await cancelCalendarEvent(id);
  after(async () => {
    await removeEventFromGoogleCalendars(id);
  });
  redirect("/dashboard/calendar?ok=canceled");
}

export async function retryCalendarEventInvitationsAction(formData: FormData) {
  await requireAdmin("/dashboard/calendar?error=forbidden");
  const id = getString(formData, "id").trim();
  if (!id) redirect("/dashboard/calendar?error=missing_event_id");

  after(async () => {
    await sendPendingCalendarEventInvitations(id);
  });
  redirect("/dashboard/calendar?ok=mail_retry_scheduled");
}
