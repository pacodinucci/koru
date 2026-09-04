import type { LandingContentSlot } from "@/modules/landing/content-slots";
import { childCmsContentPages } from "@/modules/cms/child-content-config";

export type CmsContentField = {
  key: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
};

export type CmsContentPageConfig = {
  slug: string;
  label: string;
  publicUrl: string;
  parent?: string;
  fields: readonly CmsContentField[];
  images?: readonly CmsImageSlot[];
};

export type CmsImageSlot = {
  key: string;
  label: string;
  defaultSrc: string;
  alt: string;
};

export const landingCmsImageSlots: CmsImageSlot[] = [
  { key: "landing.image.welcome", label: "Bienvenida", defaultSrc: "/assets/images/DSC01443.png", alt: "Comunidad educativa compartiendo actividades" },
  { key: "landing.image.editorial.0", label: "Qué nos hace diferentes", defaultSrc: "/assets/images/DSC01344.png", alt: "Experiencia de aprendizaje en Koru" },
  { key: "landing.image.editorial.1", label: "Enfoque pedagógico", defaultSrc: "/assets/images/DSC01273.png", alt: "Comunidad Koru compartiendo una experiencia" },
  { key: "landing.image.grid.0", label: "Grilla · Grupos de acompañamiento", defaultSrc: "/assets/images/DSC01363.png", alt: "Grupo de acompañamiento" },
  { key: "landing.image.grid.1", label: "Grilla · Metodologías", defaultSrc: "/assets/images/DSC01338.png", alt: "Metodologías de acompañamiento" },
  { key: "landing.image.grid.2", label: "Grilla · Instalaciones", defaultSrc: "/assets/images/insta8.png", alt: "Instalaciones" },
  { key: "landing.image.grid.3", label: "Grilla · Equipo", defaultSrc: "/assets/images/DSC02336.png", alt: "Equipo" },
  ...[5, 6, 7, 8, 9, 1, 2, 3].map((number, index) => ({
    key: `landing.image.grid.${index + 4}`,
    label: `Grilla · Imagen ${index + 5}`,
    defaultSrc: `/assets/img${number}.jpg`,
    alt: `Imagen ${index + 5}`,
  })),
];

export const quienesSomosCmsImageSlots: CmsImageSlot[] = [
  { key: "about.image.hero", label: "Hero", defaultSrc: "/assets/images/DSC01400.png", alt: "Niñas y niños compartiendo una actividad en comunidad" },
  { key: "about.image.mission", label: "Misión", defaultSrc: "/assets/images/image2.png", alt: "Niñas y niños aprendiendo juntos en la naturaleza" },
  { key: "about.image.vision", label: "Visión", defaultSrc: "/assets/images/image1.png", alt: "Comunidad educativa compartiendo actividades" },
  { key: "about.image.team.0", label: "Equipo · Karla Novelo", defaultSrc: "/assets/images/equipo11.png", alt: "Karla Novelo, Fundadora y Directora General" },
  { key: "about.image.team.1", label: "Equipo · Florencia Bennetts", defaultSrc: "/assets/images/equipo10.png", alt: "Florencia Bennetts, Directora de la Cultura" },
  { key: "about.image.team.2", label: "Equipo · Samantha", defaultSrc: "/assets/images/equipo7.png", alt: "Samantha, Coordinadora Académica" },
  { key: "about.image.team.3", label: "Equipo · Daniel", defaultSrc: "/assets/images/equipo14.png", alt: "Daniel, Coordinador Psicopedagógico" },
  { key: "about.image.team.4", label: "Equipo · Radha", defaultSrc: "/assets/images/equipo3.png", alt: "Radha, Tutora Grupo Esporas" },
  { key: "about.image.team.7", label: "Equipo · Indra", defaultSrc: "/assets/images/equipo15.png", alt: "Indra, Asistente Grupo Koru" },
  { key: "about.image.team.8", label: "Equipo · Beatriz", defaultSrc: "/assets/images/equipo1.png", alt: "Beatriz, Tutora de Helechos 1" },
  { key: "about.image.team.9", label: "Equipo · Jari", defaultSrc: "/assets/images/equipo16.png", alt: "Jari, Asistente Helechos 1" },
  { key: "about.image.team.10", label: "Equipo · Diego", defaultSrc: "/assets/images/equipo17.png", alt: "Diego, Co-tutor Helechos 2" },
  { key: "about.image.team.12", label: "Equipo · Violeta", defaultSrc: "/assets/images/equipo9.png", alt: "Violeta, Maestra de Lectura y Matemáticas" },
  { key: "about.image.team.13", label: "Equipo · Francisco", defaultSrc: "/assets/images/equipo12.png", alt: "Francisco, Circo" },
  ...Array.from({ length: 8 }, (_, index) => ({
    key: `about.image.facility.${index}`,
    label: `Instalaciones · Imagen ${index + 1}`,
    defaultSrc: `/assets/images/insta${index + 1}.png`,
    alt: `Instalaciones de Koru · Imagen ${index + 1}`,
  })),
];

