import type { CmsImageSlot } from "@/modules/cms/content-page-config";
import type { LandingContentSlot } from "@/modules/landing/content-slots";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

export const SITE_CHROME_IMAGE_PAGE_SLUG = "/";

export const siteChromeImageSlots: CmsImageSlot[] = [
  {
    key: "site-chrome.navbar.logo",
    label: "Navbar · Logo",
    defaultSrc: "/branding/koru-logo.png",
    alt: "Logo de Koru",
    frameLocked: true,
  },
  {
    key: "site-chrome.footer.logo",
    label: "Footer · Logo",
    defaultSrc: "/branding/koru-logo-white.png",
    alt: "Logo de Koru",
    frameLocked: true,
  },
];

const textSlot = (
  id: string,
  label: string,
  defaultValue: string,
  multiline = false,
): LandingContentSlot => ({
  id,
  label,
  selectorLabel: label,
  defaultValue,
  defaultSize: 16,
  multiline,
  styleControls: [],
});

export const siteChromeNavEntries = [
  ["quienes-somos", "Quiénes somos", "/quienes-somos"],
  ["como-acompanamos", "Cómo acompañamos", "/como-acompanamos"],
  ["comunidad", "Comunidad", "/comunidad"],
  ["blog", "Blog", "/blog"],
  ["escuela", "Escuela para familias", "/family-dashboard"],
  ["admisiones", "Admisiones", "/admisiones"],
  ["contacto", "Contacto", "/contacto"],
  ["login", "Log In", "/sign-in"],
] as const;

export const siteChromeSlotIds = {
  navbarLogoAlt: "site-chrome.navbar.logo.alt",
  footerDescription: "site-chrome.footer.description",
  footerLinksTitle: "site-chrome.footer.links.title",
  footerCommunityTitle: "site-chrome.footer.community.title",
  footerContactTitle: "site-chrome.footer.contact.title",
  footerContactEmail: "site-chrome.footer.contact.email",
  footerContactPhone: "site-chrome.footer.contact.phone",
  footerContactAddress: "site-chrome.footer.contact.address",
  footerCopyright: "site-chrome.footer.copyright",
  footerTermsLabel: "site-chrome.footer.terms.label",
  footerTermsHref: "site-chrome.footer.terms.href",
  footerPrivacyLabel: "site-chrome.footer.privacy.label",
} as const;

export const siteChromeNavbarSlots: LandingContentSlot[] = [
  textSlot(siteChromeSlotIds.navbarLogoAlt, "Navbar · texto alternativo del logo", "Koru"),
  ...siteChromeNavEntries.flatMap(([id, label, href]) => [
    textSlot(`site-chrome.navbar.${id}.label`, `Navbar · ${label}`, label),
    textSlot(`site-chrome.navbar.${id}.href`, `Navbar · ${label} · enlace`, href),
  ]),
];

export const siteChromeFooterSlots: LandingContentSlot[] = [
  textSlot(siteChromeSlotIds.footerDescription, "Footer · descripción", "Koru es una comunidad viva de aprendizaje donde acompañamos procesos con presencia, cuidado y vínculo auténtico.", true),
  textSlot(siteChromeSlotIds.footerLinksTitle, "Footer · enlaces · título", "Links"),
  textSlot(siteChromeSlotIds.footerCommunityTitle, "Footer · comunidad · título", "Comunidad"),
  ...[
    "Acompañamiento integral",
    "Comunidad de familias",
    "Programas por etapas",
    "Experiencias vivenciales",
    "Orientación personalizada",
  ].map((value, index) => textSlot(`site-chrome.footer.community.item.${index + 1}`, `Footer · comunidad · ítem ${index + 1}`, value)),
  textSlot(siteChromeSlotIds.footerContactTitle, "Footer · contacto · título", "Contacto"),
  textSlot(siteChromeSlotIds.footerContactEmail, "Footer · contacto · correo", "contacto@koruosa.com"),
  textSlot(siteChromeSlotIds.footerContactPhone, "Footer · contacto · teléfono", "+52 81 0000 0000"),
  textSlot(siteChromeSlotIds.footerContactAddress, "Footer · contacto · dirección", "Tepoztlán, Morelos, México"),
  textSlot(siteChromeSlotIds.footerCopyright, "Footer · legales · copyright", "Copyright © 2026 Koru OSA. All Rights Reserved."),
  textSlot(siteChromeSlotIds.footerTermsLabel, "Footer · legales · términos", "Términos y condiciones"),
  textSlot(siteChromeSlotIds.footerTermsHref, "Footer · legales · enlace de términos", "#"),
  textSlot(siteChromeSlotIds.footerPrivacyLabel, "Footer · legales · privacidad", "Privacidad"),
];

export const siteChromeSlots = [...siteChromeNavbarSlots, ...siteChromeFooterSlots];

export type SiteChromeNavLink = { id: string; labelSlotId: string; hrefSlotId: string; label: string; href: string };

export function getSiteChromeNavLinks(textMap: LandingTextMap): SiteChromeNavLink[] {
  return siteChromeNavEntries.map(([id, label, href]) => {
    const labelSlotId = `site-chrome.navbar.${id}.label`;
    const hrefSlotId = `site-chrome.navbar.${id}.href`;
    return {
      id,
      labelSlotId,
      hrefSlotId,
      label: textMap[labelSlotId] ?? label,
      href: textMap[hrefSlotId] ?? href,
    };
  }).filter((item) => item.label.trim() !== "");
}

export function getSiteChromeSlotDefaults() {
  return Object.fromEntries(siteChromeSlots.map((slot) => [slot.id, slot.defaultValue]));
}
