import { notFound } from "next/navigation";

import { MethodologyDetailView } from "@/modules/cms/components/child-page-content-views";
import { cmsRouteKey } from "@/modules/cms/child-content-config";
import { getCmsPublishedImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { methodologies } from "@/modules/como-acompanamos/content-slots";

type MethodologyPageProps = { params: Promise<{ metodologia: string }> };

export function generateStaticParams() {
  return methodologies.map((methodology) => ({ metodologia: methodology.slug }));
}

export async function generateMetadata({ params }: MethodologyPageProps) {
  const { metodologia } = await params;
  const methodology = methodologies.find((item) => item.slug === metodologia);
  return methodology ? { title: `${methodology.title} | Koru`, description: methodology.detailParagraphs?.[0] ?? methodology.paragraphs?.[0] } : {};
}

export default async function MethodologyPage({ params }: MethodologyPageProps) {
  const { metodologia } = await params;
  const methodology = methodologies.find((item) => item.slug === metodologia);
  if (!methodology) notFound();
  const slug = `/como-acompanamos/metodologias/${metodologia}`;
  const [textMap, imageMap] = await Promise.all([
    getCmsPublishedTextMapBySlug(slug),
    getCmsPublishedImageMapBySlug(slug),
  ]);
  return <MethodologyDetailView methodology={methodology} pageKey={cmsRouteKey(slug)} textMap={textMap} imageMap={imageMap} />;
}
