import { redirect } from "next/navigation";

import { isAdminRole } from "@/modules/auth/roles";
import { requireDashboardUser } from "@/modules/auth/server/auth-guards";

export default async function DashboardPage() {
  const user = await requireDashboardUser();

  if (!isAdminRole(user.role)) {
    redirect("/dashboard/exams");
  }

  redirect("/dashboard/diseno");
}