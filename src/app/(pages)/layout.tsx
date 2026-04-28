import { getCmsPublishedTextMap } from "@/modules/cms/server/cms-text.repository";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";

export default async function PublicPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const textMap = await getCmsPublishedTextMap();

  return <LandingPageLayout textMap={textMap}>{children}</LandingPageLayout>;
}

