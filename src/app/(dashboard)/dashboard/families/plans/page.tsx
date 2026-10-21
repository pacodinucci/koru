import { redirect } from "next/navigation";

import { requirePermission } from "@/modules/auth/server/auth-guards";

export default async function DashboardPlansPage() {
  await requirePermission("families.view");
  redirect("/dashboard/families/rubrics");
}