export const comoAcompanamosCmsImageSlots: CmsImageSlot[] = [
  { key: "accompaniment.image.hero", label: "Hero", defaultSrc: "/assets/images/DSC01280.png", alt: "Acompañantes y niñez compartiendo un espacio de aprendizaje" },
  { key: "accompaniment.image.evaluation", label: "Evaluación", defaultSrc: "/assets/images/DSC01386.png", alt: "Acompañante registrando procesos de aprendizaje en comunidad" },
];

const cmsImageSlotsBySlug: Record<string, CmsImageSlot[]> = {
  "/": landingCmsImageSlots,
  "/quienes-somos": quienesSomosCmsImageSlots,
  "/como-acompanamos": comoAcompanamosCmsImageSlots,
};

export const cmsContentPages: Record<string, CmsContentPageConfig> = {
  comunidad: {
    slug: "/comunidad",
    label: "Comunidad",
    publicUrl: "/comunidad",
    fields: [
      { key: "community.eyebrow", label: "Antetítulo", defaultValue: "COMUNIDAD" },
      { key: "community.hero.first", label: "Título principal", defaultValue: "Creemos que la educación" },
      { key: "community.hero.second", label: "Título destacado", defaultValue: "es un proceso compartido" },
      { key: "community.intro.one", label: "Introducción 1", defaultValue: "Niñas, niños, familias y colaboradores formamos un mismo organismo, donde cada parte influye en el desarrollo individual y colectivo.", multiline: true },
      { key: "community.intro.two", label: "Introducción 2", defaultValue: "Por eso, el acompañamiento no ocurre sólo dentro del espacio educativo, sino también en casa y en la relación cotidiana.", multiline: true },
      { key: "community.intro.three", label: "Introducción 3", defaultValue: "Ser parte de este espacio implica formar parte de una comunidad que aprende, se cuestiona y evoluciona.", multiline: true },
      { key: "community.caption", label: "Texto de imagen", defaultValue: "Una comunidad que aprende unida, crece unida.", multiline: true },
      { key: "community.actions.title", label: "Acciones · Título", defaultValue: "No buscamos familias perfectas, sino disponibles a:", multiline: true },
      { key: "community.actions.item.0", label: "Acciones · Opción 1", defaultValue: "Cuestionar" },
      { key: "community.actions.item.1", label: "Acciones · Opción 2", defaultValue: "Aprender" },
      { key: "community.actions.item.2", label: "Acciones · Opción 3", defaultValue: "Construir en conjunto" },
      { key: "community.actions.item.3", label: "Acciones · Opción 4", defaultValue: "Participar" },
      { key: "community.school.title", label: "Escuela para familias · Título", defaultValue: "Escuela para familias" },
      { key: "community.school.subtitle", label: "Escuela para familias · Subtítulo", defaultValue: "Las familias no observan el proceso desde fuera; forman parte de él.", multiline: true },
      { key: "community.school.description", label: "Escuela para familias · Descripción", defaultValue: "Contamos con un espacio de formación y acompañamiento para madres y padres, con el propósito de construir una visión compartida sobre cómo acompañar el desarrollo de las niñas y niños.", multiline: true },
      { key: "community.school.workshopsLabel", label: "Escuela para familias · Introducción de talleres", defaultValue: "Talleres introductorios obligatorios:" },
      { key: "community.school.workshop.0", label: "Escuela para familias · Taller 1", defaultValue: "Comunicación No Violenta" },
      { key: "community.school.workshop.1", label: "Escuela para familias · Taller 2", defaultValue: "Etapas evolutivas desde la antroposofía" },
      { key: "community.school.workshopCta.0", label: "Escuela para familias · Enlace taller 1", defaultValue: "Conoce más" },
      { key: "community.school.workshopCta.1", label: "Escuela para familias · Enlace taller 2", defaultValue: "Conoce más" },
      { key: "community.school.note", label: "Escuela para familias · Nota", defaultValue: "Ambos incluídos en su cuota de inscripción." },
      { key: "community.talks.title", label: "Talleres y charlas · Título", defaultValue: "Talleres y charlas" },
      { key: "community.talks.description", label: "Talleres y charlas · Descripción", defaultValue: "Se realizan encuentros dos veces al mes donde abordamos temas como:", multiline: true },
      { key: "community.talks.topic.0", label: "Talleres y charlas · Tema 1", defaultValue: "Gestión emocional" },
      { key: "community.talks.topic.1", label: "Talleres y charlas · Tema 2", defaultValue: "Retos cotidianos en la crianza" },
      { key: "community.talks.topic.2", label: "Talleres y charlas · Tema 3", defaultValue: "Construcción de acuerdos" },
      { key: "community.talks.topic.3", label: "Talleres y charlas · Tema 4", defaultValue: "Educación sexual" },
      { key: "community.talks.topic.4", label: "Talleres y charlas · Tema 5", defaultValue: "Retos de cada etapa" },
      { key: "community.talks.topic.5", label: "Talleres y charlas · Tema 6", defaultValue: "Pantallas" },
      { key: "community.talks.topic.6", label: "Talleres y charlas · Tema 7", defaultValue: "Límites" },
      { key: "community.talks.topic.7", label: "Talleres y charlas · Tema 8", defaultValue: "Otros" },
      { key: "community.talks.note", label: "Talleres y charlas · Nota", defaultValue: "Estos talleres pueden tener un costo extra." },
      { key: "community.talks.closing", label: "Talleres y charlas · Cierre", defaultValue: "Además de contenido, estos espacios permiten compartir experiencias, reflexionar y generar herramientas prácticas para la vida diaria.", multiline: true },
      { key: "community.support.title", label: "Acompañamiento conjunto · Título", defaultValue: "Acompañamiento conjunto" },
      { key: "community.support.description.0", label: "Acompañamiento conjunto · Descripción 1", defaultValue: "Nuestra comunidad se sostiene a partir de acuerdos que nos permiten convivir, acompañar y crecer de manera coherente.", multiline: true },
      { key: "community.support.description.1", label: "Acompañamiento conjunto · Descripción 2", defaultValue: "Estos acuerdos no son reglas impuestas, sino compromisos compartidos que hacen posible el bienestar individual y colectivo.", multiline: true },
      { key: "community.support.cta", label: "Acompañamiento conjunto · Enlace", defaultValue: "Conoce los acuerdos que mantenemos como comunidad" },
      { key: "community.protocols.title", label: "Protocolos · Título", defaultValue: "Protocolos y cuidado" },
      { key: "community.protocols.description.0", label: "Protocolos · Descripción 1", defaultValue: "Para sostener un entorno seguro y coherente, contamos con protocolos claros que forman parte del funcionamiento de la comunidad.", multiline: true },
      { key: "community.protocols.description.1", label: "Protocolos · Descripción 2", defaultValue: "Estos lineamientos permiten cuidar el bienestar individual y colectivo, generando claridad y confianza para todas las familias.", multiline: true },
      { key: "community.protocols.item.0.title", label: "Protocolos · Protocolo 1 · Título", defaultValue: "Resolución de conflictos" },
      { key: "community.protocols.item.0.description", label: "Protocolos · Protocolo 1 · Descripción", defaultValue: "Los conflictos son oportunidades de aprendizaje. Los acompañamos con presencia, límites claros, escucha y reparación.", multiline: true },
      { key: "community.protocols.item.1.title", label: "Protocolos · Protocolo 2 · Título", defaultValue: "Prevención y manejo de enfermedades" },
      { key: "community.protocols.item.1.description", label: "Protocolos · Protocolo 2 · Descripción", defaultValue: "Sostenemos criterios claros para cuidar la salud individual y colectiva, con comunicación oportuna entre casa y comunidad.", multiline: true },
      { key: "community.protocols.item.2.title", label: "Protocolos · Protocolo 3 · Título", defaultValue: "Protocolos de higiene" },
      { key: "community.protocols.item.2.description", label: "Protocolos · Protocolo 3 · Descripción", defaultValue: "Incluyen prácticas preventivas como cuidado cotidiano de espacios, hábitos de limpieza y prevención de piojos.", multiline: true },
      { key: "community.protocols.item.3.title", label: "Protocolos · Protocolo 4 · Título", defaultValue: "Atención a emergencias" },
      { key: "community.protocols.item.3.description", label: "Protocolos · Protocolo 4 · Descripción", defaultValue: "Definen cómo actuar ante situaciones imprevistas para brindar claridad, seguridad y confianza a todas las familias.", multiline: true },
      { key: "community.daily.title", label: "Día a día · Título", defaultValue: "El día a día en KORU" },
      { key: "community.daily.subtitle", label: "Día a día · Subtítulo", defaultValue: "Conoce cómo se vive cada día en KORU." },
      { key: "community.daily.eyebrow", label: "Día a día · Antetítulo", defaultValue: "RITMOS POR GRUPO Y RITMO ANUAL" },
      { key: "community.daily.rhythm.0", label: "Día a día · Ritmo 1", defaultValue: "Esporas" },
      { key: "community.daily.rhythm.1", label: "Día a día · Ritmo 2", defaultValue: "Grupo Koru" },
      { key: "community.daily.rhythm.2", label: "Día a día · Ritmo 3", defaultValue: "Helechos 1" },
      { key: "community.daily.rhythm.3", label: "Día a día · Ritmo 4", defaultValue: "Helechos 2" },
      { key: "community.daily.rhythm.4", label: "Día a día · Ritmo 5", defaultValue: "Ritmo anual" },
      { key: "community.celebrations.title", label: "Celebraciones · Título", defaultValue: "Nuestras celebraciones comunitarias" },
      { key: "community.celebrations.description", label: "Celebraciones · Descripción", defaultValue: "El ritmo anual también nos reúne como comunidad: celebramos, compartimos y hacemos visible lo que cada etapa trae al proceso.", multiline: true },
      { key: "community.celebrations.item.0", label: "Celebraciones · Evento 1", defaultValue: "Celebración del Maíz" },
      { key: "community.celebrations.item.1", label: "Celebraciones · Evento 2", defaultValue: "Celebración día de muertos" },
      { key: "community.celebrations.item.2", label: "Celebraciones · Evento 3", defaultValue: "Bazar navideño" },
      { key: "community.celebrations.item.3", label: "Celebraciones · Evento 4", defaultValue: "Kermés de primavera" },
    ],
    images: [
      {
        key: "community.image.hero",
        label: "Imagen principal",
        defaultSrc: "/assets/images/comu3.png",
        alt: "Comunidad Koru compartiendo actividades",
      },
      {
        key: "community.image.school",
        label: "Escuela para familias",
        defaultSrc: "/assets/images/comu1.png",
        alt: "Encuentros de formación para familias",
      },
      {
        key: "community.image.support",
        label: "Acompañamiento conjunto",
        defaultSrc: "/assets/images/comu5.png",
        alt: "Acompañamiento entre familia y comunidad educativa",
      },
      {
        key: "community.image.protocols",
        label: "Protocolos y cuidado",
        defaultSrc: "/assets/images/comu2.png",
        alt: "Cuidado y seguridad en la comunidad",
      },
      {
        key: "community.image.daily",
        label: "El día a día en KORU",
        defaultSrc: "/assets/images/comu6.png",
        alt: "Vida cotidiana en la comunidad Koru",
      },
      {
        key: "community.image.celebration.0",
        label: "Celebración del Maíz",
        defaultSrc: "/assets/images/DSC01273.png",
        alt: "Celebración del Maíz",
      },
      {
        key: "community.image.celebration.1",
        label: "Celebración día de muertos",
        defaultSrc: "/assets/images/DSC01338.png",
        alt: "Celebración día de muertos",
      },
      {
        key: "community.image.celebration.2",
        label: "Bazar navideño",
        defaultSrc: "/assets/images/DSC01638.png",
        alt: "Bazar navideño",
      },
      {
        key: "community.image.celebration.3",
        label: "Kermés de primavera",
        defaultSrc: "/assets/images/DSC02336.png",
        alt: "Kermés de primavera",
      },
    ],
  },
  blog: {
    slug: "/blog",
    label: "Blog",
    publicUrl: "/blog",
    fields: [
      { key: "blog.brand", label: "Marca", defaultValue: "Koru OSA" },
      { key: "blog.title", label: "Título", defaultValue: "Blog" },
    ],
  },
  admisiones: {
    slug: "/admisiones",
    label: "Admisiones",
    publicUrl: "/admisiones",
    fields: [
      { key: "admissions.eyebrow", label: "Antetítulo", defaultValue: "ADMISIONES" },
      { key: "admissions.hero.first", label: "Título principal", defaultValue: "Queremos que cada familia" },
      { key: "admissions.hero.second", label: "Título destacado", defaultValue: "llegue con claridad y confianza" },
      { key: "admissions.intro", label: "Introducción", defaultValue: "Gracias por su interés en unirse KORU OSA. Antes de programar su visita, por favor revise detenidamente nuestro proceso de admisión.", multiline: true },
      { key: "admissions.timeline.eyebrow", label: "Antetítulo del proceso", defaultValue: "Inscripciones 2026–2027" },
      { key: "admissions.timeline.title", label: "Título del proceso", defaultValue: "Proceso para nuevas familias" },
      { key: "admissions.step.0.eyebrow", label: "Paso 1 · Antetítulo", defaultValue: "Cuestionario inicial" },
      { key: "admissions.step.0.title", label: "Paso 1 · Título", defaultValue: "1er contacto" },
      { key: "admissions.step.0.item.0", label: "Paso 1 · Punto 1", defaultValue: "La familia llena un primer cuestionario con información general.", multiline: true },
      { key: "admissions.step.0.item.1", label: "Paso 1 · Punto 2", defaultValue: "Se agenda cita para conocer el espacio.", multiline: true },
      { key: "admissions.step.1.eyebrow", label: "Paso 2 · Antetítulo", defaultValue: "Conocer el espacio" },
      { key: "admissions.step.1.title", label: "Paso 2 · Título", defaultValue: "Conocer" },
      { key: "admissions.step.1.item.0", label: "Paso 2 · Punto 1", defaultValue: "La familia conoce el espacio físico y profundiza en dudas.", multiline: true },
      { key: "admissions.step.1.item.1", label: "Paso 2 · Punto 2", defaultValue: "Se agenda semana de prueba.", multiline: true },
      { key: "admissions.step.1.item.2", label: "Paso 2 · Punto 3", defaultValue: "Se proporciona propuesta con cuotas.", multiline: true },
      { key: "admissions.step.1.item.3", label: "Paso 2 · Punto 4", defaultValue: "Se paga semana de prueba.", multiline: true },
      { key: "admissions.step.2.eyebrow", label: "Paso 3 · Antetítulo", defaultValue: "Semana de prueba" },
      { key: "admissions.step.2.title", label: "Paso 3 · Título", defaultValue: "Conectar" },
      { key: "admissions.step.2.item.0", label: "Paso 3 · Punto 1", defaultValue: "Se completa 2do cuestionario sobre él/la niñ@.", multiline: true },
      { key: "admissions.step.2.item.1", label: "Paso 3 · Punto 2", defaultValue: "Durante esta semana: evaluación diagnóstica en lectura y matemáticas.", multiline: true },
      { key: "admissions.step.2.item.2", label: "Paso 3 · Punto 3", defaultValue: "Evaluación psicopedagógica.", multiline: true },
      { key: "admissions.step.2.item.3", label: "Paso 3 · Punto 4", defaultValue: "Observaciones generales de ambos lados.", multiline: true },
      { key: "admissions.step.2.item.4", label: "Paso 3 · Punto 5", defaultValue: "Se agenda cita de retroalimentación.", multiline: true },
      { key: "admissions.step.3.eyebrow", label: "Paso 4 · Antetítulo", defaultValue: "Retroalimentación" },
      { key: "admissions.step.3.title", label: "Paso 4 · Título", defaultValue: "Profundizar" },
      { key: "admissions.step.3.item.0", label: "Paso 4 · Punto 1", defaultValue: "Se hace entre tutor y coordinador psicopedagógico.", multiline: true },
      { key: "admissions.step.3.item.1", label: "Paso 4 · Punto 2", defaultValue: "Se entregan resultados de evaluaciones y recibe retroalimentación en ambas direcciones.", multiline: true },
      { key: "admissions.step.3.item.2", label: "Paso 4 · Punto 3", defaultValue: "Se decide si desea continuar con inscripción.", multiline: true },
      { key: "admissions.step.4.eyebrow", label: "Paso 5 · Antetítulo", defaultValue: "Inscripción" },
      { key: "admissions.step.4.title", label: "Paso 5 · Título", defaultValue: "Confirmar" },
      { key: "admissions.step.4.item.0", label: "Paso 5 · Punto 1", defaultValue: "Se hace el pago de inscripción.", multiline: true },
      { key: "admissions.step.4.item.1", label: "Paso 5 · Punto 2", defaultValue: "Se llenan y firman formatos de admisión.", multiline: true },
      { key: "admissions.contract", label: "Enlace al contrato", defaultValue: "Descargar el contrato de colaboración" },
    ],
  },
  contacto: {
    slug: "/contacto",
    label: "Contacto",
    publicUrl: "/contacto",
    fields: [
      { key: "contact.title", label: "Título", defaultValue: "Información de contacto" },
      { key: "contact.teamCta", label: "Enlace al equipo", defaultValue: "Únete al equipo" },
      { key: "contact.address", label: "Dirección", defaultValue: "Tepoztlán, Morelos, México" },
      { key: "contact.phone", label: "Teléfono", defaultValue: "+52 81 0000 0000" },
      { key: "contact.email", label: "Correo", defaultValue: "contacto@koruosa.com" },
      { key: "contact.directEmailCta", label: "Enlace de correo", defaultValue: "Escribir directamente al correo" },
    ],
  },
  ...childCmsContentPages,
};

