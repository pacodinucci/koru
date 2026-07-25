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

export type LearningPrinciple = {
  title: string;
  description: string;
};

export const learningPrinciples: LearningPrinciple[] = [
  {
    title: "Asombro",
    description:
      "Aprendemos jugando, explorando y maravillÃ¡ndonos del mundo.",
  },
  {
    title: "InterconexiÃ³n",
    description:
      "Aprendemos mejor conectando ideas, experiencias y el mundo que nos rodea.",
  },
  {
    title: "PropÃ³sito",
    description:
      "Nos involucramos mÃ¡s cuando entendemos el â€œpara quÃ©â€ de lo que aprendemos.",
  },
  {
    title: "Agencia",
    description:
      "Cada quien aprende a su manera y tiene derecho a construir su propio camino.",
  },
  {
    title: "Social",
    description: "Aprender es un acto profundamente humano y relacional.",
  },
];

export const learningPrinciplesSummary =
  "El aprendizaje florece cuando existe asombro, propÃ³sito y conexiÃ³n. En Koru cultivamos experiencias que invitan a explorar, preguntar, colaborar y construir significado. Nuestros principios de aprendizaje son la brÃºjula que guÃ­a nuestra comunidad, ayudando a cada persona a convertirse en protagonista de su propio camino y a descubrir su lugar dentro de una red viva de relaciones, conocimientos y posibilidades.";


export const accompanyCopy = {
  eyebrow: "COMO ACOMPAÃ‘AMOS",
  title: "CÃ³mo acompaÃ±amos",
  intro:
    "Nuestro enfoque pedagÃ³gico integra la mirada antroposÃ³fica, la inteligencia socioemocional, el aprendizaje transdisciplinario basado en proyectos, y las habilidades basadas en diversas investigaciones que se definen como habilidades del siglo 21, promoviendo experiencias de aprendizaje que responden al desarrollo integral de cada niÃ±a y niÃ±o.",
};

export const accompanyPillars: AccompanyPillar[] = [
  {
    title: "Aprendizaje con propÃ³sito",
    imageSrc: "/assets/images/DSC01367.png",
    imageAlt: "NiÃ±as y niÃ±os explorando aprendizajes con propÃ³sito",
    paragraphs: [
      "Las niÃ±as y los niÃ±os aprenden a travÃ©s de proyectos transdisciplinarios y experiencias significativas conectadas con sus intereses, preguntas y motivaciones.",
    ],
  },
  {
    title: "AcompaÃ±amiento personalizado",
    imageSrc: "/assets/images/DSC01352.png",
    imageAlt: "AcompaÃ±amiento personalizado en comunidad",
    paragraphs: [
      "Reconocemos que cada niÃ±a y niÃ±o es Ãºnico. Por ello, adaptamos la propuesta educativa a sus intereses, necesidades y etapas evolutivas, respetando la singularidad de cada proceso de aprendizaje.",
    ],
  },
  {
    title: "Desarrollo integral",
    imageSrc: "/assets/images/DSC01378.png",
    imageAlt: "NiÃ±ez desarrollando capacidades integrales",
    paragraphs: [
      "Cultivamos capacidades cognitivas, emocionales, sociales y prÃ¡cticas que permiten a niÃ±as y niÃ±os desenvolverse con confianza, creatividad y sentido de propÃ³sito en un mundo cambiante.",
    ],
  },
  {
    title: "Comunidad y naturaleza",
    imageSrc: "/assets/images/DSC01384.png",
    imageAlt: "Comunidad educativa en conexiÃ³n con la naturaleza",
    paragraphs: [
      "Entendemos el aprendizaje como un proceso relacional. Aprendemos en comunidad y en conexiÃ³n con la naturaleza, reconociendo que formamos parte de sistemas vivos interdependientes.",
    ],
  },
];

