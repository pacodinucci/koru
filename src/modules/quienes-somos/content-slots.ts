import {
  repairLandingContentText,
  type LandingContentSlot,
} from "@/modules/landing/content-slots";

export const quienesSomosContentSlotIds = {
  heroEyebrow: "content.quienes-somos.hero.eyebrow",
  heroTitleLine1: "content.quienes-somos.hero.title.line1",
  heroTitleLine2: "content.quienes-somos.hero.title.line2",
  heroParagraphOne: "content.quienes-somos.hero.paragraph.one",
  heroParagraphTwo: "content.quienes-somos.hero.paragraph.two",
  heroParagraphThree: "content.quienes-somos.hero.paragraph.three",
  heroParagraphFour: "content.quienes-somos.hero.paragraph.four",
  featured: "content.quienes-somos.featured",
  missionTitle: "content.quienes-somos.mission.title",
  missionBody: "content.quienes-somos.mission.body",
  visionTitle: "content.quienes-somos.vision.title",
  visionBody: "content.quienes-somos.vision.body",
  teamEyebrow: "content.quienes-somos.team.eyebrow",
  facilitiesEyebrow: "content.quienes-somos.facilities.eyebrow",
  facilitiesBody: "content.quienes-somos.facilities.body",
} as const;

export const hardcodedQuienesSomosContentSlots: LandingContentSlot[] = [
  {
    id: quienesSomosContentSlotIds.heroEyebrow,
    label: "Hero / Volanta",
    selectorLabel: "Hero / Volanta",
    defaultValue: "QUIENES SOMOS",
    defaultSize: 14,
    styleControls: ["font", "size", "color", "align", "weight", "letterSpacing"],
  },
  {
    id: quienesSomosContentSlotIds.heroTitleLine1,
    label: "Hero / Título línea 1",
    selectorLabel: "Hero / Título 1",
    defaultValue: "Creado por",
    defaultSize: 72,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: quienesSomosContentSlotIds.heroTitleLine2,
    label: "Hero / Título línea 2",
    selectorLabel: "Hero / Título 2",
    defaultValue: "familias que cuidan",
    defaultSize: 72,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: quienesSomosContentSlotIds.heroParagraphOne,
    label: "Hero / Párrafo 1",
    selectorLabel: "Hero / P1",
    defaultValue:
      "Koru es un Organismo Social de Aprendizaje (OSA), una comunidad viva donde aprendices, acompañantes, y familias crecemos y aprendemos junt@s.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: quienesSomosContentSlotIds.heroParagraphTwo,
    label: "Hero / Párrafo 2",
    selectorLabel: "Hero / P2",
    defaultValue:
      "Creemos que la educación necesita transformarse. Vivimos en un mundo en constante cambio, marcado por desafíos sociales, ecológicos y tecnológicos cada vez más complejos.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: quienesSomosContentSlotIds.heroParagraphThree,
    label: "Hero / Párrafo 3",
    selectorLabel: "Hero / P3",
    defaultValue:
      "En este contexto, las niñas y los niños necesitan desarrollar capacidades que les permitan comprender su realidad, adaptarse, colaborar con otros y participar activamente en la construcción de un futuro más humano y sostenible.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: quienesSomosContentSlotIds.heroParagraphFour,
    label: "Hero / Párrafo 4",
    selectorLabel: "Hero / P4",
    defaultValue:
      "Por ello, cultivamos el desarrollo integral de las personas y las habilidades necesarias para comprender, cuidar y regenerar el tejido social y ecológico que habitamos.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: quienesSomosContentSlotIds.featured,
    label: "Frase destacada",
    selectorLabel: "Frase destacada",
    defaultValue:
      "Acompañamos a niñas y niños a desarrollar las habilidades que sabemos son esenciales en el mundo de hoy como: colaborar, comunicar, pensar crítica y creativamente, adaptarse al cambio y convertirse en agentes de transformación positiva en el mundo del que forman parte.",
    defaultSize: 36,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: quienesSomosContentSlotIds.missionTitle,
    label: "Misión / Título",
    selectorLabel: "Misión / Título",
    defaultValue: "Misión",
    defaultSize: 60,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: quienesSomosContentSlotIds.missionBody,
    label: "Misión / Texto",
    selectorLabel: "Misión / Texto",
    defaultValue:
      "Acompañar a niñas, niños y familias en el desarrollo de seres humanos críticos y libres, que se conocen profundamente, desarrollan sus dones, toman decisiones informadas y actúan con congruencia, cuidándose a sí mism@s, a l@s demás y a su entorno.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: quienesSomosContentSlotIds.visionTitle,
    label: "Visión / Título",
    selectorLabel: "Visión / Título",
    defaultValue: "Visión",
    defaultSize: 60,
    styleControls: ["font", "size", "color", "align", "weight"],
  },
  {
    id: quienesSomosContentSlotIds.visionBody,
    label: "Visión / Texto",
    selectorLabel: "Visión / Texto",
    defaultValue:
      "Contribuir a una transformación profunda de la educación y de la forma en que habitamos el mundo, para que las personas vivan conectadas con su brújula interna y con la naturaleza, construyan vidas con sentido y pongan sus dones al servicio de una sociedad más humana, colaborativa, pacífica y en armonía con la vida.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
  {
    id: quienesSomosContentSlotIds.teamEyebrow,
    label: "Equipo / Volanta",
    selectorLabel: "Equipo / Volanta",
    defaultValue: "NUESTRO EQUIPO",
    defaultSize: 14,
    styleControls: ["font", "size", "color", "align", "weight", "letterSpacing"],
  },
  ...[
    ["Karla Novelo", "Fundadora y Directora General"], ["Florencia Bennetts", "Directora de la Cultura"],
    ["Samantha", "Coordinadora Académica"], ["Daniel", "Coordinador Psicopedagógico"],
    ["Radha", "Tutora Grupo Esporas"], ["Nélida", "Tutora Grupo Esporas"], ["Isaac", "Tutor Grupo Koru"],
    ["Indra", "Asistente Grupo Koru"], ["Beatriz", "Tutora de Helechos 1"], ["Jari", "Asistente Helechos 1"],
    ["Diego", "Co-tutor Helechos 2"], ["Vamsi", "Co-tutora Helechos 2"], ["Violeta", "Maestra de Lectura y Matemáticas"],
    ["Francisco", "Circo"], ["Carlos", "Inglés"], ["???", "Ecología"],
    ["Nuevo integrante", "Rol por definir"], ["Nuevo integrante", "Rol por definir"],
    ["Nuevo integrante", "Rol por definir"], ["Nuevo integrante", "Rol por definir"],
  ].flatMap(([name, role], index) => [
    { id: `content.quienes-somos.team.member.${index}.name`, label: `Equipo / Integrante ${index + 1} / Nombre`, selectorLabel: `Equipo ${index + 1} / Nombre`, defaultValue: name, defaultSize: 30, styleControls: ["font", "size", "color", "align", "weight", "lineHeight"] },
    { id: `content.quienes-somos.team.member.${index}.role`, label: `Equipo / Integrante ${index + 1} / Rol`, selectorLabel: `Equipo ${index + 1} / Rol`, defaultValue: role, defaultSize: 14, styleControls: ["font", "size", "color", "align", "weight", "letterSpacing", "lineHeight"] },
  ] satisfies LandingContentSlot[]),  {
    id: quienesSomosContentSlotIds.facilitiesEyebrow,
    label: "Instalaciones / Volanta",
    selectorLabel: "Instalaciones / Volanta",
    defaultValue: "INSTALACIONES",
    defaultSize: 14,
    styleControls: ["font", "size", "color", "align", "weight", "letterSpacing"],
  },
  {
    id: quienesSomosContentSlotIds.facilitiesBody,
    label: "Instalaciones / Texto",
    selectorLabel: "Instalaciones / Texto",
    defaultValue:
      "Espacios pensados para explorar, crear, convivir y aprender en comunidad.",
    defaultSize: 20,
    multiline: true,
    styleControls: ["font", "size", "color", "align", "lineHeight"],
  },
];

export function getQuienesSomosContentSlots() {
  return hardcodedQuienesSomosContentSlots.map((slot) => ({
    ...slot,
    label: repairLandingContentText(slot.label),
    selectorLabel: repairLandingContentText(slot.selectorLabel),
    defaultValue: repairLandingContentText(slot.defaultValue),
  }));
}

export function getQuienesSomosContentSlotValue(
  textMap: Record<string, string>,
  slotId: keyof typeof quienesSomosContentSlotIds,
) {
  const slot = hardcodedQuienesSomosContentSlots.find(
    (candidate) => candidate.id === quienesSomosContentSlotIds[slotId],
  );

  if (!slot) {
    return "";
  }

  return repairLandingContentText(textMap[slot.id] ?? slot.defaultValue);
}
