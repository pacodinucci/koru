import type { CSSProperties } from "react";

import {
  getLandingFieldColor,
  getLandingFieldFontFamily,
  getLandingFieldFontSize,
  getLandingFieldFontWeight,
  getLandingFieldLetterSpacing,
  getLandingFieldLineHeight,
  getLandingFieldSizeKey,
  getLandingFieldColorKey,
  getLandingFieldFontFamilyKey,
  getLandingFieldFontWeightKey,
  getLandingFieldLineHeightKey,
  getLandingFieldLetterSpacingKey,
  getLandingFieldResponsiveSizeKey,
  type LandingFontFamily,
  type LandingResponsiveMode,
  type LandingTextMap,
} from "@/modules/landing/types/landing-text";

export type LandingContentSlotStyleControl =
  | "font"
  | "size"
  | "color"
  | "align"
  | "weight"
  | "lineHeight"
  | "letterSpacing";

export type LandingContentSlot = {
  id: string;
  label: string;
  selectorLabel: string;
  defaultValue: string;
  defaultSize: number;
  responsiveDefaultSizes?: Partial<Record<LandingResponsiveMode, number>>;
  multiline?: boolean;
  styleControls: LandingContentSlotStyleControl[];
};

const latin1Sequence = (...codes: number[]) => String.fromCharCode(...codes);
const unknownAccent = (left: string, right: string) => `${left}?${right}`;

const landingContentTextRepairs: Array<[string, string]> = [
  [latin1Sequence(195, 177), "ñ"],
  [latin1Sequence(195, 161), "á"],
  [latin1Sequence(195, 169), "é"],
  [latin1Sequence(195, 173), "í"],
  [latin1Sequence(195, 179), "ó"],
  [latin1Sequence(195, 186), "ú"],
  [latin1Sequence(194, 191), "¿"],
  [unknownAccent("T", "tulo"), "Título"],
  [unknownAccent("P", "rrafo"), "Párrafo"],
  [unknownAccent("Bot", "n"), "Botón"],
  [unknownAccent("Tama", "o"), "Tamaño"],
  [unknownAccent("Alineaci", "n"), "Alineación"],
  [unknownAccent("ni", "as"), "niñas"],
  [unknownAccent("Ni", "as"), "Niñas"],
  [unknownAccent("ni", "os"), "niños"],
  [unknownAccent("Ni", "os"), "Niños"],
  [unknownAccent("acompa", "antes"), "acompañantes"],
  [unknownAccent("acompa", "amiento"), "acompañamiento"],
  [unknownAccent("Acompa", "amos"), "Acompañamos"],
  [unknownAccent("educaci", "n"), "educación"],
  [unknownAccent("relaci", "n"), "relación"],
  [unknownAccent("participaci", "n"), "participación"],
  [unknownAccent("explicaci", "n"), "explicación"],
  [unknownAccent("pedag", "gico"), "pedagógico"],
  [unknownAccent("antrop", "sica"), "antroposófica"],
  [unknownAccent("antropos", "fica"), "antroposófica"],
  [unknownAccent("ecol", "gica"), "ecológica"],
  [unknownAccent("versi", "n"), "versión"],
  [unknownAccent("d", "a"), "día"],
  [unknownAccent("Qu", ""), "Qué"],
  [unknownAccent("br", "jula"), "brújula"],
  [unknownAccent("s", "lo"), "sólo"],
  [unknownAccent("tambi", "n"), "también"],
  [unknownAccent("pr", "cticas"), "prácticas"],
  [unknownAccent("v", "nculo"), "vínculo"],
  [unknownAccent("acompa", "ada"), "acompañada"],
  [unknownAccent("acompa", "a"), "acompaña"],
  [unknownAccent("c", "mo"), "cómo"],
  [unknownAccent("m", "s"), "más"],
  [unknownAccent("aut", "ntico"), "auténtico"],
  [unknownAccent("v", "nculos"), "vínculos"],
  [unknownAccent("m", "gico"), "mágico"],
  [unknownAccent("", "Te interesa aplicar a Koru?"), "¿Te interesa aplicar a Koru?"],
];

