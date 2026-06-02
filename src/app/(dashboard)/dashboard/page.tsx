import { redirect } from "next/navigation";

import { requireAdmin } from "@/modules/auth/server/auth-guards";

export default async function DashboardPage() {
  await requireAdmin();
  redirect("/dashboard/layout");
}
