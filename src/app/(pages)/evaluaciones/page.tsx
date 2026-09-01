import { getCmsPublishedImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { EvaluacionesView } from "@/modules/evaluaciones/views/evaluaciones-view";

export default async function EvaluacionesPage() {
  const [textMap, imageMap] = await Promise.all([
    getCmsPublishedTextMapBySlug("/evaluaciones"),
    getCmsPublishedImageMapBySlug("/evaluaciones"),
  ]);
  return <EvaluacionesView textMap={textMap} imageMap={imageMap} />;
}
