import { redirect } from "next/navigation";

import { requireDashboardUser } from "@/modules/auth/server/auth-guards";

export default async function DashboardPage() {
  const user = await requireDashboardUser();

  if (user.role === "TEACHER") {
    redirect("/dashboard/exams");
  }

  redirect("/dashboard/layout");
}