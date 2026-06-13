import type { CSSProperties } from "react";

import {
  getSectionFieldKey,
  landingSectionCatalog,
  parseLandingStructure,
  type LandingSectionField,
} from "@/modules/landing/config/landing-sections";
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

export const landingContentTextAlignKey = (slotId: string) =>
  `${slotId}__text_align`;

export const landingContentSlotIds = {
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
    id: landingContentSlotIds.visionTitle,
    label: "Bienvenida / Titulo",
    selectorLabel: "Bienvenida / Titulo",
    defaultValue: "Bienvenidos a Koru",
    defaultSize: 64,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.visionBodyOne,
    label: "Bienvenida / Parrafo 1",
    selectorLabel: "Bienvenida / P1",
    defaultValue:
      "Co-creamos una cultura viva donde ni?as, ni?os, familias y acompa?antes asumen un rol activo y corresponsable en los procesos de aprendizaje y desarrollo.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.visionBodyTwo,
    label: "Bienvenida / Parrafo 2",
    selectorLabel: "Bienvenida / P2",
    defaultValue:
      "Queremos una comunidad donde cada persona fortalezca su br?jula interna, despliegue sus dones y participe conscientemente en la regeneraci?n social y ecol?gica.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialOneTitle,
    label: "Diferentes / Titulo superior",
    selectorLabel: "Diferentes / Titulo",
    defaultValue: "Qu? nos hace diferentes",
    defaultSize: 42,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.editorialOneBody,
    label: "Diferentes / Parrafo",
    selectorLabel: "Diferentes / Parrafo",
    defaultValue:
      "Creemos que la educaci?n es un proceso compartido. Ni?as, ni?os, familias y colaboradores formamos un mismo organismo, donde cada parte influye en el desarrollo individual y colectivo.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialOneHighlight,
    label: "Diferentes / Destacado",
    selectorLabel: "Diferentes / Destacado",
    defaultValue:
      "Por eso, el acompa?amiento no ocurre s?lo dentro del espacio educativo, sino tambi?n en casa y en la relaci?n cotidiana.",
    defaultSize: 28,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "weight", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialOneClosing,
    label: "Diferentes / Cierre",
    selectorLabel: "Diferentes / Cierre",
    defaultValue:
      "Ser parte de esta comunidad implica una participaci?n activa y comprometida. Ser parte de este espacio implica formar parte de una comunidad que aprende, se cuestiona y evoluciona.",
    defaultSize: 18,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialTwoTitle,
    label: "Enfoque / Titulo superior",
    selectorLabel: "Enfoque / Titulo",
    defaultValue: "Breve explicaci?n del enfoque",
    defaultSize: 42,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.editorialTwoBody,
    label: "Enfoque / Parrafo",
    selectorLabel: "Enfoque / Parrafo",
    defaultValue:
      "Koru propone un enfoque pedag?gico integral que combina mirada antropos?fica, inteligencia socioemocional, aprendizaje transdisciplinario por proyectos y habilidades del siglo XXI.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialTwoHighlight,
    label: "Enfoque / Destacado",
    selectorLabel: "Enfoque / Destacado",
    defaultValue:
      "Las ni?as y los ni?os aprenden a partir de experiencias significativas conectadas con sus intereses.",
    defaultSize: 28,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "weight", "lineHeight"],
  },
  {
    id: landingContentSlotIds.editorialTwoClosing,
    label: "Enfoque / Cierre",
    selectorLabel: "Enfoque / Cierre",
    defaultValue:
      "Acompa?amos cada proceso de forma personalizada, cultivando capacidades cognitivas, emocionales, sociales y pr?cticas en comunidad y en v?nculo con la naturaleza.",
    defaultSize: 18,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: landingContentSlotIds.quoteText,
    label: "Testimonio / Frase",
    selectorLabel: "Testimonio / Frase",
    defaultValue:
      "Koru ha sido m?gico para nuestra hija. Su creatividad, su bondad y su curiosidad por el mundo florecen cada d?a. La vemos crecer en su mejor versi?n.",
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
    label: "CTA admisiones / Titulo",
    selectorLabel: "CTA / Titulo",
    defaultValue: "?Te interesa aplicar a Koru?",
    defaultSize: 64,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: landingContentSlotIds.admissionsButton,
    label: "CTA admisiones / Boton",
    selectorLabel: "CTA / Boton",
    defaultValue: "Ir a admisiones",
    defaultSize: 16,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
];

function isContentField(field: LandingSectionField) {
  if (field.defaultValue.trim() === "") {
    return false;
  }

  if (
    field.key.includes("image") ||
    field.key.includes("url") ||
    field.key.includes("spore") ||
    field.key.includes("position") ||
    field.key.includes("opacity") ||
    field.key.includes("rotate") ||
    field.key.includes("flip") ||
    field.key.includes("size") ||
    field.key.includes("color")
  ) {
    return false;
  }

  return true;
}

export function getLandingContentSlots(textMap: LandingTextMap) {
  const structureSlots = parseLandingStructure(textMap).flatMap((section) => {
    const definition = landingSectionCatalog[section.type];
    return definition.fields.filter(isContentField).map((field) => ({
      id: getSectionFieldKey(section.id, field.key),
      label: `${section.name} / ${field.label}`,
      selectorLabel: `${section.name} / ${field.label}`,
      defaultValue: field.defaultValue,
      defaultSize: field.defaultSize,
      multiline: field.multiline,
      styleControls: [
        "font",
        "size",
        "color",
        "align",
        "weight",
        "lineHeight",
      ] as LandingContentSlotStyleControl[],
    }));
  });

  return [...structureSlots, ...hardcodedLandingContentSlots];
}

export function getLandingContentSlotValue(
  textMap: LandingTextMap,
  slot: LandingContentSlot,
) {
  return textMap[slot.id] ?? slot.defaultValue;
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