// const cultivatedSkills = [
//   "Pensamiento crÃ­tico",
//   "ColaboraciÃ³n",
//   "ComunicaciÃ³n",
//   "Creatividad",
//   "Inteligencia socioemocional",
//   "ConexiÃ³n con la naturaleza",
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
      "Diálogo Socrático.",
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
    title: "1. Fundamentos AntroposÃ³ficos",
    paragraphs: [
      "En Koru, hemos escogido ciertos fundamentos antroposÃ³ficos a travÃ©s de: generar un ritmo de inhalaciÃ³n y exhalaciÃ³n claro y predecible, ritos y rituales del dÃ­a a dÃ­a, contacto con la naturaleza, expresiÃ³n artÃ­stica y juego libre. De esta mirada nacen los hitos de madurez que nos guÃ­an en la creaciÃ³n de las planeaciones transdisciplinarias.",
    ],
  },
  {
    title: "2. Aprendizaje Transdisciplinario",
    paragraphs: [
      "Desarrollamos proyectos que integran distintas Ã¡reas del conocimiento, permitiendo que las niÃ±as y niÃ±os comprendan la realidad de manera conectada y significativa. A travÃ©s de estos procesos, investigan, crean, colaboran y encuentran sentido en lo que aprenden.",
      "En Koru adoptamos el aprendizaje transdisciplinario porque el mundo actual exige pensar y actuar mÃ¡s allÃ¡ de las fronteras disciplinarias. La realidad es compleja, interconectada y en constante cambio, por lo que guiamos el aprendizaje social hacia la integraciÃ³n del conocimiento, la creatividad y la resoluciÃ³n de problemas reales.",
      "La transdisciplinariedad fomenta el pensamiento crÃ­tico, la colaboraciÃ³n y el aprendizaje basado en la experiencia, permitiendo que los aprendices construyan significado de manera profunda.",
      "Al cruzar y conectar saberes, promovemos una educaciÃ³n viva, flexible y en evoluciÃ³n, donde cada persona desarrolla herramientas para comprender y transformar su entorno con sensibilidad y propÃ³sito.",
    ],
  },
  {
    title: "3. Desarrollo Socio-Emocional",
    paragraphs: [
      "AcompaÃ±amos los procesos socioemocionales desde la escucha, la empatÃ­a y el respeto.",
      "Integramos herramientas como la ComunicaciÃ³n NoViolenta para gestionar conflictos, fortalecer la colaboraciÃ³n y desarrollar la capacidad de expresar necesidades y sentimientos de manera clara y cuidadosa.",
      "Exploramos lenguajes y mapas de las emociones para poder ser mÃ¡s precisos a la hora de entender lo que nos sucede y poder tomar mejores decisiones y desarrollar la conexiÃ³n con los demÃ¡s y una comunicaciÃ³n asertiva.",
      "AsÃ­, se fortalece la cultura de paz, sostenida por el diÃ¡logo, respeto y responsabilidad compartida, que nos permite crecer juntos como seres humanos y en el desarrollo socio emocional de Koru OSA.",
    ],
  },
  {
    title:
      "4. Desarrollo de habilidades fundamentales (lectura, escritura y matemÃ¡ticas)",
    paragraphs: [
      "AcompaÃ±amos el desarrollo de la lectoescritura y el pensamiento matemÃ¡tico a travÃ©s de metodologÃ­as estructuradas, respetuosas de los procesos individuales y reconocidas por su efectividad, integrando el aprendizaje de forma significativa y no mecÃ¡nica.",
      "Basada en una metodologÃ­a premiada con mÃ¡s de 40 aÃ±os de experiencia.",
    ],
    cta: { label: "Conocer mÃ¡s", href: "#lectura-escritura-y-matematicas" },
  },
  {
    title: "5. Conciencia ecolÃ³gica",
    paragraphs: [
      "Fomentamos una relaciÃ³n cercana y de reciprocidad con el entorno.",
      "A travÃ©s del huerto, habilidades de supervivencia, caminatas en el bosque, separaciÃ³n de residuos y prÃ¡cticas como el uso de baÃ±os secos, entre otros, las niÃ±as y niÃ±os desarrollan conciencia ecolÃ³gica desde la experiencia, comprendiendo su papel dentro de un sistema vivo.",
    ],
    cta: { label: "Quiero saber mÃ¡s", href: "#conciencia-ecologica" },
  },
  {
    title: "6. Pensamiento crÃ­tico y diÃ¡logo",
    paragraphs: [
      "Generamos espacios como cÃ­rculos socrÃ¡ticos y asambleas, donde las niÃ±as y niÃ±os desarrollan la escucha, el pensamiento reflexivo y la capacidad de expresar ideas, cuestionar y construir conocimiento en comunidad.",
    ],
  },
  {
    title: "7. ExpresiÃ³n artÃ­stica",
    paragraphs: [
      "El arte es un medio fundamental para el desarrollo emocional, creativo y expresivo. A travÃ©s de talleres, integramos disciplinas como las artes plÃ¡sticas y escÃ©nicas como parte del proceso de aprendizaje, permitiendo que las niÃ±as y niÃ±os elaboren su mundo interno y se expresen con libertad.",
    ],
    cta: { label: "Conocer mÃ¡s", href: "#expresion-artistica" },
  },
  {
    title: "8. Movimiento y desarrollo corporal",
    paragraphs: [
      "El cuerpo es parte esencial del aprendizaje.",
      "Generamos experiencias de movimiento que responden a las necesidades e intereses del grupo, ofreciendo talleres como circo, fÃºtbol, danza y otras actividades corporales que permiten canalizar energÃ­a, favorecer la autorregulaciÃ³n y fortalecer la conexiÃ³n con el propio cuerpo.",
    ],
  },
];

