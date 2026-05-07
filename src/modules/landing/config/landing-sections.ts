import {
  getLandingFieldSizeKey,
  type LandingTextMap,
} from "@/modules/landing/types/landing-text";

export const LANDING_STRUCTURE_KEY = "__landing_structure";
export const LANDING_BACKGROUND_SCOPES_KEY = "__landing_background_scopes";
export const LANDING_LAYOUT_PADDING_X_KEY = "__landing_layout_padding_x";
export const LANDING_LAYOUT_NAV_BG_KEY = "__landing_layout_nav_bg";
export const LANDING_LAYOUT_NAV_TEXT_KEY = "__landing_layout_nav_text";
export const LANDING_LAYOUT_NAV_HEIGHT_KEY = "__landing_layout_nav_height";
export const LANDING_LAYOUT_NAV_LOGO_SRC_KEY = "__landing_layout_nav_logo_src";
export const LANDING_LAYOUT_NAV_LOGO_ALT_KEY = "__landing_layout_nav_logo_alt";
export const LANDING_LAYOUT_NAV_LINKS_KEY = "__landing_layout_nav_links";
export const LANDING_LAYOUT_NAV_LINK1_LABEL_KEY = "__landing_layout_nav_link1_label";
export const LANDING_LAYOUT_NAV_LINK1_HREF_KEY = "__landing_layout_nav_link1_href";
export const LANDING_LAYOUT_NAV_LINK2_LABEL_KEY = "__landing_layout_nav_link2_label";
export const LANDING_LAYOUT_NAV_LINK2_HREF_KEY = "__landing_layout_nav_link2_href";
export const LANDING_LAYOUT_NAV_LINK3_LABEL_KEY = "__landing_layout_nav_link3_label";
export const LANDING_LAYOUT_NAV_LINK3_HREF_KEY = "__landing_layout_nav_link3_href";
export const LANDING_LAYOUT_NAV_LINK4_LABEL_KEY = "__landing_layout_nav_link4_label";
export const LANDING_LAYOUT_NAV_LINK4_HREF_KEY = "__landing_layout_nav_link4_href";
export const LANDING_LAYOUT_NAV_LINK5_LABEL_KEY = "__landing_layout_nav_link5_label";
export const LANDING_LAYOUT_NAV_LINK5_HREF_KEY = "__landing_layout_nav_link5_href";
export const LANDING_LAYOUT_NAV_LINK6_LABEL_KEY = "__landing_layout_nav_link6_label";
export const LANDING_LAYOUT_NAV_LINK6_HREF_KEY = "__landing_layout_nav_link6_href";
export const LANDING_LAYOUT_FOOTER_BG_KEY = "__landing_layout_footer_bg";
export const LANDING_LAYOUT_FOOTER_TEXT_KEY = "__landing_layout_footer_text";
export const LANDING_LAYOUT_FOOTER_HEIGHT_KEY = "__landing_layout_footer_height";
export const LANDING_LAYOUT_FOOTER_CONTAINERS_LAYOUT_KEY =
  "__landing_layout_footer_containers_layout";

export type LandingLayoutNavLink = {
  id: string;
  label: string;
  href: string;
};

export type LayoutContainerMode = "fixed" | "free";
export type LayoutContainerArrangement =
  | "block"
  | "flex-row"
  | "flex-column"
  | "grid-2";

export type LandingLayoutContainerRules = {
  mode: LayoutContainerMode;
  allowCreate: boolean;
  allowMove: boolean;
  allowArrangementSelect: boolean;
  allowedArrangements: LayoutContainerArrangement[];
  defaultArrangement: LayoutContainerArrangement;
};

export const landingLayoutContainerRules = {
  navbar: {
    mode: "fixed",
    allowCreate: false,
    allowMove: false,
    allowArrangementSelect: false,
    allowedArrangements: ["block"],
    defaultArrangement: "block",
  } satisfies LandingLayoutContainerRules,
  footer: {
    mode: "free",
    allowCreate: true,
    allowMove: true,
    allowArrangementSelect: true,
    allowedArrangements: ["block", "flex-row", "flex-column", "grid-2"],
    defaultArrangement: "flex-column",
  } satisfies LandingLayoutContainerRules,
} as const;

