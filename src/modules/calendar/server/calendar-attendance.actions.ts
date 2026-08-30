"use server";

import { CalendarAttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requireUser } from "@/modules/auth/server/auth-guards";
import { respondToCalendarEvent } from "@/modules/calendar/server/calendar-attendance.repository";
import {
  removeAttendanceFromGoogle,
  syncConfirmedAttendanceToGoogle,
} from "@/modules/calendar/server/google-calendar/google-calendar-sync.service";

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

  after(async () => {
    if (status === CalendarAttendanceStatus.CONFIRMED) {
      await syncConfirmedAttendanceToGoogle(user.id, eventId);
      return;
    }
    await removeAttendanceFromGoogle(user.id, eventId);
  });

  revalidatePath(`/calendario/eventos/${eventId}`);
  redirect(`/calendario/eventos/${eventId}?ok=attendance_updated`);
}
