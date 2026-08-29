"use server";

import { CalendarAttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/modules/auth/server/auth-guards";
import { respondToCalendarEvent } from "@/modules/calendar/server/calendar-attendance.repository";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function respondToCalendarEventAction(formData: FormData) {
  const eventId = getString(formData, "eventId");
  if (!eventId) redirect("/calendario");

  const user = await requireUser(
    `/sign-in?returnTo=${encodeURIComponent(`/calendario/eventos/${eventId}`)}`,
  );
  const value = getString(formData, "status");
  const status =
    value === CalendarAttendanceStatus.CONFIRMED
      ? CalendarAttendanceStatus.CONFIRMED
      : value === CalendarAttendanceStatus.DECLINED
        ? CalendarAttendanceStatus.DECLINED
        : undefined;

  if (!status) {
    redirect(`/calendario/eventos/${eventId}?error=invalid_attendance_status`);
  }

  try {
    await respondToCalendarEvent({ eventId, userId: user.id, status });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    redirect(`/calendario/eventos/${eventId}?error=${encodeURIComponent(code)}`);
  }

  revalidatePath(`/calendario/eventos/${eventId}`);
  redirect(`/calendario/eventos/${eventId}?ok=attendance_updated`);
}