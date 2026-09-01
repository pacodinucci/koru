import { CommunityAgreementsView } from "@/modules/cms/components/child-page-content-views";
import { cmsRouteKey } from "@/modules/cms/child-content-config";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";

const slug = "/comunidad/acuerdos";

export default async function AcuerdosComunidadPage() {
  const textMap = await getCmsPublishedTextMapBySlug(slug);
  return <CommunityAgreementsView pageKey={cmsRouteKey(slug)} textMap={textMap} />;
}
