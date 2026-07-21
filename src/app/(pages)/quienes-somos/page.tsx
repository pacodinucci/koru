import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { QuienesSomosView } from "@/modules/quienes-somos/views/quienes-somos-view";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

export default async function QuienesSomosPage() {
  let textMap: LandingTextMap = {};

  try {
    textMap = await getCmsPublishedTextMapBySlug("/quienes-somos");
  } catch (error) {
    console.error(
      "[QuienesSomosPage] Failed to load CMS text map, using defaults.",
      error,
    );
  }

  return <QuienesSomosView textMap={textMap} />;
}