export function repairLandingContentText(value: string) {
  return landingContentTextRepairs.reduce(
    (nextValue, [broken, repaired]) => nextValue.replaceAll(broken, repaired),
    value,
  );
}

export const landingContentTextAlignKey = (slotId: string) =>
  `${slotId}__text_align`;

export const landingContentSlotIds = {
  heroVideoText: "content.landing.hero.video.text",
  visionTitle: "content.landing.vision.title",
  visionBodyOne: "content.landing.vision.body.one",
  visionBodyTwo: "content.landing.vision.body.two",
  editorialOneTitle: "content.landing.editorial.one.title",
  editorialOneBody: "content.landing.editorial.one.body",
  editorialOneHighlight: "content.landing.editorial.one.highlight",
  editorialOneClosing: "content.landing.editorial.one.closing",
  editorialTwoTitle: "content.landing.editorial.two.title",
  editorialTwoBody: "content.landing.editorial.two.body",
  editorialTwoHighlight: "content.landing.editorial.two.highlight",
  editorialTwoClosing: "content.landing.editorial.two.closing",
  editorialOneImageCaption: "content.landing.editorial.one.image.caption",
  editorialTwoImageCaption: "content.landing.editorial.two.image.caption",
  quoteText: "content.landing.quote.text",
  testimonialOneText: "content.landing.testimonials.one.text",
  testimonialOneName: "content.landing.testimonials.one.name",
  testimonialTwoText: "content.landing.testimonials.two.text",
  testimonialTwoName: "content.landing.testimonials.two.name",
  testimonialThreeText: "content.landing.testimonials.three.text",
  testimonialThreeName: "content.landing.testimonials.three.name",
  testimonialFourText: "content.landing.testimonials.four.text",
  testimonialFourName: "content.landing.testimonials.four.name",
  testimonialFiveText: "content.landing.testimonials.five.text",
  testimonialFiveName: "content.landing.testimonials.five.name",
} as const;

export const landingHeroVideoTextResponsiveDefaultSizes: Partial<
  Record<LandingResponsiveMode, number>
> = {
  tablet: 48,
  mobile: 36,
};

