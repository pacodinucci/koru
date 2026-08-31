import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { AdmisionesView } from "@/modules/admisiones/views/admisiones-view";

export default async function AdmisionesPage() {
  const textMap = await getCmsPublishedTextMapBySlug("/admisiones");
  return <AdmisionesView textMap={textMap} />;
}