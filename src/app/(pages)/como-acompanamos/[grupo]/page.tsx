import { notFound } from "next/navigation";

import { GroupDetailView } from "@/modules/cms/components/child-page-content-views";
import { cmsRouteKey, slugifyCmsSegment } from "@/modules/cms/child-content-config";
import { getCmsPublishedImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { accompanimentGroups } from "@/modules/como-acompanamos/content-slots";

type GroupPageProps = { params: Promise<{ grupo: string }> };

export function generateStaticParams() {
  return accompanimentGroups.map((group) => ({ grupo: slugifyCmsSegment(group.title) }));
}

export async function generateMetadata({ params }: GroupPageProps) {
  const { grupo } = await params;
  const group = accompanimentGroups.find((item) => slugifyCmsSegment(item.title) === grupo);
  return group ? { title: `${group.title} | Koru`, description: `${group.title}, ${group.ageRange}. Acompañamiento pedagógico en Koru.` } : {};
}

export default async function GrupoAcompanamientoPage({ params }: GroupPageProps) {
  const { grupo } = await params;
  const group = accompanimentGroups.find((item) => slugifyCmsSegment(item.title) === grupo);
  if (!group) notFound();
  const slug = `/como-acompanamos/${grupo}`;
  const [textMap, imageMap] = await Promise.all([
    getCmsPublishedTextMapBySlug(slug),
    getCmsPublishedImageMapBySlug(slug),
  ]);
  return <GroupDetailView group={group} pageKey={cmsRouteKey(slug)} textMap={textMap} imageMap={imageMap} />;
}
