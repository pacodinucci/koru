import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { LandingView } from "@/modules/landing/views/landing-view";

type StaticCmsPageViewProps = {
  slug: string;
};

export async function StaticCmsPageView({ slug }: StaticCmsPageViewProps) {
  const textMap = await getCmsPublishedTextMapBySlug(slug);

  return <LandingView textMap={textMap} />;
}
