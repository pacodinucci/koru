import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { ComunidadView } from "@/modules/comunidad/views/comunidad-view";

export default async function ComunidadPage() {
  const textMap = await getCmsPublishedTextMapBySlug("/comunidad");
  return <ComunidadView textMap={textMap} />;
}