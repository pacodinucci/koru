import {
  accompanimentGroups,
  methodologies,
} from "@/modules/como-acompanamos/content-slots";

export type ChildCmsPage = {
  slug: string;
  label: string;
  publicUrl: string;
  parent: string;
  fields: Array<{ key: string; label: string; defaultValue: string; multiline?: boolean }>;
  images?: Array<{ key: string; label: string; defaultSrc: string; alt: string }>;
};

export function cmsRouteKey(slug: string) {
  return slug === "/" ? "landing" : slug.slice(1).replaceAll("/", "--");
}

export function slugifyCmsSegment(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const agreements = [
  ["Participación activa de las familias", "Las familias forman parte esencial del proceso educativo. Participan en espacios de formación, acompañamiento y diálogo, dando continuidad en casa a lo que se vive en la comunidad."],
  ["Comunicación consciente", "Nos relacionamos desde el respeto, la escucha y la honestidad. Buscamos comprender antes que reaccionar, y utilizamos herramientas como la Comunicación No Violenta para gestionar los conflictos."],
  ["Respeto a los procesos individuales", "Reconocemos que cada niñ@ tiene su propio ritmo de desarrollo. Evitamos comparaciones y acompañamos desde la observación y la comprensión."],
  ["Cuidado del entorno y de los espacios", "Todos somos responsables del cuidado de los espacios y de la naturaleza. Fomentamos prácticas conscientes como la separación de residuos, el uso responsable de recursos y el respeto por el entorno."],
  ["Coherencia entre casa y comunidad", "Buscamos generar continuidad entre lo que se vive en la comunidad y en casa, sosteniendo acuerdos que brinden claridad y seguridad a las niñas y niños."],
  ["Resolución consciente de conflictos", "Los conflictos son oportunidades de aprendizaje. Acompañamos los procesos con presencia, límites claros y herramientas que favorecen la comprensión y la reparación."],
  ["Compromiso con el proceso", "Ser parte de la comunidad implica disposición para observar, aprender y participar activamente en el desarrollo individual y colectivo."],
] as const;

const childStaticPages: Record<string, ChildCmsPage> = {
  [cmsRouteKey("/comunidad/acuerdos")]: {
    slug: "/comunidad/acuerdos", publicUrl: "/comunidad/acuerdos",
    label: "Acuerdos de la comunidad", parent: "Comunidad",
    fields: [
      { key: "community.agreements.eyebrow", label: "Antetítulo", defaultValue: "COMUNIDAD" },
      { key: "community.agreements.title", label: "Título", defaultValue: "Acuerdos de la comunidad" },
      { key: "community.agreements.intro", label: "Introducción", defaultValue: "Estos acuerdos son la base que nos permite sostener una comunidad viva, donde el aprendizaje, el cuidado y la convivencia se construyen entre todos.", multiline: true },
      ...agreements.flatMap(([title, text], index) => [
        { key: `community.agreements.item.${index}.title`, label: `Acuerdo ${index + 1} · Título`, defaultValue: title },
        { key: `community.agreements.item.${index}.text`, label: `Acuerdo ${index + 1} · Descripción`, defaultValue: text, multiline: true },
      ]),
    ],
  },
  [cmsRouteKey("/unete-al-equipo")]: {
    slug: "/unete-al-equipo", publicUrl: "/unete-al-equipo",
    label: "Únete al equipo", parent: "Contacto",
    fields: [
      { key: "team.back", label: "Enlace para volver", defaultValue: "Volver a contacto" },
      { key: "team.title", label: "Título", defaultValue: "Únete al equipo" },
      { key: "team.intro", label: "Introducción", defaultValue: "Si querés aplicar para trabajar en KORU, completá el formulario y contanos sobre tu experiencia, tu área de interés y tu motivación para formar parte de la comunidad.", multiline: true },
    ],
  },
  evaluaciones: {
    slug: "/evaluaciones", publicUrl: "/evaluaciones",
    label: "Evaluaciones", parent: "Cómo acompañamos",
    fields: [
      { key: "evaluations.eyebrow", label: "Antetítulo", defaultValue: "Conocer más" },
      { key: "evaluations.title", label: "Título", defaultValue: "Evaluación como acompañamiento visible" },
      { key: "evaluations.intro.0", label: "Introducción 1", defaultValue: "En Koru entendemos la evaluación como un proceso integral, a través de la observación, registro y el compartir de los procesos, de manera que la evaluación sea un acompañamiento continuo y visible.", multiline: true },
      { key: "evaluations.intro.1", label: "Introducción 2", defaultValue: "El seguimiento consiste en observar y acompañar el progreso del aprendiz en su día a día. Es un proceso continuo que se da en la interacción constante entre aprendices y maestro/as.", multiline: true },
      { key: "evaluations.intro.2", label: "Introducción 3", defaultValue: "La evaluación parte de la lista de las habilidades personales, éstas abarcan las áreas fundamentales del ser: el cuerpo, autoconocimiento, sociales, comunicación, aprendizaje y se desarrollan según las etapas evolutivas.", multiline: true },
      { key: "evaluations.intro.3", label: "Introducción 4", defaultValue: "Se celebran los logros y se trazan nuevas rutas de aprendizaje basadas en el registro del desarrollo. Responde a la pregunta “¿Qué podemos mejorar en el acompañamiento con este niño o niña?”, mostrando avances, identificando aspectos por mejorar y ofreciendo información valiosa para la toma de decisiones. Es el puente que conecta la evaluación con la acción, y convierte el aprendizaje en algo visible y significativo para todos.", multiline: true },
      { key: "evaluations.learners.eyebrow", label: "Aprendices · Antetítulo", defaultValue: "Evaluación a aprendices" },
      { key: "evaluations.learners.title", label: "Aprendices · Título", defaultValue: "Comprender el proceso para acompañar mejor" },
      { key: "evaluations.ecocycle.eyebrow", label: "Ecociclo · Antetítulo", defaultValue: "Nuestra herramienta de evaluación" },
      { key: "evaluations.ecocycle.title", label: "Ecociclo · Título", defaultValue: "El Ecociclo como mapa de desarrollo" },
      { key: "evaluations.community.eyebrow", label: "Comunidad · Antetítulo", defaultValue: "Evaluación entre colaboradores y familias" },
      { key: "evaluations.community.title", label: "Comunidad · Título", defaultValue: "Una comunidad que también se observa" },
      { key: "evaluations.learners.paragraph.0", label: "Aprendices · Párrafo 1", defaultValue: "Entendemos la evaluación como un proceso continuo de crecimiento, y auto-observación, no como un momento aislado, ni como una definición.", multiline: true },
      { key: "evaluations.learners.paragraph.1", label: "Aprendices · Párrafo 2", defaultValue: "Observamos, registramos y compartimos el proceso de cada niñ@, haciendo visible su desarrollo en distintas dimensiones: corporal, emocional, social, cognitiva y de autogestión.", multiline: true },
      { key: "evaluations.learners.paragraph.2", label: "Aprendices · Párrafo 3", defaultValue: "Este seguimiento se construye en el día a día, a través de la interacción, la observación y el vínculo del acompañante con l@s niñ@s.", multiline: true },
      { key: "evaluations.actions.title", label: "Acciones · Título", defaultValue: "La evaluación nos permite" },
      { key: "evaluations.actions.0", label: "Acciones · Opción 1", defaultValue: "Reconocer avances y fortalezas" },
      { key: "evaluations.actions.1", label: "Acciones · Opción 2", defaultValue: "Identificar áreas de oportunidad" },
      { key: "evaluations.actions.2", label: "Acciones · Opción 3", defaultValue: "Ajustar el acompañamiento" },
      { key: "evaluations.actions.3", label: "Acciones · Opción 4", defaultValue: "Trazar nuevas rutas de desarrollo" },
      { key: "evaluations.followup.paragraph.0", label: "Seguimiento · Párrafo 1", defaultValue: "Más que emitir juicios, buscamos comprender el proceso y generar acciones que apoyen el crecimiento de cada niñ@.", multiline: true },
      { key: "evaluations.followup.paragraph.1", label: "Seguimiento · Párrafo 2", defaultValue: "El proceso de cada niñ@ es acompañado de manera cercana también con su familia.", multiline: true },
      { key: "evaluations.family.title", label: "Familias · Título", defaultValue: "Generamos" },
      { key: "evaluations.family.item.0", label: "Familias · Opción 1", defaultValue: "Espacios de seguimiento" },
      { key: "evaluations.family.item.1", label: "Familias · Opción 2", defaultValue: "Comunicación continua" },
      { key: "evaluations.family.item.2", label: "Familias · Opción 3", defaultValue: "Acuerdos compartidos" },
      { key: "evaluations.family.closing", label: "Familias · Cierre", defaultValue: "Cada niñ@ cuenta con un registro donde se documentan avances, procesos y acuerdos, permitiendo que las familias estén informadas y puedan dar continuidad desde casa.", multiline: true },
      { key: "evaluations.ecocycle.intro.0", label: "Ecociclo · Introducción 1", defaultValue: "Utilizamos el Ecociclo como una herramienta para comprender y comunicar el desarrollo de cada niñ@ de forma integral.", multiline: true },
      { key: "evaluations.ecocycle.intro.1", label: "Ecociclo · Introducción 2", defaultValue: "A diferencia de los sistemas tradicionales, el Ecociclo no mide desde la comparación, sino que reconoce el desarrollo como un proceso continuo, dinámico y en constante transformación.", multiline: true },
      { key: "evaluations.ecocycle.intro.2", label: "Ecociclo · Introducción 3", defaultValue: "Este modelo permite ubicar los distintos potenciales del niñ@ dentro de un proceso evolutivo, entendiendo que cada aspecto del desarrollo tiene su propio ritmo.", multiline: true },
      { key: "evaluations.ecocycle.intro.3", label: "Ecociclo · Introducción 4", defaultValue: "El Ecociclo cuenta también con una sección escrita en la que se escribe un breve párrafo justificando la posición de cada potencial personal o de carácter.", multiline: true },
      { key: "evaluations.ecocycle.stage.0.title", label: "Ecociclo · Semilla · Título", defaultValue: "Semilla" },
      { key: "evaluations.ecocycle.stage.0.text", label: "Ecociclo · Semilla · Descripción", defaultValue: "El potencial comienza a emerger. Está presente, aunque aún de forma incipiente.", multiline: true },
      { key: "evaluations.ecocycle.stage.1.title", label: "Ecociclo · Brote · Título", defaultValue: "Brote" },
      { key: "evaluations.ecocycle.stage.1.text", label: "Ecociclo · Brote · Descripción", defaultValue: "El potencial se expresa de manera más constante y en distintos contextos.", multiline: true },
      { key: "evaluations.ecocycle.stage.2.title", label: "Ecociclo · Árbol · Título", defaultValue: "Árbol" },
      { key: "evaluations.ecocycle.stage.2.text", label: "Ecociclo · Árbol · Descripción", defaultValue: "El potencial ha madurado y se manifiesta de forma integrada en diferentes áreas de la vida.", multiline: true },
      { key: "evaluations.ecocycle.stage.3.title", label: "Ecociclo · Fuego · Título", defaultValue: "Fuego" },
      { key: "evaluations.ecocycle.stage.3.text", label: "Ecociclo · Fuego · Descripción", defaultValue: "El potencial entra en una fase de transformación, donde necesita renovarse para seguir evolucionando.", multiline: true },
      { key: "evaluations.community.paragraph.0", label: "Comunidad · Párrafo 1", defaultValue: "El acompañamiento que ofrecemos a las niñas y niños parte de un principio fundamental: quienes acompañamos también estamos en constante aprendizaje.", multiline: true },
      { key: "evaluations.community.paragraph.1", label: "Comunidad · Párrafo 2", defaultValue: "Por ello, sostenemos prácticas de evaluación y reflexión continua que nos permiten revisar, ajustar y enriquecer nuestra labor pedagógica y comunitaria.", multiline: true },
      { key: "evaluations.community.paragraph.2", label: "Comunidad · Párrafo 3", defaultValue: "Fomentamos una cultura de retroalimentación basada en los principios de la Comunicación NoViolenta.", multiline: true },
      { key: "evaluations.community.paragraph.3", label: "Comunidad · Párrafo 4", defaultValue: "A través de espacios de observación entre pares y acompañamiento pedagógico, el equipo comparte miradas, se escucha y se nutre, fortaleciendo la coherencia y la calidad del acompañamiento.", multiline: true },
      { key: "evaluations.community.paragraph.4", label: "Comunidad · Párrafo 5", defaultValue: "Entendemos la comunidad como un sistema vivo en constante evolución. Así como acompañamos el desarrollo de cada niñ@, también observamos y ajustamos el funcionamiento del equipo, la relación con las familias y la dinámica comunitaria en su conjunto.", multiline: true },
    ],
    images: [
      { key: "evaluations.image.hero", label: "Imagen principal", defaultSrc: "/assets/images/DSC01386.png", alt: "Acompañante registrando procesos de aprendizaje" },
      { key: "evaluations.image.learners", label: "Evaluación a aprendices", defaultSrc: "/assets/images/DSC01379.png", alt: "Niñez trabajando con herramientas de seguimiento" },
      { key: "evaluations.image.community", label: "Comunidad", defaultSrc: "/assets/images/DSC01384.png", alt: "Comunidad educativa compartiendo acompañamiento" },
    ],
  },
};

const groupPages = Object.fromEntries(accompanimentGroups.map((group) => {
  const slug = `/como-acompanamos/${slugifyCmsSegment(group.title)}`;
  return [cmsRouteKey(slug), {
    slug, publicUrl: slug, label: group.title, parent: "Cómo acompañamos · Grupos",
    fields: [
      { key: "group.back", label: "Enlace para volver", defaultValue: "Grupos de acompañamiento" },
      { key: "group.title", label: "Título", defaultValue: group.title },
      { key: "group.ageRange", label: "Rango de edad", defaultValue: group.ageRange },
      ...group.paragraphs.map((value, index) => ({ key: `group.paragraph.${index}`, label: `Introducción ${index + 1}`, defaultValue: value, multiline: true })),
      ...group.experienceCards.flatMap((card, index) => [
        { key: `group.card.${index}.title`, label: `Experiencia ${index + 1} · Título`, defaultValue: card.title },
        { key: `group.card.${index}.description`, label: `Experiencia ${index + 1} · Descripción`, defaultValue: card.description, multiline: true },
      ]),
    ],
    images: [
      { key: "group.image.hero", label: "Imagen principal", defaultSrc: group.imageSrc, alt: group.imageAlt },
      ...group.experienceCards.map((card, index) => ({ key: `group.image.card.${index}`, label: `Experiencia ${index + 1} · Imagen`, defaultSrc: card.imageSrc, alt: card.imageAlt })),
    ],
  } satisfies ChildCmsPage];
}));

const methodologyPages = Object.fromEntries(methodologies.map((methodology) => {
  const slug = `/como-acompanamos/metodologias/${methodology.slug}`;
  const paragraphs = methodology.detailParagraphs ?? methodology.paragraphs ?? [];
  return [cmsRouteKey(slug), {
    slug, publicUrl: slug, label: methodology.title.replace(/^\d+\.\s*/, ""),
    parent: "Cómo acompañamos · Metodologías",
    fields: [
      { key: "methodology.back", label: "Enlace para volver", defaultValue: "Metodologías y experiencias" },
      { key: "methodology.title", label: "Título", defaultValue: methodology.title },
      ...paragraphs.map((value, index) => ({ key: `methodology.paragraph.${index}`, label: `Párrafo ${index + 1}`, defaultValue: value, multiline: true })),
    ],
  } satisfies ChildCmsPage];
}));

export const childCmsContentPages: Record<string, ChildCmsPage> = {
  ...childStaticPages,
  ...groupPages,
  ...methodologyPages,
};
