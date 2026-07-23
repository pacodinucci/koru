import {
  repairLandingContentText,
  type LandingContentSlot,
} from "@/modules/landing/content-slots";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";

export type TextBlock = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  cta?: {
    label: string;
    href: string;
  };
};

export const methodologyCardBackgrounds = [
  "color-mix(in srgb, var(--complement-700) 34%, white)",
  "color-mix(in srgb, var(--brand-600) 28%, white)",
  "color-mix(in srgb, var(--orange-500) 34%, white)",
  "color-mix(in srgb, var(--complement-900) 24%, white)",
];

export type AccompanyPillar = TextBlock & {
  imageSrc: string;
  imageAlt: string;
};

export type IllustratedTextBlock = TextBlock & {
  imageSrc: string;
  imageAlt: string;
};

export const accompanyCopy = {
  eyebrow: "COMO ACOMPAÑAMOS",
  title: "Cómo acompañamos",
  intro:
    "Nuestro enfoque pedagógico integra la mirada antroposófica, la inteligencia socioemocional, el aprendizaje transdisciplinario basado en proyectos, y las habilidades basadas en diversas investigaciones que se definen como habilidades del siglo 21, promoviendo experiencias de aprendizaje que responden al desarrollo integral de cada niña y niño.",
};

export const accompanyPillars: AccompanyPillar[] = [
  {
    title: "Aprendizaje con propósito",
    imageSrc: "/assets/images/DSC01367.png",
    imageAlt: "Niñas y niños explorando aprendizajes con propósito",
    paragraphs: [
      "Las niñas y los niños aprenden a través de proyectos transdisciplinarios y experiencias significativas conectadas con sus intereses, preguntas y motivaciones.",
    ],
  },
  {
    title: "Acompañamiento personalizado",
    imageSrc: "/assets/images/DSC01352.png",
    imageAlt: "Acompañamiento personalizado en comunidad",
    paragraphs: [
      "Reconocemos que cada niña y niño es único. Por ello, adaptamos la propuesta educativa a sus intereses, necesidades y etapas evolutivas, respetando la singularidad de cada proceso de aprendizaje.",
    ],
  },
  {
    title: "Desarrollo integral",
    imageSrc: "/assets/images/DSC01378.png",
    imageAlt: "Niñez desarrollando capacidades integrales",
    paragraphs: [
      "Cultivamos capacidades cognitivas, emocionales, sociales y prácticas que permiten a niñas y niños desenvolverse con confianza, creatividad y sentido de propósito en un mundo cambiante.",
    ],
  },
  {
    title: "Comunidad y naturaleza",
    imageSrc: "/assets/images/DSC01384.png",
    imageAlt: "Comunidad educativa en conexión con la naturaleza",
    paragraphs: [
      "Entendemos el aprendizaje como un proceso relacional. Aprendemos en comunidad y en conexión con la naturaleza, reconociendo que formamos parte de sistemas vivos interdependientes.",
    ],
  },
];

// const cultivatedSkills = [
//   "Pensamiento crítico",
//   "Colaboración",
//   "Comunicación",
//   "Creatividad",
//   "Inteligencia socioemocional",
//   "Conexión con la naturaleza",
//   "Autoconocimiento",
// ];

