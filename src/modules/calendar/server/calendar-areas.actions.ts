"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { syncUpcomingConfirmedEventsForUser } from "@/modules/calendar/server/google-calendar/google-calendar-sync.service";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { setCalendarAreaGrant } from "@/modules/calendar/server/calendar-areas.repository";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function setCalendarAreaGrantAction(formData: FormData) {
  await requirePermission("calendar.permissions.manage");

  const areaId = getString(formData, "areaId");
  const userId = getString(formData, "userId");
  const accessLevel = getString(formData, "accessLevel");
  if (!areaId || !userId || !["none", "read", "edit"].includes(accessLevel)) {
    throw new Error("invalid_calendar_area_grant");
  }

  await setCalendarAreaGrant({
    areaId,
    userId,
    enabled: accessLevel !== "none",
    canEdit: accessLevel === "edit",
  });

  after(async () => {
    // Re-check current visibility and remove connected copies whose access was revoked.
    await syncUpcomingConfirmedEventsForUser(userId);
  });
  revalidatePath("/dashboard/calendar-permissions");
  revalidatePath("/dashboard/calendar");
}