function getDefaultLayoutNavLinks(): LandingLayoutNavLink[] {
  return [
    { id: "nav-1", label: "Quienes somos", href: "/quienes-somos" },
    { id: "nav-2", label: "Como acompanamos", href: "/como-acompanamos" },
    { id: "nav-3", label: "Comunidad", href: "/comunidad" },
    { id: "nav-4", label: "Blog", href: "/blog" },
    { id: "nav-5", label: "Escuela para familias", href: "/family-dashboard" },
    { id: "nav-6", label: "Admisiones", href: "/admisiones" },
    { id: "nav-7", label: "Log In", href: "/sign-in" },
  ];
}

function normalizeLayoutNavLinks(raw: unknown) {
  if (!Array.isArray(raw)) {
    return null;
  }

  const normalized = raw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      const label =
        typeof candidate.label === "string" ? candidate.label.trim() : "";
      const href =
        typeof candidate.href === "string" ? candidate.href.trim() : "";
      const idRaw = typeof candidate.id === "string" ? candidate.id.trim() : "";
      const id = idRaw || `nav-${index + 1}`;

      return {
        id,
        label,
        href: href || "#",
      } as LandingLayoutNavLink;
    })
    .filter((item): item is LandingLayoutNavLink => Boolean(item));

  return normalized.length > 0 ? normalized : null;
}

export function parseLandingLayoutNavLinks(
  textMap: LandingTextMap,
): LandingLayoutNavLink[] {
  const rawJson = textMap[LANDING_LAYOUT_NAV_LINKS_KEY];
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      const normalized = normalizeLayoutNavLinks(parsed);
      if (normalized) {
        return normalized;
      }
    } catch {
      // Fallback to legacy keys/defaults when JSON is invalid.
    }
  }

  const legacy = [
    {
      id: "nav-1",
      label: textMap[LANDING_LAYOUT_NAV_LINK1_LABEL_KEY] ?? "Quienes somos",
      href: textMap[LANDING_LAYOUT_NAV_LINK1_HREF_KEY] ?? "/quienes-somos",
    },
    {
      id: "nav-2",
      label: textMap[LANDING_LAYOUT_NAV_LINK2_LABEL_KEY] ?? "Como acompanamos",
      href: textMap[LANDING_LAYOUT_NAV_LINK2_HREF_KEY] ?? "/como-acompanamos",
    },
    {
      id: "nav-3",
      label: textMap[LANDING_LAYOUT_NAV_LINK3_LABEL_KEY] ?? "Comunidad",
      href: textMap[LANDING_LAYOUT_NAV_LINK3_HREF_KEY] ?? "/comunidad",
    },
    {
      id: "nav-blog",
      label: "Blog",
      href: "/blog",
    },
    {
      id: "nav-4",
      label:
        textMap[LANDING_LAYOUT_NAV_LINK4_LABEL_KEY] ?? "Escuela para familias",
      href: textMap[LANDING_LAYOUT_NAV_LINK4_HREF_KEY] ?? "/family-dashboard",
    },
    {
      id: "nav-5",
      label: textMap[LANDING_LAYOUT_NAV_LINK5_LABEL_KEY] ?? "Admisiones",
      href: textMap[LANDING_LAYOUT_NAV_LINK5_HREF_KEY] ?? "/admisiones",
    },
    {
      id: "nav-6",
      label: textMap[LANDING_LAYOUT_NAV_LINK6_LABEL_KEY] ?? "Log In",
      href: textMap[LANDING_LAYOUT_NAV_LINK6_HREF_KEY] ?? "/sign-in",
    },
  ].filter((item) => item.label.trim() !== "");

  if (legacy.length > 0) {
    return legacy;
  }

  return getDefaultLayoutNavLinks();
}

export type LandingBackgroundScopeType = "none" | "spore";
export type LandingBackgroundVisualMode = "color" | "gradient";

export type LandingBackgroundScope = {
  id: string;
  name: string;
  type: LandingBackgroundScopeType;
  visualMode: LandingBackgroundVisualMode;
  color: string;
  gradient: string;
  heightVh: number;
};

export type LandingSectionType =
  | "hero"
  | "cards"
  | "story"
  | "gallery"
  | "editorial-feature"
  | "spore-stack"
  | "image-grid"
  | "video"
  | "footer";

export type LandingSectionField = {
  key: string;
  label: string;
  defaultValue: string;
  defaultSize: number;
  multiline?: boolean;
};

