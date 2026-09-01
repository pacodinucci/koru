import { getCmsPublishedImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { ComoAcompanamosView } from "@/modules/como-acompanamos/views/como-acompanamos-view";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

export default async function ComoAcompanamosPage() {
  let textMap: LandingTextMap = {};
  let imageMap = {};

  try {
    [textMap, imageMap] = await Promise.all([
      getCmsPublishedTextMapBySlug("/como-acompanamos"),
      getCmsPublishedImageMapBySlug("/como-acompanamos"),
    ]);
  } catch (error) {
    console.error(
      "[ComoAcompanamosPage] Failed to load CMS text map, using defaults.",
      error,
    );
  }

  return <ComoAcompanamosView textMap={textMap} imageMap={imageMap} />;
}
