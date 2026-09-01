import { getCmsPublishedImageMapBySlug } from "@/modules/cms/server/cms-image.repository";
import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { QuienesSomosView } from "@/modules/quienes-somos/views/quienes-somos-view";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

export default async function QuienesSomosPage() {
  let textMap: LandingTextMap = {};
  let imageMap = {};

  try {
    [textMap, imageMap] = await Promise.all([
      getCmsPublishedTextMapBySlug("/quienes-somos"),
      getCmsPublishedImageMapBySlug("/quienes-somos"),
    ]);
  } catch (error) {
    console.error(
      "[QuienesSomosPage] Failed to load CMS text map, using defaults.",
      error,
    );
  }

  return <QuienesSomosView textMap={textMap} imageMap={imageMap} />;
}