export type CmsContentPageKey = string;

export function getCmsContentNavigation() {
  return Object.entries(cmsContentPages).map(([key, page]) => ({
    key,
    slug: page.slug,
    label: page.label,
    parent: "parent" in page ? page.parent : undefined,
  }));
}

export function getCmsContentPage(key: string) {
  return cmsContentPages[key as CmsContentPageKey] ?? null;
}

export function getCmsContentValue(
  textMap: Record<string, string>,
  key: string,
  defaultValue: string,
) {
  return textMap[key]?.trim() || defaultValue;
}

export function getCmsContentSlots(key: CmsContentPageKey): LandingContentSlot[] {
  return cmsContentPages[key].fields.map((field) => ({
    id: field.key,
    label: field.label,
    selectorLabel: field.label,
    defaultValue: field.defaultValue,
    defaultSize: 16,
    multiline: "multiline" in field ? field.multiline : false,
    styleControls: [
      "font",
      "size",
      "color",
      "align",
      "weight",
      "lineHeight",
      "letterSpacing",
    ],
  }));
}

export function getCmsImageSlots(key: CmsContentPageKey): CmsImageSlot[] {
  const page = cmsContentPages[key];
  return page.images ? [...page.images] : [];
}
export function getCmsImageSlotsBySlug(slug: string): CmsImageSlot[] {
  const configuredPage = Object.values(cmsContentPages).find(
    (page) => page.slug === slug,
  );
  if (configuredPage?.images) {
    return [...configuredPage.images];
  }
  return [...(cmsImageSlotsBySlug[slug] ?? [])];
}

export function getAllCmsImagePages() {
  const configuredPages = Object.values(cmsContentPages).map((page) => ({
    slug: page.slug,
    images: page.images ? [...page.images] : [],
  }));
  const standalonePages = Object.entries(cmsImageSlotsBySlug).map(([slug, images]) => ({
    slug,
    images: [...images],
  }));
  const pages = new Map<string, { slug: string; images: CmsImageSlot[] }>();
  for (const page of [...standalonePages, ...configuredPages]) {
    const current = pages.get(page.slug);
    pages.set(page.slug, {
      slug: page.slug,
      images: [...(current?.images ?? []), ...page.images],
    });
  }
  return [...pages.values()];
}
