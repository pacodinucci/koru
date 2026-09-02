"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import {
  getCalendarActionReturnTo,
  withCalendarActionResult,
} from "@/modules/calendar/lib/calendar-action-redirect";
import {
  getCalendarEventForViewer,
  registerForCalendarEvent,
} from "@/modules/calendar/server/calendar-registration.repository";
import { syncConfirmedAttendanceToGoogle } from "@/modules/calendar/server/google-calendar/google-calendar-sync.service";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function registerForCalendarEventAction(formData: FormData) {
  const eventId = getString(formData, "eventId").trim();
  if (!eventId) redirect("/calendario");

  const requestedReturnTo = getCalendarActionReturnTo(formData);
  const returnTo = requestedReturnTo ?? `/calendario/eventos/${eventId}`;
  const user = await getAuthenticatedUser();
  const viewer = user ? { id: user.id, role: user.role } : undefined;
  const event = await getCalendarEventForViewer(eventId, viewer);

  if (!event) {
    redirect(
      requestedReturnTo
        ? withCalendarActionResult(returnTo, "error", "event_not_found")
        : "/calendario?error=event_not_found",
    );
  }
  if (!event.registrationsEnabled) {
    redirect(
      withCalendarActionResult(returnTo, "error", "registrations_disabled"),
    );
  }
  if (event.visibility === "MEMBERS" && !viewer) {
    redirect(withCalendarActionResult(returnTo, "error", "members_only"));
  }

  const name = getString(formData, "name").trim();
  const email = normalizeEmail(getString(formData, "email"));
  const phone = getString(formData, "phone").trim();
  if (!name || !email || !phone) {
    redirect(
      withCalendarActionResult(returnTo, "error", "missing_registration_data"),
    );
  }

  try {
    await registerForCalendarEvent({ eventId, viewer, name, email, phone });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    redirect(withCalendarActionResult(returnTo, "error", code));
  }

  if (user) {
    after(async () => {
      await syncConfirmedAttendanceToGoogle(user.id, eventId);
    });
  }

  revalidatePath(`/calendario/eventos/${eventId}`);
  revalidatePath("/family-dashboard/calendario");
  redirect(withCalendarActionResult(returnTo, "ok", "registered"));
}