export const accompanimentGroups = [
  {
    title: "Grupo Esporas",
    ageRange: "3 a 6 años",
    imageSrc: "/assets/images/DSC01338.png",
    imageAlt: "Niñas y niños pequeños explorando en la naturaleza",
    paragraphs: [
      "El primer septenio en KORU, sigue un enfoque con influencia antroposófica por lo que para el grupo esporas llevamos un ritmo basado en la pedagogía Waldorf.",
      "El juego libre, la exploración sensorial y el vínculo cercano con el acompañante son la base de su desarrollo. El contacto con la naturaleza, el ritmo cotidiano y la repetición les brindan contención y estructura, permitiéndoles habitar su infancia con plenitud.",
      "En este momento de vida, se siembran aspectos fundamentales como:",
    ],
    bullets: [
      "La seguridad emocional",
      "La autonomía",
      "El lenguaje",
      "La capacidad de imaginar y crear",
    ],
    rhythmIntro: "Esto se logra en un ritmo donde observaremos:",
    rhythmBullets: [
      "Tareas de hogar: hacer pan, cocinar, limpiar, lavar platos, ordenar espacios, cuidar el entorno.",
      "Actividades estacionales: vinculadas al ritmo de la naturaleza y las festividades del año.",
      "Trabajo manual: tejido, modelado con cera, huerto.",
      "Arte y movimiento: canto, rondas, danzas, juegos rítmicos.",
    ],
  },
  {
    title: "Grupo Koru",
    ageRange: "6 a 8 años",
    imageSrc: "/assets/images/DSC01384.png",
    imageAlt: "Niñas y niños en una etapa de transición de aprendizaje",
    paragraphs: [
      "Grupo Koru continúa con la influencia antroposófica, sin embargo se enfoca en crear el espacio y los recursos para una transición hacia el siguiente septenio.",
      "Esta es una etapa de transición profunda. Pueden transitar rápidamente entre distintas emociones mientras empiezan a construir su mundo interior, su autoestima y su identidad.",
      "En este grupo acompañamos:",
    ],
    bullets: [
      "El desarrollo de la iniciativa y la curiosidad",
      "El paso del juego libre al aprendizaje con propósito",
      "El inicio del pensamiento más estructurado",
    ],
    closing:
      "Creamos experiencias concretas, significativas y vivenciales que les permitan comprender el mundo desde la experiencia.",
    rhythmIntro: "Esto se logra en un ritmo donde observaremos:",
    rhythmBullets: [
      "Tareas de hogar: hacer pan, cocinar, limpiar, lavar platos, ordenar espacios, cuidar el entorno.",
      "Actividades estacionales: vinculadas al ritmo de la naturaleza y las festividades del año.",
      "Trabajo manual: tejido, modelado con barro y plastilina, huerto, creación de mundos posibles.",
      "Proyectos.",
      "Arte y movimiento: clases de circo.",
      "Introducción a los números y letras: empiezan a trabajar la lectoescritura y matemáticas de acuerdo a su ritmo y desarrollo.",
      "Inglés: se trabaja a través de canciones.",
      "Exploración sensorial.",
      "Música: metodología basada en la neurociencia.",
    ],
  },
  {
    title: "Grupo Helechos 1",
    ageRange: "8 a 10 años",
    imageSrc: "/assets/images/DSC01379.png",
    imageAlt: "Grupo escolar en actividades colaborativas",
    paragraphs: ["En este momento acompañamos:"],
    bullets: [
      "Se refuerza el desarrollo de la autorregulación emocional",
      "Se prioriza la construcción de vínculos de cuidado mutuo",
      "Se profundiza en la comprensión de límites y consecuencias",
      "El sentido de pertenencia y colaboración",
    ],
    closing:
      "Integramos movimiento, juego, trabajo en equipo y experiencias significativas que les permitan canalizar su energía, fortalecer su autoestima y encontrar su lugar dentro de la comunidad.",
    rhythmBullets: [
      "Proyectos Transdisciplinarios.",
      "Metodología Lecto escritura y matemáticas especializada.",
      "Autodirigido.",
      "Desarrollo de habilidades del pensamiento.",
      "Huerto.",
      "Escuela del bosque.",
      "Artes: teatro, grabado, pintura.",
      "Asambleas.",
      "Diálogo Socrítico.",
      "Música: metodología basada en neurociencia.",
      "Inglés.",
      "Movimiento: Circo, Entrenamiento físico.",
    ],
  },
  {
    title: "Grupo Helechos 2",
    ageRange: "10 a 12 años",
    imageSrc: "/assets/images/DSC01280.png",
    imageAlt: "Niñez desarrollando autonomía y pensamiento crítico",
    paragraphs: [
      "En esta etapa, las niñas y niños avanzan hacia una mayor conciencia de sí mism@s, de sus decisiones y de su impacto en el entorno.",
      "Se fortalece el pensamiento crítico, la capacidad de reflexión y el deseo de participar activamente en el mundo que los rodea. Buscan mayor autonomía, pero aún requieren acompañamiento para sostener sus procesos emocionales y sociales.",
      "Aquí acompañamos:",
    ],
    bullets: [
      "El desarrollo de la responsabilidad y la autonomía",
      "La toma de decisiones responsables",
      "La participación activa en la comunidad",
      "La conexión con propósito y servicio",
    ],
    closing:
      "Fomentamos espacios donde puedan cuestionar, proponer, colaborar y poner en práctica sus ideas, integrando sus dones en experiencias reales que los conecten con el mundo y su transformación.",
  },
];

