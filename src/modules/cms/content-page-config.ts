import type { LandingContentSlot } from "@/modules/landing/content-slots";

export type CmsContentField = {
  key: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
};

export const cmsContentPages = {
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
} as const;

export type CmsContentPageKey = keyof typeof cmsContentPages;

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
