import { redirect } from "next/navigation";

import { isDashboardRole } from "@/modules/auth/roles";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";

export default async function AuthRedirectPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (isDashboardRole(user.role)) {
    redirect("/dashboard");
  }

  redirect("/family-dashboard");
}