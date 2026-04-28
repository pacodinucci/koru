import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getCmsPublishedTextMap } from "@/modules/cms/server/cms-text.repository";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";

export default async function PublicPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const textMap = await getCmsPublishedTextMap();
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
    <LandingPageLayout textMap={textMap} user={user}>
      {children}
    </LandingPageLayout>
  );
}