export const hardcodedLandingContentSlots: LandingContentSlot[] = [
  {
    id: landingContentSlotIds.heroVideoText,
    label: "Hero / Frase principal",
    selectorLabel: "Hero / Frase",
    defaultValue:
      "Imaginamos un mundo donde cada persona pueda descubrir su don y utilizarlo para generar un impacto positivo.",
    defaultSize: 56,
    responsiveDefaultSizes: landingHeroVideoTextResponsiveDefaultSizes,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "weight", "lineHeight"],
  },
  {
    id: landingContentSlotIds.visionTitle,
    label: "Bienvenida / Título",
    selectorLabel: "Bienvenida / Título",
    defaultValue: "Bienvenidos a Koru",
    defaultSize: 64,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.visionBodyOne,
    label: "Bienvenida / Párrafo 1",
    selectorLabel: "Bienvenida / P1",
    defaultValue:
      "Co-creamos una cultura viva donde niñas, niños, familias y acompañantes asumen un rol activo y corresponsable en los procesos de aprendizaje y desarrollo.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.visionBodyTwo,
    label: "Bienvenida / Párrafo 2",
    selectorLabel: "Bienvenida / P2",
    defaultValue:
      "Queremos una comunidad donde cada persona fortalezca su brújula interna, despliegue sus dones y participe conscientemente en la regeneración social y ecológica.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialOneTitle,
    label: "Diferentes / Título superior",
    selectorLabel: "Diferentes / Título",
    defaultValue: "Qué nos hace diferentes",
    defaultSize: 42,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.editorialOneBody,
    label: "Diferentes / Párrafo",
    selectorLabel: "Diferentes / Párrafo",
    defaultValue:
      "Creemos que la educación es un proceso compartido. Niñas, niños, familias y colaboradores formamos un mismo organismo, donde cada parte influye en el desarrollo individual y colectivo.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialOneHighlight,
    label: "Diferentes / Destacado",
    selectorLabel: "Diferentes / Destacado",
    defaultValue:
      "Por eso, el acompañamiento no ocurre sólo dentro del espacio educativo, sino también en casa y en la relación cotidiana.",
    defaultSize: 28,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "weight", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialOneClosing,
    label: "Diferentes / Cierre",
    selectorLabel: "Diferentes / Cierre",
    defaultValue:
      "Ser parte de esta comunidad implica una participación activa y comprometida. Ser parte de este espacio implica formar parte de una comunidad que aprende, se cuestiona y evoluciona.",
    defaultSize: 18,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialTwoTitle,
    label: "Enfoque / Título superior",
    selectorLabel: "Enfoque / Título",
    defaultValue: "Breve explicación del enfoque",
    defaultSize: 42,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.editorialTwoBody,
    label: "Enfoque / Párrafo",
    selectorLabel: "Enfoque / Párrafo",
    defaultValue:
      "Koru propone un enfoque pedagógico integral que combina mirada antroposófica, inteligencia socioemocional, aprendizaje transdisciplinario por proyectos y habilidades del siglo XXI.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialTwoHighlight,
    label: "Enfoque / Destacado",
    selectorLabel: "Enfoque / Destacado",
    defaultValue:
      "Las niñas y los niños aprenden a partir de experiencias significativas conectadas con sus intereses.",
    defaultSize: 28,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "weight", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialTwoClosing,
    label: "Enfoque / Cierre",
    selectorLabel: "Enfoque / Cierre",
    defaultValue:
      "Acompañamos cada proceso de forma personalizada, cultivando capacidades cognitivas, emocionales, sociales y prácticas en comunidad y en vínculo con la naturaleza.",
    defaultSize: 18,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialOneImageCaption,
    label: "Diferentes / Texto bajo imagen",
    selectorLabel: "Diferentes / Imagen texto",
    defaultValue: "Una comunidad que aprende unida, crece unida.",
    defaultSize: 18,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialTwoImageCaption,
    label: "Enfoque / Texto bajo imagen",
    selectorLabel: "Enfoque / Imagen texto",
    defaultValue: "Cada experiencia abre una nueva forma de aprender.",
    defaultSize: 18,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.quoteText,
    label: "Frase destacada",
    selectorLabel: "Frase destacada",
    defaultValue:
      "Koru ha sido mágico para nuestra hija. Su creatividad, su bondad y su curiosidad por el mundo florecen cada día. La vemos crecer en su mejor versión.",
    defaultSize: 44,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.testimonialOneText,
    label: "Testimonio 1 / Texto",
    selectorLabel: "Testimonio 1 / Texto",
    defaultValue:
      "En Koru encontramos un espacio donde nuestra hija se siente mirada, escuchada y acompañada en su propio ritmo.",
    defaultSize: 22,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.testimonialOneName,
    label: "Testimonio 1 / Nombre",
    selectorLabel: "Testimonio 1 / Nombre",
    defaultValue: "Familia Koru",
    defaultSize: 16,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.testimonialTwoText,
    label: "Testimonio 2 / Texto",
    selectorLabel: "Testimonio 2 / Texto",
    defaultValue:
      "Valoramos profundamente la forma en que el equipo acompaña cada proceso con sensibilidad, presencia y respeto.",
    defaultSize: 22,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.testimonialTwoName,
    label: "Testimonio 2 / Nombre",
    selectorLabel: "Testimonio 2 / Nombre",
    defaultValue: "Familia Koru",
    defaultSize: 16,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.testimonialThreeText,
    label: "Testimonio 3 / Texto",
    selectorLabel: "Testimonio 3 / Texto",
    defaultValue:
      "Sentimos que Koru no sólo acompaña a los chicos: también nos invita a crecer como familia y como comunidad.",
    defaultSize: 22,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.testimonialThreeName,
    label: "Testimonio 3 / Nombre",
    selectorLabel: "Testimonio 3 / Nombre",
    defaultValue: "Familia Koru",
    defaultSize: 16,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.testimonialFourText,
    label: "Testimonio 4 / Texto",
    selectorLabel: "Testimonio 4 / Texto",
    defaultValue:
      "Cada día vemos cómo nuestros hijos se animan a explorar, preguntar y compartir desde un lugar más auténtico.",
    defaultSize: 22,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.testimonialFourName,
    label: "Testimonio 4 / Nombre",
    selectorLabel: "Testimonio 4 / Nombre",
    defaultValue: "Familia Koru",
    defaultSize: 16,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.testimonialFiveText,
    label: "Testimonio 5 / Texto",
    selectorLabel: "Testimonio 5 / Texto",
    defaultValue:
      "Nos emociona ser parte de una comunidad que cuida los vínculos y acompaña el aprendizaje con tanto compromiso.",
    defaultSize: 22,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.testimonialFiveName,
    label: "Testimonio 5 / Nombre",
    selectorLabel: "Testimonio 5 / Nombre",
    defaultValue: "Familia Koru",
    defaultSize: 16,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
];