export const methodologies: TextBlock[] = [
  {
    title: "1. Aprendizaje basado en proyectos transdisciplinarios",
    paragraphs: [
      "Desarrollamos proyectos que integran distintas áreas del conocimiento, permitiendo que las niñas y niños comprendan la realidad de manera conectada y significativa. A través de estos procesos, investigan, crean, colaboran y encuentran sentido en lo que aprenden.",
    ],
    cta: { label: "Conocer más", href: "#aprendizaje-basado-en-proyectos" },
  },
  {
    title: "2. Inteligencia socioemocional",
    paragraphs: [
      "Acompañamos los procesos socioemocionales desde la escucha, la empatía y el respeto.",
      "Integramos herramientas como la Comunicación NoViolenta para gestionar conflictos, fortalecer la colaboración y desarrollar la capacidad de expresar necesidades y sentimientos de manera clara y cuidadosa.",
    ],
    cta: { label: "Conocer más", href: "#inteligencia-socioemocional" },
  },
  {
    title:
      "3. Desarrollo de habilidades fundamentales (lectura, escritura y matemáticas)",
    paragraphs: [
      "Acompañamos el desarrollo de la lectoescritura y el pensamiento matemático a través de metodologías estructuradas, respetuosas de los procesos individuales y reconocidas por su efectividad, integrando el aprendizaje de forma significativa y no mecánica.",
      "Basada en una metodología premiada con más de 40 años de experiencia.",
    ],
    cta: { label: "Conocer más", href: "#lectura-escritura-y-matematicas" },
  },
  {
    title: "4. Pensamiento crítico y diálogo",
    paragraphs: [
      "Generamos espacios como círculos socríticos y asambleas, donde las niñas y niños desarrollan la escucha, el pensamiento reflexivo y la capacidad de expresar ideas, cuestionar y construir conocimiento en comunidad.",
    ],
  },
  {
    title: "5. Herramientas para la vida",
    paragraphs: [
      "Integramos herramientas contemporáneas que fomentan la organización y la toma de decisiones, preparando a las niñas y niños para participar activamente en entornos cambiantes y complejos.",
      "Herramientas ágiles: Kanban, juntas de cambio etc.",
      "Proyectos personales.",
    ],
  },
  {
    title: "6. Expresión artística como eje de desarrollo",
    paragraphs: [
      "El arte es un medio fundamental para el desarrollo emocional, creativo y expresivo. A través de talleres, integramos disciplinas como las artes plásticas y escénicas como parte del proceso de aprendizaje, permitiendo que las niñas y niños elaboren su mundo interno y se expresen con libertad.",
    ],
    cta: { label: "Conocer más", href: "#expresion-artistica" },
  },
  {
    title: "7. Movimiento y desarrollo corporal",
    paragraphs: [
      "El cuerpo es parte esencial del aprendizaje.",
      "Generamos experiencias de movimiento que responden a las necesidades e intereses del grupo, ofreciendo talleres como fútbol, danza y otras actividades corporales que permiten canalizar energía, favorecer la autorregulación y fortalecer la conexión con el propio cuerpo.",
    ],
    cta: { label: "Conocer más", href: "#movimiento-y-desarrollo-corporal" },
  },
  {
    title: "8. Conciencia ecológica",
    paragraphs: [
      "Fomentamos una relación cercana y de reciprocidad con el entorno.",
      "A través del huerto, la separación de residuos y prácticas como el uso de baños secos, entre otros, las niñas y niños desarrollan conciencia ecológica desde la experiencia, comprendiendo su papel dentro de un sistema vivo.",
    ],
    cta: { label: "Quiero saber más", href: "#conciencia-ecologica" },
  },
];

export const ecoCycleStages = [
  "Semilla: El potencial comienza a emerger. Está presente, aunque aún de forma incipiente.",
  "Brote: El potencial se expresa de manera más constante y en distintos contextos.",
  "Árbol: El potencial ha madurado y se manifiesta de forma integrada en diferentes áreas de la vida.",
  "Fuego: El potencial entra en una fase de transformación, donde necesita renovarse para seguir evolucionando.",
];

