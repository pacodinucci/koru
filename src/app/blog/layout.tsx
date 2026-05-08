import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { LandingNav } from "@/modules/landing/components/landing-nav";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session
    ? {
        name: session.user.name?.trim() || "Usuario",
        email: session.user.email,
      }
    : null;

  return (
    <div className="min-h-screen bg-white text-black">
      <LandingNav fixed user={user} />
      <div style={{ minHeight: "96px" }} />
      {children}
    </div>
  );
}

