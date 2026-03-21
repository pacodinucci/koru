import { LandingView } from "@/modules/landing/views/landing-view";
import { getCmsPublishedTextMap } from "@/modules/cms/server/cms-text.repository";

export async function HomeView() {
  const textMap = await getCmsPublishedTextMap();

  return <LandingView textMap={textMap} />;
}