export const evaluationBlocks: IllustratedTextBlock[] = [
  {
    title: "Evaluación a aprendices",
    imageSrc: "/assets/images/DSC01386.png",
    imageAlt: "Acompañante registrando procesos de aprendizaje",
    paragraphs: [
      "Entendemos la evaluación como un proceso continuo de crecimiento, y auto-observación, no como un momento aislado, ni como una definición.",
      "Observamos, registramos y compartimos el proceso de cada niñ@, haciendo visible su desarrollo en distintas dimensiones: corporal, emocional, social, cognitiva y de autogestión.",
      "Este seguimiento se construye en el día a día, a través de la interacción, la observación y el vínculo del acompañante y l@s niñ@s.",
      "Más que emitir juicios, buscamos comprender el proceso y generar acciones que apoyen el crecimiento de cada niñ@.",
      "El proceso de cada niñ@ es acompañado de manera cercana también con su familia.",
    ],
    bullets: [
      "Reconocer avances y fortalezas",
      "Identificar áreas de oportunidad",
      "Ajustar el acompañamiento",
      "Trazar nuevas rutas de desarrollo",
      "Espacios de seguimiento",
      "Comunicación continua",
      "Acuerdos compartidos",
      "Cada niñ@ cuenta con un registro donde se documentan avances, procesos y acuerdos, permitiendo que las familias estén informadas y puedan dar continuidad desde casa.",
    ],
  },
  {
    title: "Nuestra herramienta de evaluación",
    imageSrc: "/assets/images/DSC01379.png",
    imageAlt: "Niñez trabajando con herramientas de seguimiento",
    paragraphs: [
      "Utilizamos el Ecociclo como una herramienta para comprender y comunicar el desarrollo de cada niñ@ de forma integral.",
      "A diferencia de los sistemas tradicionales, el Ecociclo no mide desde la comparación, sino que reconoce el desarrollo como un proceso continuo, dinámico y en constante transformación.",
      "Este modelo permite ubicar los distintos potenciales del niñ@ dentro de un proceso evolutivo, entendiendo que cada aspecto del desarrollo tiene su propio ritmo.",
      "Las etapas del Ecociclo. El desarrollo se observa como un ciclo vivo:",
    ],
    bullets: ecoCycleStages,
    cta: { label: "Conocer más", href: "#ecociclo" },
  },
  {
    title: "Evaluación del equipo",
    imageSrc: "/assets/images/DSC01352.png",
    imageAlt: "Equipo acompañando procesos pedagógicos",
    paragraphs: [
      "El acompañamiento que ofrecemos a las niñas y niños parte de un principio fundamental: quienes acompañamos también estamos en constante aprendizaje.",
      "Por ello, sostenemos prácticas de evaluación y reflexión continua que nos permiten revisar, ajustar y enriquecer nuestra labor pedagógica y comunitaria.",
    ],
  },
  {
    title: "Evaluación entre colaboradores y familias",
    imageSrc: "/assets/images/DSC01384.png",
    imageAlt: "Comunidad educativa compartiendo acompañamiento",
    paragraphs: [
      "Fomentamos una cultura de retroalimentación basada en los principios de la Comunicación NoViolenta.",
      "A través de espacios de observación entre pares y acompañamiento pedagógico, el equipo comparte miradas, se escucha y se nutre, fortaleciendo la coherencia y la calidad del acompañamiento.",
      "Entendemos la comunidad como un sistema vivo en constante evolución.",
      "Así como acompañamos el desarrollo de cada niñ@, también observamos y ajustamos el funcionamiento del equipo, la relación con las familias y la dinámica comunitaria en su conjunto.",
    ],
  },
];



const baseStyleControls: LandingContentSlot["styleControls"] = [
  "font",
  "size",
  "color",
  "align",
  "lineHeight",
];

function textSlot({
  id,
  label,
  selectorLabel = label,
  defaultValue,
  defaultSize = 20,
  multiline = true,
  styleControls = baseStyleControls,
}: {
  id: string;
  label: string;
  selectorLabel?: string;
  defaultValue: string;
  defaultSize?: number;
  multiline?: boolean;
  styleControls?: LandingContentSlot["styleControls"];
}): LandingContentSlot {
  return {
    id,
    label,
    selectorLabel,
    defaultValue,
    defaultSize,
    multiline,
    styleControls,
  };
}