export type LandingSectionTypeDefinition = {
  type: LandingSectionType;
  label: string;
  fields: LandingSectionField[];
};

export type LandingSectionInstance = {
  id: string;
  type: LandingSectionType;
  name: string;
  scopeId?: string;
};

export type SectionExtraElementType =
  | "title"
  | "text"
  | "button"
  | "image"
  | "line-vertical"
  | "line-horizontal";

export type SectionExtraElement = {
  id: string;
  type: SectionExtraElementType;
};

export const landingSectionCatalog: Record<
  LandingSectionType,
  LandingSectionTypeDefinition
> = {
  hero: {
    type: "hero",
    label: "Hero",
    fields: [
      {
        key: "kicker",
        label: "Kicker",
        defaultValue: "BIENVENID@S A KORU OSA",
        defaultSize: 12,
      },
      {
        key: "title",
        label: "Titulo",
        defaultValue:
          "En Koru, entendemos la educacion como un organismo vivo.",
        defaultSize: 56,
      },
      {
        key: "body",
        label: "Descripcion",
        defaultValue:
          "Nuestro cuerpo escolar no es un molde rigido, sino una forma cambiante que respira, siente, aprende y se transforma junto a quienes lo habitan.",
        defaultSize: 20,
        multiline: true,
      },
      {
        key: "cta",
        label: "Texto boton",
        defaultValue: "Haz una donación",
        defaultSize: 14,
      },
    ],
  },
  cards: {
    type: "cards",
    label: "Cards Section",
    fields: [
      {
        key: "kicker",
        label: "Kicker",
        defaultValue: "NUESTRA MIRADA",
        defaultSize: 12,
      },
      {
        key: "title",
        label: "Titulo",
        defaultValue:
          "Pedagogias alternativas, crianza consciente y comunidad.",
        defaultSize: 40,
      },
      {
        key: "body",
        label: "Descripcion",
        defaultValue:
          "Nos nutrimos de pedagogias alternativas y del compromiso profundo con una comunidad que camina unida.",
        defaultSize: 18,
        multiline: true,
      },
      {
        key: "card1_title",
        label: "Card 1 titulo",
        defaultValue: "Ritmo Propio",
        defaultSize: 30,
      },
      {
        key: "card1_body",
        label: "Card 1 texto",
        defaultValue:
          "Acompanamos procesos individuales con calma, juego y curiosidad.",
        defaultSize: 18,
        multiline: true,
      },
      {
        key: "card2_title",
        label: "Card 2 titulo",
        defaultValue: "Comunidad Viva",
        defaultSize: 30,
      },
      {
        key: "card2_body",
        label: "Card 2 texto",
        defaultValue:
          "Aprender con otr@s nos ensena cuidado mutuo y autonomia.",
        defaultSize: 18,
        multiline: true,
      },
      {
        key: "card3_title",
        label: "Card 3 titulo",
        defaultValue: "Transformacion",
        defaultSize: 30,
      },
      {
        key: "card3_body",
        label: "Card 3 texto",
        defaultValue:
          "Cada experiencia deja huella y abre nuevas posibilidades.",
        defaultSize: 18,
        multiline: true,
      },
    ],
  },
  story: {
    type: "story",
    label: "Story Section",
    fields: [
      {
        key: "title",
        label: "Titulo",
        defaultValue: "Una practica educativa que se mueve con la vida",
        defaultSize: 40,
      },
      {
        key: "body",
        label: "Parrafo",
        defaultValue:
          "Caminamos unid@s en el respeto por los ritmos, las emociones y la transformacion de cada proceso.",
        defaultSize: 18,
        multiline: true,
      },
      {
        key: "quote",
        label: "Frase destacada",
        defaultValue: "Koru es abrazo, tribu y transformacion.",
        defaultSize: 26,
      },
    ],
  },
  gallery: {
    type: "gallery",
    label: "Gallery Section",
    fields: [
      {
        key: "title",
        label: "Titulo",
        defaultValue: "Galeria de experiencias",
        defaultSize: 40,
      },
      {
        key: "body",
        label: "Descripcion",
        defaultValue:
          "Momentos de juego, exploracion y aprendizaje compartido.",
        defaultSize: 18,
      },
      {
        key: "item1",
        label: "Item 1",
        defaultValue: "Exploracion sensorial",
        defaultSize: 18,
      },
      {
        key: "item2",
        label: "Item 2",
        defaultValue: "Arte en comunidad",
        defaultSize: 18,
      },
      {
        key: "item3",
        label: "Item 3",
        defaultValue: "Huerta y naturaleza",
        defaultSize: 18,
      },
      {
        key: "item4",
        label: "Item 4",
        defaultValue: "Rondas de palabra",
        defaultSize: 18,
      },
    ],
  },
  "editorial-feature": {
    type: "editorial-feature",
    label: "Editorial Feature Section",
    fields: [
      {
        key: "header_title",
        label: "Titulo superior",
        defaultValue: "What makes Koru unique?",
        defaultSize: 62,
      },
      {
        key: "kicker",
        label: "Kicker",
        defaultValue: "LEARNING TO BE",
        defaultSize: 20,
      },
      {
        key: "title",
        label: "Titulo principal",
        defaultValue: "ADVENTURE AS",
        defaultSize: 56,
      },
      {
        key: "subtitle",
        label: "Subtitulo",
        defaultValue: "Agency",
        defaultSize: 56,
      },
      {
        key: "body",
        label: "Parrafo principal",
        defaultValue:
          "Texto descriptivo principal para contar la idea de la seccion.",
        defaultSize: 24,
        multiline: true,
      },
      {
        key: "highlight",
        label: "Texto destacado",
        defaultValue:
          "Texto destacado en negrita para reforzar el mensaje central.",
        defaultSize: 34,
        multiline: true,
      },
      {
        key: "body2",
        label: "Parrafo secundario",
        defaultValue:
          "Parrafo complementario con detalles y cierre del bloque de contenido.",
        defaultSize: 24,
        multiline: true,
      },
      {
        key: "image",
        label: "Imagen",
        defaultValue: "/assets/img1.jpg",
        defaultSize: 14,
      },
    ],
  },
  "spore-stack": {
    type: "spore-stack",
    label: "Spore Stack Section",
    fields: [
      {
        key: "spore1_x",
        label: "Espora 1 X (%)",
        defaultValue: "6",
        defaultSize: 14,
      },
      {
        key: "spore1_y",
        label: "Espora 1 Y (%)",
        defaultValue: "6",
        defaultSize: 14,
      },
      {
        key: "spore1_size",
        label: "Espora 1 tamano",
        defaultValue: "6",
        defaultSize: 14,
      },
      {
        key: "spore1_rotate",
        label: "Espora 1 rotacion",
        defaultValue: "-16",
        defaultSize: 14,
      },
      {
        key: "spore1_opacity",
        label: "Espora 1 opacidad (0-100)",
        defaultValue: "10",
        defaultSize: 14,
      },
      {
        key: "spore1_color",
        label: "Espora 1 color",
        defaultValue: "var(--brand-600)",
        defaultSize: 14,
      },
      {
        key: "spore1_flip_x",
        label: "Espora 1 flip X (0/1)",
        defaultValue: "0",
        defaultSize: 14,
      },
      {
        key: "spore1_flip_y",
        label: "Espora 1 flip Y (0/1)",
        defaultValue: "0",
        defaultSize: 14,
      },
      {
        key: "spore2_x",
        label: "Espora 2 X (%)",
        defaultValue: "86",
        defaultSize: 14,
      },
      {
        key: "spore2_y",
        label: "Espora 2 Y (%)",
        defaultValue: "22",
        defaultSize: 14,
      },
      {
        key: "spore2_size",
        label: "Espora 2 tamano",
        defaultValue: "21",
        defaultSize: 14,
      },
      {
        key: "spore2_rotate",
        label: "Espora 2 rotacion",
        defaultValue: "21",
        defaultSize: 14,
      },
      {
        key: "spore2_opacity",
        label: "Espora 2 opacidad (0-100)",
        defaultValue: "30",
        defaultSize: 14,
      },
      {
        key: "spore2_color",
        label: "Espora 2 color",
        defaultValue: "var(--complement-800)",
        defaultSize: 14,
      },
      {
        key: "spore2_flip_x",
        label: "Espora 2 flip X (0/1)",
        defaultValue: "1",
        defaultSize: 14,
      },
      {
        key: "spore2_flip_y",
        label: "Espora 2 flip Y (0/1)",
        defaultValue: "0",
        defaultSize: 14,
      },
      {
        key: "spore3_x",
        label: "Espora 3 X (%)",
        defaultValue: "8",
        defaultSize: 14,
      },
      {
        key: "spore3_y",
        label: "Espora 3 Y (%)",
        defaultValue: "55",
        defaultSize: 14,
      },
      {
        key: "spore3_size",
        label: "Espora 3 tamano",
        defaultValue: "25",
        defaultSize: 14,
      },
      {
        key: "spore3_rotate",
        label: "Espora 3 rotacion",
        defaultValue: "-28",
        defaultSize: 14,
      },
      {
        key: "spore3_opacity",
        label: "Espora 3 opacidad (0-100)",
        defaultValue: "30",
        defaultSize: 14,
      },
      {
        key: "spore3_color",
        label: "Espora 3 color",
        defaultValue: "var(--brand-500)",
        defaultSize: 14,
      },
      {
        key: "spore3_flip_x",
        label: "Espora 3 flip X (0/1)",
        defaultValue: "0",
        defaultSize: 14,
      },
      {
        key: "spore3_flip_y",
        label: "Espora 3 flip Y (0/1)",
        defaultValue: "1",
        defaultSize: 14,
      },
      {
        key: "spore4_x",
        label: "Espora 4 X (%)",
        defaultValue: "72",
        defaultSize: 14,
      },
      {
        key: "spore4_y",
        label: "Espora 4 Y (%)",
        defaultValue: "84",
        defaultSize: 14,
      },
      {
        key: "spore4_size",
        label: "Espora 4 tamano",
        defaultValue: "7",
        defaultSize: 14,
      },
      {
        key: "spore4_rotate",
        label: "Espora 4 rotacion",
        defaultValue: "14",
        defaultSize: 14,
      },
      {
        key: "spore4_opacity",
        label: "Espora 4 opacidad (0-100)",
        defaultValue: "10",
        defaultSize: 14,
      },
      {
        key: "spore4_color",
        label: "Espora 4 color",
        defaultValue: "var(--complement-700)",
        defaultSize: 14,
      },
      {
        key: "spore4_flip_x",
        label: "Espora 4 flip X (0/1)",
        defaultValue: "1",
        defaultSize: 14,
      },
      {
        key: "spore4_flip_y",
        label: "Espora 4 flip Y (0/1)",
        defaultValue: "1",
        defaultSize: 14,
      },
    ],
  },
  "image-grid": {
    type: "image-grid",
    label: "Image Grid Section",
    fields: [
      {
        key: "item1",
        label: "Card 1 titulo",
        defaultValue: "Comunidad",
        defaultSize: 22,
      },
      {
        key: "item2",
        label: "Card 2 titulo",
        defaultValue: "Aprendizaje",
        defaultSize: 22,
      },
      {
        key: "item3",
        label: "Card 3 titulo",
        defaultValue: "Juego",
        defaultSize: 22,
      },
      {
        key: "item4",
        label: "Card 4 titulo",
        defaultValue: "Naturaleza",
        defaultSize: 22,
      },
      {
        key: "item5",
        label: "Card 5 titulo",
        defaultValue: "Vinculo",
        defaultSize: 22,
      },
      {
        key: "item6",
        label: "Card 6 titulo",
        defaultValue: "Exploracion",
        defaultSize: 22,
      },
      {
        key: "item7",
        label: "Card 7 titulo",
        defaultValue: "Curiosidad",
        defaultSize: 22,
      },
      {
        key: "item8",
        label: "Card 8 titulo",
        defaultValue: "Movimiento",
        defaultSize: 22,
      },
      {
        key: "item9",
        label: "Card 9 titulo",
        defaultValue: "Arte",
        defaultSize: 22,
      },
      {
        key: "item10",
        label: "Card 10 titulo",
        defaultValue: "Transformacion",
        defaultSize: 22,
      },
      {
        key: "item11",
        label: "Card 11 titulo",
        defaultValue: "Tribu",
        defaultSize: 22,
      },
      {
        key: "item12",
        label: "Card 12 titulo",
        defaultValue: "Presencia",
        defaultSize: 22,
      },
    ],
  },
  video: {
    type: "video",
    label: "Video Fullscreen",
    fields: [
      {
        key: "url",
        label: "URL video MP4",
        defaultValue: "/assets/vid1.mp4",
        defaultSize: 14,
      },
    ],
  },
  footer: {
    type: "footer",
    label: "Footer",
    fields: [],
  },
};

