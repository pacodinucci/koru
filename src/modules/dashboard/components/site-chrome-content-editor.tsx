"use client";

import { PageContentEditor } from "@/modules/dashboard/components/landing-content-editor";
import { LandingNav } from "@/modules/landing/components/landing-nav";
import { SiteFooter } from "@/modules/landing/components/site-footer";
import {
  getSiteChromeNavLinks,
  siteChromeFooterSlots,
  siteChromeImageSlots,
  siteChromeNavbarSlots,
} from "@/modules/cms/site-chrome-content";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

type SiteChrome = "navbar" | "footer";

export function SiteChromeContentEditor({ chrome, initialTextMap, initialImageMap }: { chrome: SiteChrome; initialTextMap: LandingTextMap; initialImageMap: CmsImageMap }) {
  const slots = chrome === "navbar" ? siteChromeNavbarSlots : siteChromeFooterSlots;
  const imageSlots = siteChromeImageSlots.filter((slot) => slot.key.startsWith(`site-chrome.${chrome}.`));

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      initialImageMap={initialImageMap}
      slots={slots}
      imageSlots={imageSlots}
      pageSlug="/"
      previewLabel={`Preview de ${chrome === "navbar" ? "Navbar" : "Footer"}`}
      renderPreview={({ textMap, imageMap, selectedSlotId, onSelectSlot }) => {
        const bindings = { textMap, imageMap, previewMode: true, selectedContentSlotId: selectedSlotId, onSelectContentSlot: onSelectSlot };
        return chrome === "navbar" ? (
          <div className="min-h-[160px] bg-white"><LandingNav {...bindings} links={getSiteChromeNavLinks(textMap)} fixed={false} disableScrollBackgroundChange /></div>
        ) : <SiteFooter {...bindings} navLinks={getSiteChromeNavLinks(textMap)} />;
      }}
    />
  );
}