export const comoAcompanamosContentSlotIds = {
  heroEyebrow: "content.como-acompanamos.hero.eyebrow",
  heroIntro: "content.como-acompanamos.hero.intro",
  groupsTitle: "content.como-acompanamos.groups.title",
  groupsIntro: "content.como-acompanamos.groups.intro",
  methodologiesTitle: "content.como-acompanamos.methodologies.title",
  methodologiesIntro: "content.como-acompanamos.methodologies.intro",
  evaluationTitle: "content.como-acompanamos.evaluation.title",
  evaluationLead: "content.como-acompanamos.evaluation.lead",
  evaluationParagraphOne: "content.como-acompanamos.evaluation.paragraph.one",
  evaluationParagraphTwo: "content.como-acompanamos.evaluation.paragraph.two",
  evaluationCta: "content.como-acompanamos.evaluation.cta",
} as const;

export function pillarSlotId(index: number, field: "title" | "paragraph") {
  return `content.como-acompanamos.pillars.${index}.${field}`;
}

export function groupSlotId(
  index: number,
  field:
    | "title"
    | "ageRange"
    | "closing"
    | "rhythmIntro"
    | `paragraph.${number}`
    | `bullet.${number}`
    | `rhythmBullet.${number}`,
) {
  return `content.como-acompanamos.groups.${index}.${field}`;
}

export function methodologySlotId(
  index: number,
  field: "title" | "cta" | `paragraph.${number}`,
) {
  return `content.como-acompanamos.methodologies.${index}.${field}`;
}

export function evaluationBlockSlotId(
  index: number,
  field: "title" | "cta" | `paragraph.${number}` | `bullet.${number}`,
) {
  return `content.como-acompanamos.evaluation.blocks.${index}.${field}`;
}

