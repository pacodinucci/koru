import { TeamApplicationView } from "@/modules/cms/components/child-page-content-views";
import { cmsRouteKey } from "@/modules/cms/child-content-config";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";

const slug = "/unete-al-equipo";

export default async function UneteAlEquipoPage() {
  const textMap = await getCmsPublishedTextMapBySlug(slug);
  return <TeamApplicationView pageKey={cmsRouteKey(slug)} textMap={textMap} />;
}
