import { getCmsPublishedImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { ComunidadView } from "@/modules/comunidad/views/comunidad-view";

export default async function ComunidadPage() {
  const [textMap, imageMap] = await Promise.all([
    getCmsPublishedTextMapBySlug("/comunidad"),
    getCmsPublishedImageMapBySlug("/comunidad"),
  ]);

  return <ComunidadView textMap={textMap} imageMap={imageMap} />;
}