export const defaultLandingStructure: LandingSectionInstance[] = [
  { id: "hero-1", type: "hero", name: "Hero principal" },
  { id: "cards-1", type: "cards", name: "Pilares en cards" },
  { id: "story-1", type: "story", name: "Historia Koru" },
  { id: "gallery-1", type: "gallery", name: "Galeria" },
  { id: "video-1", type: "video", name: "Video Fullscreen" },
  { id: "footer-1", type: "footer", name: "Footer" },
];

export const defaultLandingBackgroundScopes: LandingBackgroundScope[] = [
  {
    id: "scope-default",
    name: "Fondo base",
    type: "none",
    visualMode: "color",
    color: "#ffffff",
    gradient: "linear-gradient(180deg,#ffffff 0%,#f8f8f8 100%)",
    heightVh: 1000,
  },
];

export function getSectionFieldKey(sectionId: string, fieldKey: string) {
  return `section.${sectionId}.${fieldKey}`;
}

export function getSectionExtrasKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__extras");
}

export function getSectionBackgroundImageKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__background_image");
}

export function getSectionBackgroundModeKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__background_mode");
}

export function getSectionBackgroundColorKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__background_color");
}

export function getSectionBackgroundGradientKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__background_gradient");
}

export function getSectionBackgroundZoomKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__background_zoom");
}

export function getSectionBackgroundPositionXKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__background_position_x");
}

export function getSectionBackgroundPositionYKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__background_position_y");
}

export function getSectionBorderWidthKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__border_width");
}

export function getSectionBorderColorKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__border_color");
}

export function getSectionBorderRadiusKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__border_radius");
}

export function getSectionBorderStyleKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__border_style");
}

export function getSectionFooterHeightKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__footer_height");
}

// Legacy alias to avoid breaking previously stored content keys.
export function getSectionFooterMinHeightKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__footer_min_height");
}

export function getSectionGalleryVariantKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__gallery_variant");
}

export function getSectionGalleryAutoplaySecondsKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__gallery_autoplay_seconds");
}

export function getSectionGalleryItemImageKey(
  sectionId: string,
  index: number,
) {
  return getSectionFieldKey(sectionId, `item${index}_image`);
}

export function getSectionGalleryItemCaptionModeKey(
  sectionId: string,
  index: number,
) {
  return getSectionFieldKey(sectionId, `item${index}_caption_mode`);
}

export function getSectionGalleryItemSubtitleKey(
  sectionId: string,
  index: number,
) {
  return getSectionFieldKey(sectionId, `item${index}_subtitle`);
}

export function getSectionGalleryCaptionContainerBackgroundKey(
  sectionId: string,
) {
  return getSectionFieldKey(sectionId, "__gallery_caption_container_bg");
}

export function getSectionGalleryCaptionContainerOpacityKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__gallery_caption_container_opacity");
}

export function getSectionGalleryCaptionContainerPaddingXKey(
  sectionId: string,
) {
  return getSectionFieldKey(sectionId, "__gallery_caption_container_padding_x");
}

export function getSectionGalleryCaptionContainerPaddingYKey(
  sectionId: string,
) {
  return getSectionFieldKey(sectionId, "__gallery_caption_container_padding_y");
}

export function getSectionGalleryGridImageShapeKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__gallery_grid_image_shape");
}

export function getSectionItemsOrderKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__items_order");
}

export function getSectionImageGridItemsCountKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__image_grid_items_count");
}

export function getSectionImageGridColumnsKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__image_grid_columns");
}

export function getSectionExtraTextKey(sectionId: string, extraId: string) {
  return getSectionFieldKey(sectionId, `extra.${extraId}.text`);
}

export function getSectionExtraPositionXKey(sectionId: string, extraId: string) {
  return getSectionFieldKey(sectionId, `extra.${extraId}.position_x`);
}

export function getSectionExtraPositionYKey(sectionId: string, extraId: string) {
  return getSectionFieldKey(sectionId, `extra.${extraId}.position_y`);
}

export type SectionResponsiveMode = "large" | "medium" | "tablet" | "mobile";

export function getSectionExtraResponsivePositionXKey(
  sectionId: string,
  extraId: string,
  mode: SectionResponsiveMode,
) {
  return getSectionFieldKey(sectionId, `extra.${extraId}.position_x_${mode}`);
}

