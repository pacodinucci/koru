import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { CurrentUserAvatarProvider } from "@/components/current-user-avatar";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";

export default async function FamilyDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const viewer = await getAuthenticatedUser();

  return (
    <div className="min-h-screen [font-family:var(--font-montserrat)]">
      <CurrentUserAvatarProvider image={viewer?.image ?? null}>
        {children}
      </CurrentUserAvatarProvider>
    </div>
  );
}
