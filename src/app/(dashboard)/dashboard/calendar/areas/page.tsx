import { redirect } from "next/navigation";

import { requirePermission } from "@/modules/auth/server/auth-guards";

export default async function CalendarAreasPage() {
  await requirePermission("calendar.permissions.manage");
  redirect("/dashboard/calendar-permissions");
}
