"use server";

import {
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventVisibility,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
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
  if (Object.values(CalendarAudienceType).includes(value as CalendarAudienceType)) {
    return value as CalendarAudienceType;
  }
  return CalendarAudienceType.ALL;
}

function parseVisibility(value: string): CalendarEventVisibility {
  if (Object.values(CalendarEventVisibility).includes(value as CalendarEventVisibility)) {
    return value as CalendarEventVisibility;
  }
  return CalendarEventVisibility.MEMBERS;
}

function parseDurationMinutes(value: string) {
  const minutes = Number.parseInt(value, 10);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("invalid_duration");
  }
  if (minutes > 24 * 60) {
    throw new Error("duration_too_long");
  }
  return minutes;
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  const iso = `${dateValue}T${timeValue}:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("invalid_date");
  }
  return parsed;
}


export async function saveCalendarEventAction(formData: FormData) {
  const user = await requireAdmin("/dashboard/calendar?error=forbidden");

  try {
    const id = getString(formData, "id").trim();
    const title = getString(formData, "title").trim();
    const description = getString(formData, "description").trim();
    const eventDate = getString(formData, "eventDate").trim();
    const startTime = getString(formData, "startTime").trim();
    const durationMinutes = parseDurationMinutes(getString(formData, "durationMinutes").trim());
    const startsAt = combineDateAndTime(eventDate, startTime);
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
    const allDay = getBoolean(formData, "allDay");
    const location = getString(formData, "location").trim();
    const visibility = parseVisibility(getString(formData, "visibility"));
    const audienceType =
      visibility === CalendarEventVisibility.PUBLIC
        ? CalendarAudienceType.ALL
        : parseAudience(getString(formData, "audienceType"));
    const status = CalendarEventStatus.PUBLISHED;
    const kind = getString(formData, "kind") === "MEETING" ? "MEETING" : "EVENT";
    const privateAudienceUserIds =
      visibility === CalendarEventVisibility.PUBLIC
        ? []
        : formData
            .getAll("privateAudienceUserIds")
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean);

    if (!title) {
      redirect("/dashboard/calendar?error=missing_title");
    }

    await saveCalendarEvent({
      id: id || undefined,
      title,
      description,
      startsAt,
      endsAt,
      allDay,
      location,
      visibility,
      audienceType,
      status,
      kind,
      privateAudienceUserIds,
      createdById: user.id,
    });

    redirect("/dashboard/calendar?ok=saved");
  } catch (error) {
    if (error instanceof Error) {
      redirect(`/dashboard/calendar?error=${encodeURIComponent(error.message)}`);
    }
    redirect("/dashboard/calendar?error=unknown");
  }
}

export async function cancelCalendarEventAction(formData: FormData) {
  await requireAdmin("/dashboard/calendar?error=forbidden");

  const id = getString(formData, "id").trim();
  if (!id) {
    redirect("/dashboard/calendar?error=missing_event_id");
  }

  await cancelCalendarEvent(id);
  redirect("/dashboard/calendar?ok=canceled");
}