export function getSectionExtraResponsivePositionYKey(
  sectionId: string,
  extraId: string,
  mode: SectionResponsiveMode,
) {
  return getSectionFieldKey(sectionId, `extra.${extraId}.position_y_${mode}`);
}

export function parseSectionExtraElements(
  textMap: LandingTextMap,
  sectionId: string,
): SectionExtraElement[] {
  const raw = textMap[getSectionExtrasKey(sectionId)];
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SectionExtraElement[];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        (item.type === "title" ||
          item.type === "text" ||
          item.type === "button" ||
          item.type === "image" ||
          item.type === "line-vertical" ||
          item.type === "line-horizontal"),
    );
  } catch {
    return [];
  }
}

export function parseSectionItemsOrder(
  textMap: LandingTextMap,
  sectionId: string,
): string[] {
  const raw = textMap[getSectionItemsOrderKey(sectionId)];
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}

export function parseLandingBackgroundScopes(
  textMap: LandingTextMap,
): LandingBackgroundScope[] {
  const raw = textMap[LANDING_BACKGROUND_SCOPES_KEY];
  if (!raw) {
    return defaultLandingBackgroundScopes;
  }

  try {
    const parsed = JSON.parse(raw) as LandingBackgroundScope[];
    const validated = parsed.filter(
      (entry) =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.name === "string" &&
        (entry.type === "none" || entry.type === "spore"),
    );

    if (validated.length === 0) {
      return defaultLandingBackgroundScopes;
    }

    return validated.map((entry) => ({
      id: entry.id,
      name: entry.name,
      type: entry.type,
      visualMode:
        entry.visualMode === "gradient" || entry.visualMode === "color"
          ? entry.visualMode
          : "color",
      color: typeof entry.color === "string" ? entry.color : "#ffffff",
      gradient:
        typeof entry.gradient === "string"
          ? entry.gradient
          : "linear-gradient(180deg,#ffffff 0%,#f8f8f8 100%)",
      heightVh:
        typeof entry.heightVh === "number" && Number.isFinite(entry.heightVh)
          ? Math.min(2000, Math.max(100, Math.round(entry.heightVh)))
          : 1000,
    }));
  } catch {
    return defaultLandingBackgroundScopes;
  }
}

function normalizeSectionScopeIds(
  structure: LandingSectionInstance[],
  scopes: LandingBackgroundScope[],
): LandingSectionInstance[] {
  const fallbackScopeId = scopes[0]?.id ?? "scope-default";
  const validScopeIds = new Set(scopes.map((scope) => scope.id));

  return structure.map((section) => ({
    ...section,
    scopeId:
      section.scopeId && validScopeIds.has(section.scopeId)
        ? section.scopeId
        : fallbackScopeId,
  }));
}

function ensureEditorialFeatureDuplicatedInStructure(
  structure: LandingSectionInstance[],
): LandingSectionInstance[] {
  const editorialSections = structure.filter(
    (section) => section.type === "editorial-feature",
  );
  if (editorialSections.length !== 1) {
    return structure;
  }

  const source = editorialSections[0];
  const preferredId = `${source.id}-copy`;
  const existingIds = new Set(structure.map((section) => section.id));
  const duplicateId = existingIds.has(preferredId)
    ? `${source.id}-copy-2`
    : preferredId;

  if (existingIds.has(duplicateId)) {
    return structure;
  }

  return [
    ...structure,
    {
      id: duplicateId,
      type: "editorial-feature",
      name: `${source.name} copia`,
      scopeId: source.scopeId,
    },
  ];
}

