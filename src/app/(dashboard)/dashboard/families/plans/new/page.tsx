import { redirect } from "next/navigation";

import { requirePermission } from "@/modules/auth/server/auth-guards";

export default async function NewPlanPage() {
  await requirePermission("families.manage");
  redirect("/dashboard/families/rubrics");
}
