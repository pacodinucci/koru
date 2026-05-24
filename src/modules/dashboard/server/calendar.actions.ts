"use server";

import { CalendarAudienceType, CalendarEventStatus } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

function parseDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("invalid_date");
  }
  return parsed;
}

function parseAudience(value: string): CalendarAudienceType {
  if (Object.values(CalendarAudienceType).includes(value as CalendarAudienceType)) {
    return value as CalendarAudienceType;
  }
  return CalendarAudienceType.ALL;
}

function parseStatus(value: string): CalendarEventStatus {
  if (Object.values(CalendarEventStatus).includes(value as CalendarEventStatus)) {
    return value as CalendarEventStatus;
  }
  return CalendarEventStatus.DRAFT;
}

async function ensureAdminOrRedirect() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const sessionEmail =
    typeof session?.user?.email === "string" ? session.user.email.trim() : "";

  if (!sessionEmail) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard/calendar?error=forbidden");
  }

  return user;
}

export async function saveCalendarEventAction(formData: FormData) {
  const user = await ensureAdminOrRedirect();

  try {
    const id = getString(formData, "id").trim();
    const title = getString(formData, "title").trim();
    const description = getString(formData, "description").trim();
    const startsAt = parseDate(getString(formData, "startsAt"));
    const endsAt = parseDate(getString(formData, "endsAt"));
    const allDay = getBoolean(formData, "allDay");
    const location = getString(formData, "location").trim();
    const audienceType = parseAudience(getString(formData, "audienceType"));
    const status = parseStatus(getString(formData, "status"));
    const kind = getString(formData, "kind") === "MEETING" ? "MEETING" : "EVENT";
    const privateAudienceUserIds = formData
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
  await ensureAdminOrRedirect();

  const id = getString(formData, "id").trim();
  if (!id) {
    redirect("/dashboard/calendar?error=missing_event_id");
  }

  await cancelCalendarEvent(id);
  redirect("/dashboard/calendar?ok=canceled");
}