export const ecoCycleStages = [
  "Semilla: El potencial comienza a emerger. EstÃ¡ presente, aunque aÃºn de forma incipiente.",
  "Brote: El potencial se expresa de manera mÃ¡s constante y en distintos contextos.",
  "Ãrbol: El potencial ha madurado y se manifiesta de forma integrada en diferentes Ã¡reas de la vida.",
  "Fuego: El potencial entra en una fase de transformaciÃ³n, donde necesita renovarse para seguir evolucionando.",
];

export const evaluationBlocks: IllustratedTextBlock[] = [
  {
    title: "EvaluaciÃ³n a aprendices",
    imageSrc: "/assets/images/DSC01386.png",
    imageAlt: "AcompaÃ±ante registrando procesos de aprendizaje",
    paragraphs: [
      "Entendemos la evaluaciÃ³n como un proceso continuo de crecimiento, y auto-observaciÃ³n, no como un momento aislado, ni como una definiciÃ³n.",
      "Observamos, registramos y compartimos el proceso de cada niÃ±@, haciendo visible su desarrollo en distintas dimensiones: corporal, emocional, social, cognitiva y de autogestiÃ³n.",
      "Este seguimiento se construye en el dÃ­a a dÃ­a, a travÃ©s de la interacciÃ³n, la observaciÃ³n y el vÃ­nculo del acompaÃ±ante y l@s niÃ±@s.",
      "MÃ¡s que emitir juicios, buscamos comprender el proceso y generar acciones que apoyen el crecimiento de cada niÃ±@.",
      "El proceso de cada niÃ±@ es acompaÃ±ado de manera cercana tambiÃ©n con su familia.",
    ],
    bullets: [
      "Reconocer avances y fortalezas",
      "Identificar Ã¡reas de oportunidad",
      "Ajustar el acompaÃ±amiento",
      "Trazar nuevas rutas de desarrollo",
      "Espacios de seguimiento",
      "ComunicaciÃ³n continua",
      "Acuerdos compartidos",
      "Cada niÃ±@ cuenta con un registro donde se documentan avances, procesos y acuerdos, permitiendo que las familias estÃ©n informadas y puedan dar continuidad desde casa.",
    ],
  },
  {
    title: "Nuestra herramienta de evaluaciÃ³n",
    imageSrc: "/assets/images/DSC01379.png",
    imageAlt: "NiÃ±ez trabajando con herramientas de seguimiento",
    paragraphs: [
      "Utilizamos el Ecociclo como una herramienta para comprender y comunicar el desarrollo de cada niÃ±@ de forma integral.",
      "A diferencia de los sistemas tradicionales, el Ecociclo no mide desde la comparaciÃ³n, sino que reconoce el desarrollo como un proceso continuo, dinÃ¡mico y en constante transformaciÃ³n.",
      "Este modelo permite ubicar los distintos potenciales del niÃ±@ dentro de un proceso evolutivo, entendiendo que cada aspecto del desarrollo tiene su propio ritmo.",
      "Las etapas del Ecociclo. El desarrollo se observa como un ciclo vivo:",
    ],
    bullets: ecoCycleStages,
    cta: { label: "Conocer mÃ¡s", href: "#ecociclo" },
  },
  {
    title: "EvaluaciÃ³n del equipo",
    imageSrc: "/assets/images/DSC01352.png",
    imageAlt: "Equipo acompaÃ±ando procesos pedagÃ³gicos",
    paragraphs: [
      "El acompaÃ±amiento que ofrecemos a las niÃ±as y niÃ±os parte de un principio fundamental: quienes acompaÃ±amos tambiÃ©n estamos en constante aprendizaje.",
      "Por ello, sostenemos prÃ¡cticas de evaluaciÃ³n y reflexiÃ³n continua que nos permiten revisar, ajustar y enriquecer nuestra labor pedagÃ³gica y comunitaria.",
    ],
  },
  {
    title: "EvaluaciÃ³n entre colaboradores y familias",
    imageSrc: "/assets/images/DSC01384.png",
    imageAlt: "Comunidad educativa compartiendo acompaÃ±amiento",
    paragraphs: [
      "Fomentamos una cultura de retroalimentaciÃ³n basada en los principios de la ComunicaciÃ³n NoViolenta.",
      "A travÃ©s de espacios de observaciÃ³n entre pares y acompaÃ±amiento pedagÃ³gico, el equipo comparte miradas, se escucha y se nutre, fortaleciendo la coherencia y la calidad del acompaÃ±amiento.",
      "Entendemos la comunidad como un sistema vivo en constante evoluciÃ³n.",
      "AsÃ­ como acompaÃ±amos el desarrollo de cada niÃ±@, tambiÃ©n observamos y ajustamos el funcionamiento del equipo, la relaciÃ³n con las familias y la dinÃ¡mica comunitaria en su conjunto.",
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
  learningPrinciplesSummary:
    "content.como-acompanamos.learning-principles.summary",
  connectedLearningTitle:
    "content.como-acompanamos.connected-learning.title",
  connectedLearningText:
    "content.como-acompanamos.connected-learning.text",
  integralDevelopmentTitle:
    "content.como-acompanamos.integral-development.title",
  integralDevelopmentText:
    "content.como-acompanamos.integral-development.text",
  groupsTitle: "content.como-acompanamos.groups.title",
  groupsIntro: "content.como-acompanamos.groups.intro",
  methodologiesTitle: "content.como-acompanamos.methodologies.title",
  methodologiesIntro: "content.como-acompanamos.methodologies.intro",
  evaluationTitle: "content.como-acompanamos.evaluation.title",
  evaluationLead: "content.como-acompanamos.evaluation.lead",
  evaluationParagraphOne: "content.como-acompanamos.evaluation.paragraph.one",
  evaluationParagraphTwo: "content.como-acompanamos.evaluation.paragraph.two",
  evaluationParagraphThree: "content.como-acompanamos.evaluation.paragraph.three",
  evaluationCta: "content.como-acompanamos.evaluation.cta",
} as const;

export function pillarSlotId(index: number, field: "title" | "paragraph") {
  return `content.como-acompanamos.pillars.${index}.${field}`;
}

export function learningPrincipleSlotId(
  index: number,
  field: "title" | "description",
) {
  return `content.como-acompanamos.learning-principles.${index}.${field}`;
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
    label: "Hero / IntroducciÃ³n",
    defaultValue: accompanyCopy.intro,
  }),
  ...learningPrinciples.flatMap((principle, index) => [
    textSlot({
      id: learningPrincipleSlotId(index, "title"),
      label: `Principios de aprendizaje / ${principle.title} / Titulo`,
      selectorLabel: `Principio ${index + 1} / Titulo`,
      defaultValue: principle.title,
      defaultSize: 24,
      multiline: false,
      styleControls: ["font", "size", "color", "align", "weight"],
    }),
    textSlot({
      id: learningPrincipleSlotId(index, "description"),
      label: `Principios de aprendizaje / ${principle.title} / Texto`,
      selectorLabel: `Principio ${index + 1} / Texto`,
      defaultValue: principle.description,
    }),
  ]),
  textSlot({
    id: comoAcompanamosContentSlotIds.learningPrinciplesSummary,
    label: "Principios de aprendizaje / Texto de cierre",
    defaultValue: learningPrinciplesSummary,
    defaultSize: 20,
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.connectedLearningTitle,
    label: "AcompaÃ±amiento conectado / TÃ­tulo",
    defaultValue: "AcompaÃ±amiento conectado a su ritmo de aprendizaje",
    defaultSize: 24,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.connectedLearningText,
    label: "AcompaÃ±amiento conectado / Texto",
    defaultValue:
      "DiseÃ±amos experiencias de aprendizaje acordes a cada etapa del desarrollo. Observamos de cerca a cada niÃ±a y niÃ±o para brindar el acompaÃ±amiento y las estrategias que favorezcan su crecimiento integral, respetando su singularidad.",
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.integralDevelopmentTitle,
    label: "Desarrollo integral / TÃ­tulo",
    defaultValue: "Buscamos un desarrollo integral.",
    defaultSize: 60,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.integralDevelopmentText,
    label: "Desarrollo integral / Texto",
    defaultValue:
      "En Koru promovemos el desarrollo integral de cada niÃ±a y niÃ±o, cultivando sus capacidades fÃ­sicas, emocionales, sociales, cognitivas, intuitivas y creativas. A travÃ©s de experiencias significativas y prÃ¡cticas respetuosas, favorecemos un ambiente de confianza, seguridad y pertenencia que les permite crecer de manera plena, fortaleciendo su bienestar y su relaciÃ³n consigo mismos, con los demÃ¡s y con la naturaleza.",
  }),
  ...accompanyPillars.flatMap((pillar, index) => [
    textSlot({
      id: pillarSlotId(index, "title"),
      label: `Pilares / ${pillar.title} / TÃ­tulo`,
      selectorLabel: `Pilar ${index + 1} / TÃ­tulo`,
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
    label: "Grupos / TÃ­tulo de secciÃ³n",
    defaultValue: "Grupos de acompaÃ±amiento",
    defaultSize: 60,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.groupsIntro,
    label: "Grupos / IntroducciÃ³n",
    defaultValue:
      "Nuestros grupos se organizan a partir de las etapas evolutivas, respondiendo a las necesidades fÃ­sicas, emocionales, sociales y cognitivas de cada momento del desarrollo.",
  }),
  ...accompanimentGroups.flatMap((group, index) => [
    textSlot({
      id: groupSlotId(index, "title"),
      label: `Grupo ${index + 1} / TÃ­tulo`,
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
        label: `Grupo ${index + 1} / PÃ¡rrafo ${paragraphIndex + 1}`,
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
    label: "MetodologÃ­as / TÃ­tulo de secciÃ³n",
    defaultValue: "MetodologÃ­as y experiencias de aprendizaje",
    defaultSize: 60,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.methodologiesIntro,
    label: "MetodologÃ­as / IntroducciÃ³n",
    defaultValue:
      "Nuestro enfoque pedagÃ³gico se vive a travÃ©s de metodologÃ­as activas, vivenciales y transdisciplinarias que integran el pensamiento, la emociÃ³n, el cuerpo y la acciÃ³n. No enseÃ±amos contenidos aislados, sino experiencias que conectan a las niÃ±as y niÃ±os con el mundo y consigo mism@s.",
  }),
  ...methodologies.flatMap((methodology, index) => [
    textSlot({
      id: methodologySlotId(index, "title"),
      label: `MetodologÃ­a ${index + 1} / TÃ­tulo`,
      defaultValue: methodology.title,
      defaultSize: 24,
      multiline: false,
      styleControls: ["font", "size", "color", "align", "weight"],
    }),
    ...((methodology.paragraphs ?? []).map((paragraph, paragraphIndex) =>
      textSlot({
        id: methodologySlotId(index, `paragraph.${paragraphIndex}`),
        label: `MetodologÃ­a ${index + 1} / PÃ¡rrafo ${paragraphIndex + 1}`,
        defaultValue: paragraph,
      }),
    )),
    ...(methodology.cta
      ? [
          textSlot({
            id: methodologySlotId(index, "cta"),
            label: `MetodologÃ­a ${index + 1} / CTA`,
            defaultValue: methodology.cta.label,
            multiline: false,
          }),
        ]
      : []),
  ]),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationTitle,
    label: "EvaluaciÃ³n / TÃ­tulo de secciÃ³n",
    defaultValue: "EvaluaciÃ³n",
    defaultSize: 60,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationLead,
    label: "EvaluaciÃ³n / Bajada destacada",
    defaultValue: "Evaluamos para acompaÃ±ar, no para clasificar.",
    defaultSize: 24,
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationParagraphOne,
    label: "EvaluaciÃ³n / PÃ¡rrafo 1",
    defaultValue:
      "A travÃ©s de la observaciÃ³n continua, el Ecociclo y el diÃ¡logo con las familias, hacemos visible el desarrollo integral de cada niÃ±@.",
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationParagraphTwo,
    label: "EvaluaciÃ³n / PÃ¡rrafo 2",
    defaultValue:
      "Nuestro enfoque reconoce el aprendizaje como un proceso vivo, Ãºnico y en constante evoluciÃ³n para toda la comunidad.",
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationParagraphThree,
    label: "Evaluación / Párrafo 3",
    defaultValue:
      "Nuestra evaluación no se limita a l@s aprendices, si no que tanto el equipo de acompañantes como las familias mantienen un proceso de observación auto-observación y retroalimentación constante que nos ayuda a seguir mejorando.",
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.evaluationCta,
    label: "EvaluaciÃ³n / CTA",
    defaultValue: "Conocer mÃ¡s",
    multiline: false,
  }),
  ...evaluationBlocks.flatMap((block, index) => [
    textSlot({
      id: evaluationBlockSlotId(index, "title"),
      label: `EvaluaciÃ³n bloque ${index + 1} / TÃ­tulo`,
      defaultValue: block.title,
      defaultSize: 24,
      multiline: false,
      styleControls: ["font", "size", "color", "align", "weight"],
    }),
    ...((block.paragraphs ?? []).map((paragraph, paragraphIndex) =>
      textSlot({
        id: evaluationBlockSlotId(index, `paragraph.${paragraphIndex}`),
        label: `EvaluaciÃ³n bloque ${index + 1} / PÃ¡rrafo ${paragraphIndex + 1}`,
        defaultValue: paragraph,
      }),
    )),
    ...((block.bullets ?? []).map((bullet, bulletIndex) =>
      textSlot({
        id: evaluationBlockSlotId(index, `bullet.${bulletIndex}`),
        label: `EvaluaciÃ³n bloque ${index + 1} / Lista ${bulletIndex + 1}`,
        defaultValue: bullet,
        multiline: false,
      }),
    )),
    ...(block.cta
      ? [
          textSlot({
            id: evaluationBlockSlotId(index, "cta"),
            label: `EvaluaciÃ³n bloque ${index + 1} / CTA`,
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

function repairLearningPrincipleText(value: string) {
  return value
    .replaceAll("Interconexi?n", "InterconexiÃ³n")
    .replaceAll("Prop?sito", "PropÃ³sito")
    .replaceAll("maravill?ndonos", "maravillÃ¡ndonos")
    .replaceAll("m?s", "mÃ¡s")
    .replaceAll("?para qu??", "â€œpara quÃ©â€")
    .replaceAll("para qu?", "para quÃ©");
}

export function resolveLearningPrinciples(
  textMap: LandingTextMap,
): LearningPrinciple[] {
  return learningPrinciples.map((principle, index) => ({
    ...principle,
    title: repairLearningPrincipleText(
      getComoAcompanamosContentSlotValue(
        textMap,
        learningPrincipleSlotId(index, "title"),
      ),
    ),
    description: repairLearningPrincipleText(
      getComoAcompanamosContentSlotValue(
        textMap,
        learningPrincipleSlotId(index, "description"),
      ),
    ),
  }));
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
