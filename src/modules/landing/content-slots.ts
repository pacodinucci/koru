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
  multiline?: boolean;
  styleControls: LandingContentSlotStyleControl[];
};


const landingContentTextRepairs: Array<[string, string]> = [
  ["\u00c3\u00b1", "\u00f1"],
  ["\u00c3\u00a1", "\u00e1"],
  ["\u00c3\u00a9", "\u00e9"],
  ["\u00c3\u00ad", "\u00ed"],
  ["\u00c3\u00b3", "\u00f3"],
  ["\u00c3\u00ba", "\u00fa"],
  ["\u00c2\u00bf", "\u00bf"],
  ["T?tulo", "T\u00edtulo"],
  ["P?rrafo", "P\u00e1rrafo"],
  ["Bot?n", "Bot\u00f3n"],
  ["Tama?o", "Tama\u00f1o"],
  ["Alineaci?n", "Alineaci\u00f3n"],
  ["ni?as", "ni\u00f1as"],
  ["Ni?as", "Ni\u00f1as"],
  ["ni?os", "ni\u00f1os"],
  ["Ni?os", "Ni\u00f1os"],
  ["acompa?antes", "acompa\u00f1antes"],
  ["acompa?amiento", "acompa\u00f1amiento"],
  ["Acompa?amos", "Acompa\u00f1amos"],
  ["educaci?n", "educaci\u00f3n"],
  ["relaci?n", "relaci\u00f3n"],
  ["participaci?n", "participaci\u00f3n"],
  ["explicaci?n", "explicaci\u00f3n"],
  ["pedag?gico", "pedag\u00f3gico"],
  ["antrop?sica", "antropos\u00f3fica"],
  ["antropos?fica", "antropos\u00f3fica"],
  ["ecol?gica", "ecol\u00f3gica"],
  ["versi?n", "versi\u00f3n"],
  ["d?a", "d\u00eda"],
  ["Qu?", "Qu\u00e9"],
  ["br?jula", "br\u00fajula"],
  ["s?lo", "s\u00f3lo"],
  ["tambi?n", "tambi\u00e9n"],
  ["pr?cticas", "pr\u00e1cticas"],
  ["v?nculo", "v\u00ednculo"],
  ["m?gico", "m\u00e1gico"],
  ["?Te interesa aplicar a Koru?", "\u00bfTe interesa aplicar a Koru?"],
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
  quoteText: "content.landing.quote.text",
  quoteAuthor: "content.landing.quote.author",
  admissionsTitle: "content.landing.admissions.title",
  admissionsButton: "content.landing.admissions.button",
} as const;

export const hardcodedLandingContentSlots: LandingContentSlot[] = [
  {
    id: landingContentSlotIds.heroVideoText,
    label: "Hero / Frase principal",
    selectorLabel: "Hero / Frase",
    defaultValue:
      "Una comunidad viva donde niñas, niños, familias y acompañantes co-creamos una nueva forma de educar.",
    defaultSize: 56,
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
    id: landingContentSlotIds.quoteText,
    label: "Testimonio / Frase",
    selectorLabel: "Testimonio / Frase",
    defaultValue:
      "Koru ha sido mágico para nuestra hija. Su creatividad, su bondad y su curiosidad por el mundo florecen cada día. La vemos crecer en su mejor versión.",
    defaultSize: 44,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.quoteAuthor,
    label: "Testimonio / Autor",
    selectorLabel: "Testimonio / Autor",
    defaultValue: "Tutor de Koru",
    defaultSize: 20,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.admissionsTitle,
    label: "CTA admisiones / Título",
    selectorLabel: "CTA / Título",
    defaultValue: "¿Te interesa aplicar a Koru?",
    defaultSize: 64,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.admissionsButton,
    label: "CTA admisiones / Botón",
    selectorLabel: "CTA / Botón",
    defaultValue: "Ir a admisiones",
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
  if (fontFamily === "nunito") {
    return 'var(--font-nunito), "Segoe UI", sans-serif';
  }
  return '"Fira Sans", "Segoe UI", sans-serif';
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
    fontSize: `${getLandingFieldFontSize(
      textMap,
      slot.id,
      slot.defaultSize,
      responsiveMode,
    )}px`,
    ...(fontFamily ? { fontFamily: getFontFamilyStyleValue(fontFamily) } : null),
    ...(fontWeight ? { fontWeight } : null),
    ...(lineHeight ? { lineHeight } : null),
    ...(letterSpacing != null ? { letterSpacing: `${letterSpacing}px` } : null),
    ...(color ? { color } : null),
    ...(align === "left" || align === "center" || align === "right"
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