export function getLandingContentSlots() {
  return hardcodedLandingContentSlots.map((slot) => ({
    ...slot,
    label: repairLandingContentText(slot.label),
    selectorLabel: repairLandingContentText(slot.selectorLabel),
    defaultValue: repairLandingContentText(slot.defaultValue),
  }));
}

export function getLandingContentSlotValue(
  textMap: LandingTextMap,
  slot: LandingContentSlot,
) {
  return repairLandingContentText(textMap[slot.id] ?? slot.defaultValue);
}

function getFontFamilyStyleValue(fontFamily: LandingFontFamily) {
  if (fontFamily === "montserrat") {
    return 'var(--font-montserrat), "Segoe UI", sans-serif';
  }
  if (fontFamily === "indie-flower") {
    return 'var(--font-indie-flower), "Segoe UI", cursive';
  }
  return 'var(--font-roboto-condensed), "Arial Narrow", sans-serif';
}

function getLandingContentSlotFontSize(
  textMap: LandingTextMap,
  slot: LandingContentSlot,
  responsiveMode?: LandingResponsiveMode,
) {
  const mode = responsiveMode ?? "large";
  const explicitResponsiveSize =
    textMap[getLandingFieldResponsiveSizeKey(slot.id, mode)]?.trim();

  if (explicitResponsiveSize) {
    return getLandingFieldFontSize(textMap, slot.id, slot.defaultSize, mode);
  }

  const baseSize = getLandingFieldFontSize(textMap, slot.id, slot.defaultSize);
  const responsiveDefaultSize = slot.responsiveDefaultSizes?.[mode];

  if (responsiveDefaultSize == null) {
    return baseSize;
  }

  return Math.min(baseSize, responsiveDefaultSize);
}

export function getLandingContentSlotStyle(
  textMap: LandingTextMap,
  slot: LandingContentSlot,
  responsiveMode?: LandingResponsiveMode,
): CSSProperties {
  const fontFamily = getLandingFieldFontFamily(textMap, slot.id);
  const fontWeight = getLandingFieldFontWeight(textMap, slot.id);
  const lineHeight = getLandingFieldLineHeight(textMap, slot.id);
  const letterSpacing = getLandingFieldLetterSpacing(textMap, slot.id);
  const color = getLandingFieldColor(textMap, slot.id);
  const align = textMap[landingContentTextAlignKey(slot.id)];

  return {
    fontSize: `${getLandingContentSlotFontSize(
      textMap,
      slot,
      responsiveMode,
    )}px`,
    ...(fontFamily
      ? { fontFamily: getFontFamilyStyleValue(fontFamily) }
      : null),
    ...(fontWeight ? { fontWeight } : null),
    ...(lineHeight ? { lineHeight } : null),
    ...(letterSpacing != null ? { letterSpacing: `${letterSpacing}px` } : null),
    ...(color ? { color } : null),
    ...(align === "left" || align === "center" || align === "right" || align === "justify"
      ? { textAlign: align }
      : null),
  };
}

export function getLandingContentSlotStyleKeys(slotId: string) {
  return {
    size: getLandingFieldSizeKey(slotId),
    color: getLandingFieldColorKey(slotId),
    fontFamily: getLandingFieldFontFamilyKey(slotId),
    fontWeight: getLandingFieldFontWeightKey(slotId),
    lineHeight: getLandingFieldLineHeightKey(slotId),
    letterSpacing: getLandingFieldLetterSpacingKey(slotId),
    align: landingContentTextAlignKey(slotId),
  };
}
