import { getLandingFieldSizeKey, type LandingTextMap } from "@/modules/landing/types/landing-text";

export const LANDING_STRUCTURE_KEY = "__landing_structure";

export type LandingSectionType =
  | "hero"
  | "cards"
  | "story"
  | "gallery"
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
};

export const landingSectionCatalog: Record<
  LandingSectionType,
  LandingSectionTypeDefinition
> = {
  hero: {
    type: "hero",
    label: "Hero",
    fields: [
      { key: "kicker", label: "Kicker", defaultValue: "BIENVENID@S A KORU OSA", defaultSize: 12 },
      {
        key: "title",
        label: "Titulo",
        defaultValue: "En Koru, entendemos la educacion como un organismo vivo.",
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
      { key: "cta", label: "Texto boton", defaultValue: "Make a donation", defaultSize: 14 },
    ],
  },
  cards: {
    type: "cards",
    label: "Cards Section",
    fields: [
      { key: "kicker", label: "Kicker", defaultValue: "NUESTRA MIRADA", defaultSize: 12 },
      {
        key: "title",
        label: "Titulo",
        defaultValue: "Pedagogias alternativas, crianza consciente y comunidad.",
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
      { key: "card1_title", label: "Card 1 titulo", defaultValue: "Ritmo Propio", defaultSize: 30 },
      {
        key: "card1_body",
        label: "Card 1 texto",
        defaultValue: "Acompanamos procesos individuales con calma, juego y curiosidad.",
        defaultSize: 18,
        multiline: true,
      },
      { key: "card2_title", label: "Card 2 titulo", defaultValue: "Comunidad Viva", defaultSize: 30 },
      {
        key: "card2_body",
        label: "Card 2 texto",
        defaultValue: "Aprender con otr@s nos ensena cuidado mutuo y autonomia.",
        defaultSize: 18,
        multiline: true,
      },
      { key: "card3_title", label: "Card 3 titulo", defaultValue: "Transformacion", defaultSize: 30 },
      {
        key: "card3_body",
        label: "Card 3 texto",
        defaultValue: "Cada experiencia deja huella y abre nuevas posibilidades.",
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
      { key: "title", label: "Titulo", defaultValue: "Galeria de experiencias", defaultSize: 40 },
      {
        key: "body",
        label: "Descripcion",
        defaultValue: "Momentos de juego, exploracion y aprendizaje compartido.",
        defaultSize: 18,
      },
      { key: "item1", label: "Item 1", defaultValue: "Exploracion sensorial", defaultSize: 18 },
      { key: "item2", label: "Item 2", defaultValue: "Arte en comunidad", defaultSize: 18 },
      { key: "item3", label: "Item 3", defaultValue: "Huerta y naturaleza", defaultSize: 18 },
      { key: "item4", label: "Item 4", defaultValue: "Rondas de palabra", defaultSize: 18 },
    ],
  },
  video: {
    type: "video",
    label: "Video Section",
    fields: [
      { key: "title", label: "Titulo", defaultValue: "Conoce nuestra propuesta", defaultSize: 40 },
      {
        key: "body",
        label: "Descripcion",
        defaultValue: "Una mirada breve sobre como se vive Koru por dentro.",
        defaultSize: 18,
      },
      {
        key: "url",
        label: "URL video embed",
        defaultValue: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        defaultSize: 14,
      },
    ],
  },
  footer: {
    type: "footer",
    label: "Footer",
    fields: [
      { key: "brand", label: "Marca", defaultValue: "Koru", defaultSize: 38 },
      { key: "campus", label: "Titulo campus", defaultValue: "Campus Koru", defaultSize: 38 },
      { key: "mail", label: "Email", defaultValue: "hola@koru.academy", defaultSize: 24 },
      {
        key: "legal",
        label: "Texto legal",
        defaultValue: "(c) 2026 Koru - Organismo Social de Aprendizaje",
        defaultSize: 20,
      },
    ],
  },
};

export const defaultLandingStructure: LandingSectionInstance[] = [
  { id: "hero-1", type: "hero", name: "Hero principal" },
  { id: "cards-1", type: "cards", name: "Pilares en cards" },
  { id: "story-1", type: "story", name: "Historia Koru" },
  { id: "gallery-1", type: "gallery", name: "Galeria" },
  { id: "video-1", type: "video", name: "Video" },
  { id: "footer-1", type: "footer", name: "Footer" },
];

export function getSectionFieldKey(sectionId: string, fieldKey: string) {
  return `section.${sectionId}.${fieldKey}`;
}

export function getDefaultLandingTextMap(
  structure: LandingSectionInstance[] = defaultLandingStructure,
): LandingTextMap {
  const textMap: LandingTextMap = {
    [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
  };

  for (const section of structure) {
    const def = landingSectionCatalog[section.type];
    for (const field of def.fields) {
      const key = getSectionFieldKey(section.id, field.key);
      textMap[key] = field.defaultValue;
      textMap[getLandingFieldSizeKey(key)] = String(field.defaultSize);
    }
  }

  return textMap;
}

export function parseLandingStructure(textMap: LandingTextMap): LandingSectionInstance[] {
  const raw = textMap[LANDING_STRUCTURE_KEY];
  if (!raw) {
    return defaultLandingStructure;
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

    return validated.length > 0 ? validated : defaultLandingStructure;
  } catch {
    return defaultLandingStructure;
  }
}

export function ensureLandingDefaults(textMap: LandingTextMap): LandingTextMap {
  const structure = parseLandingStructure(textMap);
  const defaults = getDefaultLandingTextMap(structure);
  return {
    ...defaults,
    ...textMap,
    [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
  };
}
