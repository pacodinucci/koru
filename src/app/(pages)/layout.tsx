import { signOutAction } from "@/modules/auth/server/auth-actions";
import { getCmsPublishedTextMap } from "@/modules/cms/server/cms-text.repository";
import { getCmsPublishedImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getDefaultLandingTextMap } from "@/modules/landing/config/landing-sections";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";

export default async function PublicPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let textMap = getDefaultLandingTextMap();
  let imageMap = {};
  try {
    [textMap, imageMap] = await Promise.all([getCmsPublishedTextMap(), getCmsPublishedImageMapBySlug("/")]);
  } catch (error) {
    console.error("[PublicPagesLayout] Failed to load CMS text map, using defaults.", error);
  }
  return (
    <LandingPageLayout textMap={textMap} imageMap={imageMap} onSignOut={signOutAction}>
      {children}
    </LandingPageLayout>
  );
}