export function getDefaultLandingTextMap(
  structure: LandingSectionInstance[] = defaultLandingStructure,
): LandingTextMap {
  const normalizedStructure = normalizeSectionScopeIds(
    structure,
    defaultLandingBackgroundScopes,
  );
  const textMap: LandingTextMap = {
    [LANDING_STRUCTURE_KEY]: JSON.stringify(normalizedStructure),
    [LANDING_BACKGROUND_SCOPES_KEY]: JSON.stringify(
      defaultLandingBackgroundScopes,
    ),
    [LANDING_LAYOUT_PADDING_X_KEY]: "24",
    [LANDING_LAYOUT_NAV_BG_KEY]: "#ffffff",
    [LANDING_LAYOUT_NAV_TEXT_KEY]: "#111111",
    [LANDING_LAYOUT_NAV_HEIGHT_KEY]: "96",
    [LANDING_LAYOUT_NAV_LOGO_SRC_KEY]: "/branding/koru-logo.png",
    [LANDING_LAYOUT_NAV_LOGO_ALT_KEY]: "Koru",
    [LANDING_LAYOUT_NAV_LINKS_KEY]: JSON.stringify(getDefaultLayoutNavLinks()),
    [LANDING_LAYOUT_NAV_LINK1_LABEL_KEY]: "Quienes somos",
    [LANDING_LAYOUT_NAV_LINK1_HREF_KEY]: "/quienes-somos",
    [LANDING_LAYOUT_NAV_LINK2_LABEL_KEY]: "Como acompanamos",
    [LANDING_LAYOUT_NAV_LINK2_HREF_KEY]: "/como-acompanamos",
    [LANDING_LAYOUT_NAV_LINK3_LABEL_KEY]: "Comunidad",
    [LANDING_LAYOUT_NAV_LINK3_HREF_KEY]: "/comunidad",
    [LANDING_LAYOUT_NAV_LINK4_LABEL_KEY]: "Escuela para familias",
    [LANDING_LAYOUT_NAV_LINK4_HREF_KEY]: "/family-dashboard",
    [LANDING_LAYOUT_NAV_LINK5_LABEL_KEY]: "Admisiones",
    [LANDING_LAYOUT_NAV_LINK5_HREF_KEY]: "/admisiones",
    [LANDING_LAYOUT_NAV_LINK6_LABEL_KEY]: "Log In",
    [LANDING_LAYOUT_NAV_LINK6_HREF_KEY]: "/sign-in",
    [LANDING_LAYOUT_FOOTER_BG_KEY]: "#d8cfb6",
    [LANDING_LAYOUT_FOOTER_TEXT_KEY]: "Koru OSA",
    [LANDING_LAYOUT_FOOTER_HEIGHT_KEY]: "220",
  };

  for (const section of normalizedStructure) {
    const def = landingSectionCatalog[section.type];
    for (const field of def.fields) {
      const key = getSectionFieldKey(section.id, field.key);
      textMap[key] = field.defaultValue;
      textMap[getLandingFieldSizeKey(key)] = String(field.defaultSize);
    }
  }

  return textMap;
}

export function parseLandingStructure(
  textMap: LandingTextMap,
): LandingSectionInstance[] {
  const scopes = parseLandingBackgroundScopes(textMap);
  const raw = textMap[LANDING_STRUCTURE_KEY];
  if (!raw) {
    return normalizeSectionScopeIds(defaultLandingStructure, scopes);
  }

  try {
    const parsed = JSON.parse(raw) as LandingSectionInstance[];
    const validated = parsed.filter(
      (entry) =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.name === "string" &&
        typeof entry.type === "string" &&
        entry.type in landingSectionCatalog,
    );

    const parsedStructure =
      validated.length > 0 ? validated : defaultLandingStructure;
    return normalizeSectionScopeIds(
      ensureEditorialFeatureDuplicatedInStructure(parsedStructure),
      scopes,
    );
  } catch {
    return normalizeSectionScopeIds(
      ensureEditorialFeatureDuplicatedInStructure(defaultLandingStructure),
      scopes,
    );
  }
}

export function ensureLandingDefaults(textMap: LandingTextMap): LandingTextMap {
  const scopes = parseLandingBackgroundScopes(textMap);
  const structure = parseLandingStructure(textMap);
  const defaults = getDefaultLandingTextMap(structure);
  const next: LandingTextMap = {
    ...defaults,
    ...textMap,
    [LANDING_BACKGROUND_SCOPES_KEY]: JSON.stringify(scopes),
    [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
  };

  const editorialSections = structure.filter(
    (section) => section.type === "editorial-feature",
  );
  if (editorialSections.length >= 2) {
    const source = editorialSections[0];
    const duplicate = editorialSections[1];
    const sourcePrefix = `section.${source.id}.`;
    const duplicatePrefix = `section.${duplicate.id}.`;

    for (const [key, value] of Object.entries(next)) {
      if (!key.startsWith(sourcePrefix)) {
        continue;
      }
      const duplicateKey = `${duplicatePrefix}${key.slice(sourcePrefix.length)}`;
      if (textMap[duplicateKey] == null || textMap[duplicateKey] === "") {
        next[duplicateKey] = value;
      }
    }
  }

  return next;
}