export const hardcodedComoAcompanamosContentSlots: LandingContentSlot[] = [
  textSlot({
    id: comoAcompanamosContentSlotIds.heroEyebrow,
    label: "Hero / Volanta",
    defaultValue: accompanyCopy.eyebrow,
    defaultSize: 14,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight", "letterSpacing"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.heroIntro,
    label: "Hero / Introducción",
    defaultValue: accompanyCopy.intro,
  }),
  ...accompanyPillars.flatMap((pillar, index) => [
    textSlot({
      id: pillarSlotId(index, "title"),
      label: `Pilares / ${pillar.title} / Título`,
      selectorLabel: `Pilar ${index + 1} / Título`,
      defaultValue: pillar.title,
      defaultSize: 30,
      multiline: false,
      styleControls: ["font", "size", "color", "align", "weight"],
    }),
    textSlot({
      id: pillarSlotId(index, "paragraph"),
      label: `Pilares / ${pillar.title} / Texto`,
      selectorLabel: `Pilar ${index + 1} / Texto`,
      defaultValue: pillar.paragraphs?.[0] ?? "",
    }),
  ]),
  textSlot({
    id: comoAcompanamosContentSlotIds.groupsTitle,
    label: "Grupos / Título de sección",
    defaultValue: "Grupos de acompañamiento",
    defaultSize: 60,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.groupsIntro,
    label: "Grupos / Introducción",
    defaultValue:
      "Nuestros grupos se organizan a partir de las etapas evolutivas, respondiendo a las necesidades físicas, emocionales, sociales y cognitivas de cada momento del desarrollo.",
  }),
  ...accompanimentGroups.flatMap((group, index) => [
    textSlot({
      id: groupSlotId(index, "title"),
      label: `Grupo ${index + 1} / Título`,
      defaultValue: group.title,
      defaultSize: 34,
      multiline: false,
      styleControls: ["font", "size", "color", "align", "weight"],
    }),
    textSlot({
      id: groupSlotId(index, "ageRange"),
      label: `Grupo ${index + 1} / Edad`,
      defaultValue: group.ageRange,
      defaultSize: 30,
      multiline: false,
      styleControls: ["font", "size", "color", "align", "weight"],
    }),
    ...group.paragraphs.map((paragraph, paragraphIndex) =>
      textSlot({
        id: groupSlotId(index, `paragraph.${paragraphIndex}`),
        label: `Grupo ${index + 1} / Párrafo ${paragraphIndex + 1}`,
        defaultValue: paragraph,
      }),
    ),
    ...(group.bullets ?? []).map((bullet, bulletIndex) =>
      textSlot({
        id: groupSlotId(index, `bullet.${bulletIndex}`),
        label: `Grupo ${index + 1} / Lista ${bulletIndex + 1}`,
        defaultValue: bullet,
        multiline: false,
      }),
    ),
    ...(group.closing
      ? [
          textSlot({
            id: groupSlotId(index, "closing"),
            label: `Grupo ${index + 1} / Cierre`,
            defaultValue: group.closing,
          }),
        ]
      : []),
    ...(group.rhythmIntro
      ? [
          textSlot({
            id: groupSlotId(index, "rhythmIntro"),
            label: `Grupo ${index + 1} / Ritmo intro`,
            defaultValue: group.rhythmIntro,
          }),
        ]
      : []),
    ...(group.rhythmBullets ?? []).map((bullet, bulletIndex) =>
      textSlot({
        id: groupSlotId(index, `rhythmBullet.${bulletIndex}`),
        label: `Grupo ${index + 1} / Ritmo ${bulletIndex + 1}`,
        defaultValue: bullet,
        multiline: false,
      }),
    ),
  ]),
  textSlot({
    id: comoAcompanamosContentSlotIds.methodologiesTitle,
    label: "Metodologías / Título de sección",
    defaultValue: "Metodologías y experiencias de aprendizaje",
    defaultSize: 60,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.methodologiesIntro,
    label: "Metodologías / Introducción",
    defaultValue:
      "Nuestro enfoque pedagógico se vive a través de metodologías activas, vivenciales y transdisciplinarias que integran el pensamiento, la emoción, el cuerpo y la acción. No enseñamos contenidos aislados, sino experiencias que conectan a las niñas y niños con el mundo y consigo mism@s.",
  }),
  ...methodologies.flatMap((methodology, index) => [
    textSlot({
      id: methodologySlotId(index, "title"),
      label: `Metodología ${index + 1} / Título`,
      defaultValue: methodology.title,
      defaultSize: 24,
      multiline: false,
      styleControls: ["font", "size", "color", "align", "weight"],
    }),
    ...((methodology.paragraphs ?? []).map((paragraph, paragraphIndex) =>
      textSlot({
        id: methodologySlotId(index, `paragraph.${paragraphIndex}`),
        label: `Metodología ${index + 1} / Párrafo ${paragraphIndex + 1}`,
        defaultValue: paragraph,
      }),
    )),
    ...(methodology.cta
      ? [
          textSlot({
            id: methodologySlotId(index, "cta"),
            label: `Metodología ${index + 1} / CTA`,
            defaultValue: methodology.cta.label,
            multiline: false,
          }),
        ]
      : []),
  ]),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationTitle,
    label: "Evaluación / Título de sección",
    defaultValue: "Evaluación",
    defaultSize: 60,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationLead,
    label: "Evaluación / Bajada destacada",
    defaultValue: "Evaluamos para acompañar, no para clasificar.",
    defaultSize: 24,
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationParagraphOne,
    label: "Evaluación / Párrafo 1",
    defaultValue:
      "A través de la observación continua, el Ecociclo y el diálogo con las familias, hacemos visible el desarrollo integral de cada niñ@.",
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationParagraphTwo,
    label: "Evaluación / Párrafo 2",
    defaultValue:
      "Nuestro enfoque reconoce el aprendizaje como un proceso vivo, único y en constante evolución para toda la comunidad.",
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationCta,
    label: "Evaluación / CTA",
    defaultValue: "Conocer más",
    multiline: false,
  }),
  ...evaluationBlocks.flatMap((block, index) => [
    textSlot({
      id: evaluationBlockSlotId(index, "title"),
      label: `Evaluación bloque ${index + 1} / Título`,
      defaultValue: block.title,
      defaultSize: 24,
      multiline: false,
      styleControls: ["font", "size", "color", "align", "weight"],
    }),
    ...((block.paragraphs ?? []).map((paragraph, paragraphIndex) =>
      textSlot({
        id: evaluationBlockSlotId(index, `paragraph.${paragraphIndex}`),
        label: `Evaluación bloque ${index + 1} / Párrafo ${paragraphIndex + 1}`,
        defaultValue: paragraph,
      }),
    )),
    ...((block.bullets ?? []).map((bullet, bulletIndex) =>
      textSlot({
        id: evaluationBlockSlotId(index, `bullet.${bulletIndex}`),
        label: `Evaluación bloque ${index + 1} / Lista ${bulletIndex + 1}`,
        defaultValue: bullet,
        multiline: false,
      }),
    )),
    ...(block.cta
      ? [
          textSlot({
            id: evaluationBlockSlotId(index, "cta"),
            label: `Evaluación bloque ${index + 1} / CTA`,
            defaultValue: block.cta.label,
            multiline: false,
          }),
        ]
      : []),
  ]),
];

