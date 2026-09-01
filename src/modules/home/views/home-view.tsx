import { LandingView } from "@/modules/landing/views/landing-view";
import { getCmsPublishedImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsPublishedTextMap } from "@/modules/cms/server/cms-text.repository";

export async function HomeView() {
  const [textMap, imageMap] = await Promise.all([
    getCmsPublishedTextMap(),
    getCmsPublishedImageMapBySlug("/"),
  ]);

  return <LandingView textMap={textMap} imageMap={imageMap} />;
}
