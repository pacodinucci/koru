import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";
import { ComoAcompanamosView } from "@/modules/como-acompanamos/views/como-acompanamos-view";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

export default async function ComoAcompanamosPage() {
  let textMap: LandingTextMap = {};

  try {
    textMap = await getCmsPublishedTextMapBySlug("/como-acompanamos");
  } catch (error) {
    console.error(
      "[ComoAcompanamosPage] Failed to load CMS text map, using defaults.",
      error,
    );
  }

  return <ComoAcompanamosView textMap={textMap} />;
}
