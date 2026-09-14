"use client";

import Link from "next/link";

import { CmsPageEditableImage } from "@/modules/cms/components/cms-page-editable-image";
import {
  siteChromeFooterSlots,
  siteChromeImageSlots,
  siteChromeSlotIds,
  type SiteChromeNavLink,
} from "@/modules/cms/site-chrome-content";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";

type SiteFooterProps = {
  textMap: LandingTextMap;
  imageMap?: CmsImageMap;
  navLinks: SiteChromeNavLink[];
} & LandingPreviewBindings;

const slotById = new Map(siteChromeFooterSlots.map((slot) => [slot.id, slot]));
const footerLogo = siteChromeImageSlots.find((slot) => slot.key === "site-chrome.footer.logo");

function FooterText({ slotId, textMap, previewMode, selectedContentSlotId, onSelectContentSlot, className, as = "span" }: {
  slotId: string;
  textMap: LandingTextMap;
  previewMode?: boolean;
  selectedContentSlotId?: string;
  onSelectContentSlot?: (slotId: string) => void;
  className?: string;
  as?: "span" | "p" | "h4" | "li";
}) {
  const slot = slotById.get(slotId);
  if (!slot) return null;
  return <EditableContentSlot as={as} slot={slot} textMap={textMap} previewMode={previewMode} selected={selectedContentSlotId === slotId} onSelect={onSelectContentSlot} className={className} />;
}

export function SiteFooter({ textMap, imageMap, navLinks, previewMode, selectedContentSlotId, onSelectContentSlot }: SiteFooterProps) {
  const communityItemIds = [1, 2, 3, 4, 5].map((index) => `site-chrome.footer.community.item.${index}`);

  return (
    <div className="bg-[var(--complement-900)]">
      <div className="w-full px-2 py-10" style={{ fontFamily: "var(--font-montserrat)" }}>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.15fr] lg:gap-10">
          <section>
            {footerLogo ? (
              <div className="relative h-20 w-[120px]">
                <CmsPageEditableImage slotId={footerLogo.key} defaultSrc={footerLogo.defaultSrc} alt={textMap[siteChromeSlotIds.navbarLogoAlt] ?? footerLogo.alt} imageMap={imageMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} fill className="object-contain" />
              </div>
            ) : null}
            <FooterText slotId={siteChromeSlotIds.footerDescription} as="p" textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} className="mt-5 block max-w-[36ch] text-base leading-relaxed text-white/85" />
          </section>
          <section>
            <FooterText slotId={siteChromeSlotIds.footerLinksTitle} as="h4" textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} className="text-lg font-semibold uppercase tracking-tight text-white" />
            <nav className="mt-4 space-y-2.5 text-lg text-white/90">
              {navLinks.slice(0, 5).map((link) => (
                <Link key={link.id} href={link.href} className="block" onClick={(event) => { if (previewMode) event.preventDefault(); }}>
                  <FooterText slotId={link.labelSlotId} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} />
                </Link>
              ))}
            </nav>
          </section>
          <section>
            <FooterText slotId={siteChromeSlotIds.footerCommunityTitle} as="h4" textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} className="text-lg font-semibold uppercase tracking-tight text-white" />
            <ul className="mt-4 space-y-2.5 text-lg text-white/90">
              {communityItemIds.map((slotId) => <FooterText key={slotId} slotId={slotId} as="li" textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} />)}
            </ul>
          </section>
          <section>
            <FooterText slotId={siteChromeSlotIds.footerContactTitle} as="h4" textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} className="text-lg font-semibold uppercase tracking-tight text-white" />
            <ul className="mt-4 space-y-3 text-lg text-white/90">
              <li>✉ <FooterText slotId={siteChromeSlotIds.footerContactEmail} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} /></li>
              <li>☎ <FooterText slotId={siteChromeSlotIds.footerContactPhone} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} /></li>
              <li>⌖ <FooterText slotId={siteChromeSlotIds.footerContactAddress} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} /></li>
            </ul>
          </section>
        </div>
        <div className="mt-8 border-t border-white/30 pt-5"><div className="flex flex-col gap-3 text-base text-white/90 md:flex-row md:items-center md:justify-between"><FooterText slotId={siteChromeSlotIds.footerCopyright} as="p" textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} /><nav className="flex items-center gap-4"><a href={textMap[siteChromeSlotIds.footerTermsHref] ?? "#"} onClick={(event) => { if (previewMode) event.preventDefault(); }}><FooterText slotId={siteChromeSlotIds.footerTermsLabel} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} /></a><span>|</span><a href={textMap[siteChromeSlotIds.footerPrivacyHref] ?? "#"} onClick={(event) => { if (previewMode) event.preventDefault(); }}><FooterText slotId={siteChromeSlotIds.footerPrivacyLabel} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} /></a></nav></div></div>
      </div>
    </div>
  );
}