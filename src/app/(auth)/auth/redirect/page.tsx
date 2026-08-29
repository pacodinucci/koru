import { redirect } from "next/navigation";

import { isDashboardRole } from "@/modules/auth/roles";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function AuthRedirectPage({ searchParams }: Props) {
  const [user, params] = await Promise.all([
    getAuthenticatedUser(),
    searchParams,
  ]);

  if (!user) redirect("/sign-in");

  const returnTo =
    params.returnTo?.startsWith("/") && !params.returnTo.startsWith("//")
      ? params.returnTo
      : undefined;
  if (returnTo) redirect(returnTo);

  if (isDashboardRole(user.role)) redirect("/dashboard");
  redirect("/family-dashboard");
}