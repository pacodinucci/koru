import { signOutAction } from "@/modules/auth/server/auth-actions";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
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
  const authenticatedUser = await getAuthenticatedUser();
  const user = authenticatedUser
    ? {
        name: authenticatedUser.name?.trim() || "Usuario",
        email: authenticatedUser.email,
        canAccessDashboard: authenticatedUser.permissionKeys.includes("dashboard.access"),
      }
    : null;

  return (
    <LandingPageLayout textMap={textMap} imageMap={imageMap} user={user} onSignOut={signOutAction}>
      {children}
    </LandingPageLayout>
  );
}
