import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";

export default async function AuthRedirectPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role === "ADMIN" || user.role === "TEACHER") {
    redirect("/dashboard");
  }

  redirect("/family-dashboard");
}
