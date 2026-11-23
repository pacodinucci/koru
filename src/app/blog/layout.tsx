import { signOutAction } from "@/modules/auth/server/auth-actions";
import { getCmsPublishedTextMap } from "@/modules/cms/server/cms-text.repository";
import { getDefaultLandingTextMap } from "@/modules/landing/config/landing-sections";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let textMap = getDefaultLandingTextMap();
  try {
    textMap = await getCmsPublishedTextMap();
  } catch (error) {
    console.error("[BlogLayout] Failed to load CMS text map, using defaults.", error);
  }

  return (
    <LandingPageLayout textMap={textMap} onSignOut={signOutAction}>
      {children}
    </LandingPageLayout>
  );
}