export function getComoAcompanamosContentSlots() {
  return hardcodedComoAcompanamosContentSlots.map((slot) => ({
    ...slot,
    label: repairLandingContentText(slot.label),
    selectorLabel: repairLandingContentText(slot.selectorLabel),
    defaultValue: repairLandingContentText(slot.defaultValue),
  }));
}

export function getComoAcompanamosContentSlotValue(
  textMap: LandingTextMap,
  slotId: string,
) {
  const slot = hardcodedComoAcompanamosContentSlots.find(
    (candidate) => candidate.id === slotId,
  );

  if (!slot) {
    return "";
  }

  return repairLandingContentText(textMap[slot.id] ?? slot.defaultValue);
}

export function resolveComoAcompanamosCopy(textMap: LandingTextMap) {
  return {
    eyebrow: getComoAcompanamosContentSlotValue(textMap, comoAcompanamosContentSlotIds.heroEyebrow),
    intro: getComoAcompanamosContentSlotValue(textMap, comoAcompanamosContentSlotIds.heroIntro),
  };
}

export function resolveAccompanyPillars(textMap: LandingTextMap): AccompanyPillar[] {
  return accompanyPillars.map((pillar, index) => ({
    ...pillar,
    title: getComoAcompanamosContentSlotValue(textMap, pillarSlotId(index, "title")),
    paragraphs: [getComoAcompanamosContentSlotValue(textMap, pillarSlotId(index, "paragraph"))],
  }));
}

export function resolveAccompanimentGroups(textMap: LandingTextMap) {
  return accompanimentGroups.map((group, index) => ({
    ...group,
    title: getComoAcompanamosContentSlotValue(textMap, groupSlotId(index, "title")),
    ageRange: getComoAcompanamosContentSlotValue(textMap, groupSlotId(index, "ageRange")),
    paragraphs: group.paragraphs.map((_, paragraphIndex) =>
      getComoAcompanamosContentSlotValue(textMap, groupSlotId(index, `paragraph.${paragraphIndex}`)),
    ),
    bullets: group.bullets?.map((_, bulletIndex) =>
      getComoAcompanamosContentSlotValue(textMap, groupSlotId(index, `bullet.${bulletIndex}`)),
    ),
    closing: group.closing
      ? getComoAcompanamosContentSlotValue(textMap, groupSlotId(index, "closing"))
      : undefined,
    rhythmIntro: group.rhythmIntro
      ? getComoAcompanamosContentSlotValue(textMap, groupSlotId(index, "rhythmIntro"))
      : undefined,
    rhythmBullets: group.rhythmBullets?.map((_, bulletIndex) =>
      getComoAcompanamosContentSlotValue(textMap, groupSlotId(index, `rhythmBullet.${bulletIndex}`)),
    ),
  }));
}

export function resolveMethodologies(textMap: LandingTextMap): TextBlock[] {
  return methodologies.map((methodology, index) => ({
    ...methodology,
    title: getComoAcompanamosContentSlotValue(textMap, methodologySlotId(index, "title")),
    paragraphs: methodology.paragraphs?.map((_, paragraphIndex) =>
      getComoAcompanamosContentSlotValue(textMap, methodologySlotId(index, `paragraph.${paragraphIndex}`)),
    ),
    cta: methodology.cta
      ? {
          ...methodology.cta,
          label: getComoAcompanamosContentSlotValue(textMap, methodologySlotId(index, "cta")),
        }
      : undefined,
  }));
}

export function resolveEvaluationBlocks(textMap: LandingTextMap): IllustratedTextBlock[] {
  return evaluationBlocks.map((block, index) => ({
    ...block,
    title: getComoAcompanamosContentSlotValue(textMap, evaluationBlockSlotId(index, "title")),
    paragraphs: block.paragraphs?.map((_, paragraphIndex) =>
      getComoAcompanamosContentSlotValue(textMap, evaluationBlockSlotId(index, `paragraph.${paragraphIndex}`)),
    ),
    bullets: block.bullets?.map((_, bulletIndex) =>
      getComoAcompanamosContentSlotValue(textMap, evaluationBlockSlotId(index, `bullet.${bulletIndex}`)),
    ),
    cta: block.cta
      ? {
          ...block.cta,
          label: getComoAcompanamosContentSlotValue(textMap, evaluationBlockSlotId(index, "cta")),
        }
      : undefined,
  }));
}
