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
    description: "Aprendemos jugando, explorando y maravillándonos del mundo.",
  },
  {
    title: "Interconexión",
    description:
      "Aprendemos mejor conectando ideas, experiencias y el mundo que nos rodea.",
  },
  {
    title: "Propósito",
    description:
      "Nos involucramos más cuando entendemos el “para qué” de lo que aprendemos.",
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
  "El aprendizaje florece cuando existe asombro, propósito y conexión. En Koru cultivamos experiencias que invitan a explorar, preguntar, colaborar y construir significado. Nuestros principios de aprendizaje son la brújula que guía nuestra comunidad, ayudando a cada persona a convertirse en protagonista de su propio camino y a descubrir su lugar dentro de una red viva de relaciones, conocimientos y posibilidades.";

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

export type Methodology = TextBlock & {
  slug: string;
  detailParagraphs?: string[];
  cardHighlight?: string;
  ctaLabel?: string;
  imageSrc: string;
  imageAlt: string;
};

export type AccompanimentExperienceCard = {
  title: string;
  imageSrc: string;
  imageAlt: string;
  description: string;
};

export type AccompanimentGroup = {
  title: string;
  ageRange: string;
  imageSrc: string;
  imageAlt: string;
  paragraphs: string[];
  hideRhythmSection: boolean;
  experienceCards: AccompanimentExperienceCard[];
  bullets?: string[];
  closing?: string;
  rhythmIntro?: string;
  rhythmBullets?: string[];
};

export const accompanimentGroups: AccompanimentGroup[] = [
  {
    title: "Grupo Esporas",
    ageRange: "3 a 6 años",
    imageSrc: "/assets/images/DSC01338.png",
    imageAlt: "Niñas y niños pequeños explorando en la naturaleza",
    paragraphs: [
      "Los primeros años de vida constituyen una etapa fundamental para el desarrollo humano. Niñas y niños aprenden principalmente a través del juego, la imitación, el movimiento, la exploración sensorial y el vínculo con las personas y el entorno.",
      "En KORU, Grupo Esporas se inspira profundamente en la pedagogía Waldorf y en los fundamentos antroposóficos para ofrecer un ambiente cálido, seguro y predecible, donde los ritmos, los rituales y el contacto cotidiano con la naturaleza favorecen un desarrollo armónico del cuerpo, el pensamiento, el sentimiento y la voluntad.",
      "En esta etapa cultivamos las capacidades que hacen posible aprender: la atención, el lenguaje, la motricidad, la coordinación, la imaginación, la creatividad, la convivencia y la autorregulación. A través del juego libre, el arte, el movimiento, la música, los cuentos, la exploración del entorno y la vida en la naturaleza, niñas y niños construyen las bases que sostendrán los aprendizajes de las siguientes etapas.",
      "Como parte de la experiencia cotidiana, también ofrecemos una inmersión natural al idioma inglés mediante canciones, juegos, cuentos, rutinas y experiencias significativas, favoreciendo un aprendizaje espontáneo y vivencial desde edades tempranas.",
      "El propósito de esta etapa es construir una base sólida de seguridad, autonomía, curiosidad y confianza, desde la cual cada niña y niño pueda continuar su desarrollo con alegría y el deseo de seguir descubriendo el mundo.",
    ],
    hideRhythmSection: true,
    experienceCards: [
      {
        title: "Vida práctica:",
        imageSrc: "/assets/images/DSC01338.png",
        imageAlt: "Niñas y niños preparando actividades de vida práctica",
        description:
          "Las actividades cotidianas —como preparar pan, cocinar, lavar platos, ordenar los espacios y cuidar el entorno— fortalecen la autonomía, la coordinación, la concentración, el sentido de responsabilidad y la satisfacción de contribuir al bienestar de la comunidad.",
      },
      {
        title: "Ritmo estacional",
        imageSrc: "/assets/images/DSC01339.png",
        imageAlt: "Niñas y niños conectando con el ritmo estacional",
        description:
          "Las estaciones del año y sus festividades marcan el ritmo de la vida en el grupo. A través de celebraciones, cuentos, canciones y actividades vinculadas con la naturaleza, niñas y niños desarrollan un profundo sentido de pertenencia, gratitud y conexión con los ciclos de la vida.",
      },
      {
        title: "Trabajo manual",
        imageSrc: "/assets/images/DSC01340.png",
        imageAlt: "Actividad manual en el grupo Esporas",
        description:
          "El tejido, el modelado con cera de abeja, el huerto y otras actividades manuales fortalecen la motricidad fina, la creatividad, la paciencia y la voluntad, permitiendo aprender a través del hacer.",
      },
      {
        title: "Arte y movimiento",
        imageSrc: "/assets/images/DSC01342.png",
        imageAlt: "Niñas y niños en experiencias de arte y movimiento",
        description:
          "El canto, las rondas, las danzas, los juegos rítmicos y las experiencias artísticas favorecen la coordinación, la expresión, la imaginación y el desarrollo corporal, integrando el aprendizaje de manera vivencial y alegre.",
      },
      {
        title: "Inglés",
        imageSrc: "/assets/images/DSC01344.png",
        imageAlt: "Aprendizaje vivencial de inglés en Koru",
        description:
          "El idioma inglés se incorpora de forma natural mediante canciones, versos, cuentos, juegos y rutinas cotidianas, favoreciendo una inmersión respetuosa y significativa desde edades tempranas.",
      },
      {
        title: "Naturaleza y compostaje",
        imageSrc: "/assets/images/DSC01345.png",
        imageAlt: "Niñez explorando naturaleza, huerto y compostaje",
        description:
          "El jardín, el huerto, el compostaje y el cuidado cotidiano del entorno acercan a niñas y niños a los procesos naturales, despertando una conciencia ecológica que nace del vínculo, la observación y la experiencia directa.",
      },
      {
        title: "Juego libre",
        imageSrc: "/assets/images/DSC01350.png",
        imageAlt: "Niñas y niños en juego libre",
        description:
          "El juego es el lenguaje natural de la infancia y el principal medio de aprendizaje durante esta etapa. A través de él desarrollan la imaginación, la creatividad, las habilidades sociales, la resolución de problemas y la capacidad de dar sentido a sus experiencias.",
      },
      {
        title: "Cuento y narración",
        imageSrc: "/assets/images/DSC01352.png",
        imageAlt: "Momento de cuento y narración en comunidad",
        description:
          "Cada día reservamos un momento para escuchar cuentos, relatos y narraciones que nutren la imaginación, enriquecen el lenguaje, fortalecen la atención y ofrecen imágenes significativas que acompañan el desarrollo emocional y cognitivo.",
      },
    ],
  },
  {
    title: "Grupo Koru",
    ageRange: "6 a 8 años",
    imageSrc: "/assets/images/DSC01384.png",
    imageAlt: "Niñas y niños en una etapa de transición de aprendizaje",
    paragraphs: [
      "Esta etapa representa un puente entre la primera infancia y el siguiente momento del desarrollo. Niñas y niños comienzan a ampliar su mirada sobre el mundo, formulando preguntas, estableciendo relaciones y construyendo una comprensión cada vez más consciente de aquello que los rodea.",
      "En KORU, los proyectos, las experiencias sensoriales, las narraciones, el juego y la exploración continúan siendo el punto de partida para aprender. A partir de ellos comenzamos a integrar el enfoque transdisciplinario, permitiendo que el conocimiento cobre sentido al relacionarse con la vida cotidiana.",
      "Es también una etapa clave para el desarrollo de la lectoescritura y el pensamiento matemático. Primero fortalecemos las capacidades que hacen posibles estos aprendizajes desde una mirada inspirada en la pedagogía antroposófica y, conforme cada niña y niño muestra las señales de madurez necesarias, realizamos una transición gradual hacia una metodología especializada con más de 40 años de experiencia. Creemos que aprender en el momento adecuado no significa aprender más tarde, sino aprender con mayor profundidad, confianza y sentido.",
      "El propósito de esta etapa es acompañar el paso de una infancia que aprende principalmente desde la experiencia hacia una que comienza a comprender, relacionar y construir conocimiento de manera cada vez más consciente.",
    ],
    hideRhythmSection: true,
    experienceCards: [
      {
        title: "Trabajo manual",
        imageSrc: "/assets/images/DSC01363.png",
        imageAlt: "Niñas y niños realizando trabajo manual",
        description:
          "El tejido, el modelado con barro y plastilina, el huerto y otras experiencias manuales fortalecen la motricidad fina, la creatividad, la concentración y la perseverancia, integrando el pensamiento, la emoción y la voluntad a través del hacer.",
      },
      {
        title: "Arte y movimiento",
        imageSrc: "/assets/images/DSC01365.png",
        imageAlt: "Experiencia de arte y movimiento en Grupo Koru",
        description:
          "Las artes plásticas y las clases de circo favorecen la creatividad, la coordinación, el equilibrio, la conciencia corporal y la confianza, acompañando el desarrollo integral mediante experiencias de expresión y movimiento.",
      },
      {
        title: "Inglés",
        imageSrc: "/assets/images/DSC01367.png",
        imageAlt: "Aprendizaje vivencial de inglés en Grupo Koru",
        description:
          "El idioma inglés continúa desarrollándose de manera vivencial a través de canciones, cuentos, versos, juegos y actividades cotidianas, ampliando progresivamente la comprensión y la comunicación en un segundo idioma.",
      },
      {
        title: "Exploración sensorial",
        imageSrc: "/assets/images/DSC01378.png",
        imageAlt: "Niñas y niños explorando la naturaleza",
        description:
          "La cocina, las caminatas en la naturaleza y otras experiencias sensoriales permiten observar, experimentar y comprender el mundo desde el hacer, despertando la curiosidad, la atención y el pensamiento científico.",
      },
      {
        title: "Música",
        imageSrc: "/assets/images/DSC01379.png",
        imageAlt: "Experiencia musical en Grupo Koru",
        description:
          "Las rítmicas, el canto y el repertorio de canciones tradicionales fortalecen la escucha, la memoria, el ritmo, la coordinación y la sensibilidad musical, acompañando el desarrollo del lenguaje y la expresión.",
      },
      {
        title: "Lectoescritura",
        imageSrc: "/assets/images/DSC01384.png",
        imageAlt: "Aprendizaje de lectoescritura en Grupo Koru",
        description:
          "El acercamiento a la lectoescritura inicia desde una mirada inspirada en la pedagogía antroposófica. Las vocales se presentan mediante el dibujo de formas, el movimiento, la narración y la experiencia artística, permitiendo que el lenguaje se construya desde la vivencia antes que desde la abstracción. Conforme cada niña y niño muestra las señales de madurez necesarias, realizamos una transición gradual hacia una metodología especializada con más de 40 años de experiencia, fortaleciendo la comprensión lectora, la escritura y las primeras habilidades de redacción.",
      },
      {
        title: "Pensamiento matemático",
        imageSrc: "/assets/images/DSC01385.png",
        imageAlt: "Experiencia de pensamiento matemático en Grupo Koru",
        description:
          "Las matemáticas se presentan como un lenguaje para comprender el mundo. A través de materiales concretos, juegos, desafíos y experiencias significativas, niñas y niños desarrollan el razonamiento lógico-matemático, el sentido numérico y la capacidad para descubrir relaciones y resolver problemas.",
      },
      {
        title: "Ritmo estacional",
        imageSrc: "/assets/images/DSC01386.png",
        imageAlt: "Niñas y niños conectando con el ritmo estacional",
        description:
          "Las estaciones del año y sus festividades continúan marcando el ritmo de la vida del grupo, fortaleciendo el vínculo con la naturaleza, la comunidad y los ciclos que nos rodean.",
      },
      {
        title: "Huerto y compostaje",
        imageSrc: "/assets/images/DSC01392.png",
        imageAlt: "Huerto y compostaje en Grupo Koru",
        description:
          "El huerto, el compostaje y el cuidado cotidiano del entorno permiten comprender los procesos de la naturaleza desde la experiencia directa, despertando una conciencia ecológica basada en el vínculo, la observación y el cuidado.",
      },
      {
        title: "Juego",
        imageSrc: "/assets/images/DSC01400.png",
        imageAlt: "Niñas y niños jugando en Grupo Koru",
        description:
          "El juego continúa siendo una herramienta esencial de aprendizaje. A través de él, niñas y niños exploran ideas, ponen a prueba hipótesis, desarrollan habilidades sociales y construyen conocimiento de manera activa y significativa.",
      },
      {
        title: "Calma y narración",
        imageSrc: "/assets/images/DSC01443.png",
        imageAlt: "Momento de calma y narración en Grupo Koru",
        description:
          "Cada día reservamos un momento para la calma, los cuentos y la narración, favoreciendo la imaginación, la atención, la comprensión del lenguaje y la integración de las experiencias vividas durante la jornada.",
      },
    ],
  },
  {
    title: "Grupo Helechos 1",
    ageRange: "8 a 10 años",
    imageSrc: "/assets/images/DSC01379.png",
    imageAlt: "Grupo escolar en actividades colaborativas",
    paragraphs: [
      "Durante esta etapa comienza a emerger un pensamiento cada vez más abstracto. Niñas y niños desarrollan una mayor capacidad para analizar, establecer relaciones, formular hipótesis y comprender la realidad desde múltiples perspectivas, participando de manera cada vez más activa en su propio proceso de aprendizaje.",
      "En KORU, el enfoque transdisciplinario, inspirado en los fundamentos antroposóficos, se convierte en la principal forma de aprender. Los proyectos integran las ciencias, el lenguaje, las matemáticas, el arte y otras áreas del conocimiento alrededor de preguntas, desafíos y experiencias significativas. Así, el aprendizaje deja de vivirse como materias aisladas y se convierte en una experiencia conectada con la vida cotidiana y el entorno.",
      "Aunque el aprendizaje ocurre principalmente a través de proyectos, también dedicamos espacios específicos al fortalecimiento de aquellas habilidades que constituyen la base para seguir aprendiendo. En lenguaje, damos un lugar prioritario al razonamiento verbal, la comprensión lectora, la creación literaria y la expresión escrita. En matemáticas, continuamos desarrollando el pensamiento lógico-matemático y la resolución de problemas, favoreciendo que niñas y niños puedan aplicar lo aprendido en diferentes contextos y construir una comprensión cada vez más profunda.",
      "Como parte del desarrollo integral de esta etapa, incorporamos clases de flauta, inspiradas en la pedagogía Waldorf, que fortalecen la coordinación, la atención, la escucha, la perseverancia y la sensibilidad artística. Asimismo, el teatro se convierte en un espacio para desarrollar la expresión, la creatividad, la confianza, la empatía y las habilidades sociales. Estas experiencias se complementan con el movimiento, la naturaleza y la educación socioemocional, enriqueciendo el aprendizaje desde múltiples lenguajes.",
      "El propósito de esta etapa es fortalecer la autonomía, el pensamiento crítico y la confianza en sus capacidades, preparando a niñas y niños para comprender la realidad con mayor profundidad y participar de manera consciente, creativa y responsable en la construcción de su comunidad.",
    ],
    hideRhythmSection: true,
    experienceCards: [
      {
        title: "Proyectos Transdisciplinarios",
        imageSrc: "/assets/images/DSC01638.png",
        imageAlt: "Proyecto transdisciplinario en Grupo Helechos 1",
        description:
          "El aprendizaje se organiza alrededor de proyectos que integran ciencias, historia, geografía, lenguaje, matemáticas, arte y otras áreas del conocimiento. A través de preguntas, investigaciones y desafíos reales, niñas y niños desarrollan una comprensión conectada del mundo y aprenden a aplicar sus conocimientos en contextos significativos. Las experiencias artísticas —como el teatro, el grabado, la pintura y otras disciplinas— forman parte de estos proyectos, enriqueciendo el aprendizaje mediante distintos lenguajes de expresión.",
      },
      {
        title: "Lectoescritura y Pensamiento Matemático",
        imageSrc: "/assets/images/DSC01639.png",
        imageAlt: "Lectoescritura y pensamiento matemático en Grupo Helechos 1",
        description:
          "Fortalecemos estas habilidades mediante una metodología especializada con más de 40 años de experiencia, enfocada en desarrollar una lectura fluida, comprensiva y sin vicios lectores, así como un pensamiento lógico-matemático sólido que les permita analizar, resolver problemas y aprender con autonomía.",
      },
      {
        title: "Redacción y Escritura Creativa",
        imageSrc: "/assets/images/DSC02336.png",
        imageAlt: "Escritura creativa en Grupo Helechos 1",
        description:
          "Promovemos la creación literaria como una herramienta para pensar, imaginar y comunicar. A través de distintos géneros y propuestas de escritura, niñas y niños fortalecen la expresión escrita, la organización de ideas, la creatividad y el razonamiento verbal.",
      },
      {
        title: "Laboratorio de Pensamiento",
        imageSrc: "/assets/images/DSC02353.png",
        imageAlt: "Laboratorio de pensamiento en Grupo Helechos 1",
        description:
          "Diseñamos experiencias que invitan a observar, cuestionar, investigar, analizar y argumentar. A través de retos, juegos de estrategia, resolución de problemas y espacios de reflexión, fortalecemos el pensamiento crítico, la creatividad y la capacidad de construir soluciones de manera autónoma y colaborativa.",
      },
      {
        title: "Huerto",
        imageSrc: "/assets/images/DSC02354.png",
        imageAlt: "Huerto de Grupo Helechos 1",
        description:
          "El huerto se convierte en un laboratorio vivo donde comprenden los ciclos de la naturaleza, desarrollan la responsabilidad, el trabajo colaborativo y la paciencia, mientras fortalecen su vínculo con el entorno.",
      },
      {
        title: "Escuela del Bosque",
        imageSrc: "/assets/images/DSC02358.png",
        imageAlt: "Exploración en la Escuela del Bosque",
        description:
          "La naturaleza continúa siendo un espacio privilegiado de aprendizaje. A través de caminatas, observación, exploración y experiencias al aire libre, fortalecen la autonomía, la resiliencia, la curiosidad y el respeto por los sistemas vivos.",
      },
      {
        title: "Inteligencia Socioemocional",
        imageSrc: "/assets/images/DSC02366.png",
        imageAlt: "Espacio socioemocional en Grupo Helechos 1",
        description:
          "A través de asambleas, círculos socráticos, juegos cooperativos y espacios de reflexión, fortalecemos el autoconocimiento, la empatía, la comunicación, la resolución de conflictos y la capacidad de construir comunidad desde el diálogo y el respeto.",
      },
      {
        title: "Música",
        imageSrc: "/assets/images/DSC02377.png",
        imageAlt: "Aprendizaje musical con flauta en Grupo Helechos 1",
        description:
          "El aprendizaje de la flauta, inspirado en la pedagogía Waldorf, favorece la coordinación, la atención, la escucha, la disciplina, la sensibilidad musical y la perseverancia, integrando el desarrollo cognitivo, emocional y corporal.",
      },
      {
        title: "Inglés",
        imageSrc: "/assets/images/DSC02381.png",
        imageAlt: "Clase de inglés en Grupo Helechos 1",
        description:
          "En esta etapa el aprendizaje del inglés evoluciona hacia clases más estructuradas, donde fortalecen progresivamente la comprensión lectora, la escritura, el vocabulario, la gramática y la comunicación oral. Todo ello se desarrolla mediante actividades dinámicas y significativas que permiten utilizar el idioma con mayor seguridad y confianza.",
      },
      {
        title: "Movimiento",
        imageSrc: "/assets/images/DSC01392.png",
        imageAlt: "Experiencia de movimiento en Grupo Helechos 1",
        description:
          "A través de disciplinas como circo y frisbee, fortalecemos la coordinación, el equilibrio, la conciencia corporal, el trabajo en equipo y la confianza. Entendemos el movimiento como una herramienta para aprender, colaborar y desarrollar habilidades para la vida.",
      },
    ],
  },
  {
    title: "Grupo Helechos 2",
    ageRange: "10 a 12 años",
    imageSrc: "/assets/images/DSC01280.png",
    imageAlt: "Niñez desarrollando autonomía y pensamiento crítico",
    paragraphs: [
      "Durante esta etapa, niñas y niños desarrollan una mayor capacidad para reflexionar, argumentar, cuestionar y comprender la complejidad del mundo que los rodea. Comienzan a construir una identidad más consciente, fortaleciendo su autonomía y asumiendo un papel cada vez más activo en su aprendizaje y en la comunidad.",
      "En KORU, el enfoque transdisciplinario continúa siendo el eje del aprendizaje. Los proyectos integran las ciencias, el lenguaje, las matemáticas, el arte y otras áreas del conocimiento alrededor de desafíos reales, promoviendo la investigación, la creatividad y la búsqueda de soluciones con impacto en su entorno.",
      "Aunque el aprendizaje ocurre principalmente a través de proyectos, también dedicamos espacios específicos al fortalecimiento del razonamiento verbal, la comprensión lectora, la escritura, el pensamiento lógico-matemático y la resolución de problemas, consolidando las herramientas necesarias para continuar aprendiendo con autonomía y profundidad.",
      "Los círculos socráticos adquieren un papel central en esta etapa, ofreciendo espacios donde niñas y niños desarrollan la capacidad de escuchar, argumentar, cuestionar ideas, construir pensamiento crítico y dialogar desde el respeto. Buscamos que aprendan no solo a expresar sus opiniones, sino también a fundamentarlas y enriquecerlas a partir del encuentro con otras perspectivas.",
      "La naturaleza continúa siendo un espacio privilegiado de aprendizaje. Además del trabajo en el huerto, la conciencia ecológica y el cuidado del entorno, incorporamos experiencias de vida al aire libre y habilidades de supervivencia, como la construcción de refugios, el encendido responsable de fuego, la orientación y otras competencias que fortalecen la autonomía, la colaboración, la resiliencia y el vínculo con la naturaleza.",
      "El propósito de esta etapa es acompañar a cada niña y niño en la consolidación de su identidad, el desarrollo de un pensamiento crítico y la capacidad de participar de manera consciente, creativa y responsable en la transformación de su comunidad y del mundo que habita.",
    ],
    hideRhythmSection: true,
    experienceCards: [
      {
        title: "Proyectos Transdisciplinarios",
        imageSrc: "/assets/images/DSC01273.png",
        imageAlt: "Proyecto transdisciplinario en Grupo Helechos 2",
        description:
          "Los proyectos integran ciencias, historia, geografía, lenguaje, matemáticas, arte y otras áreas del conocimiento alrededor de preguntas, investigaciones y desafíos reales. Niñas y niños profundizan en la comprensión de sistemas complejos, desarrollan proyectos con mayor nivel de autonomía y fortalecen la capacidad de generar soluciones creativas con impacto en su entorno.",
      },
      {
        title: "Lectoescritura y Pensamiento Matemático",
        imageSrc: "/assets/images/DSC01276.png",
        imageAlt: "Lectoescritura y pensamiento matemático en Grupo Helechos 2",
        description:
          "Consolidamos la comprensión lectora, la escritura y el pensamiento lógico-matemático mediante una metodología especializada con más de 40 años de experiencia. Buscamos que niñas y niños desarrollen una lectura crítica y fluida, argumenten con claridad y utilicen el razonamiento matemático para analizar información, resolver problemas y tomar decisiones fundamentadas.",
      },
      {
        title: "Redacción y Escritura Creativa",
        imageSrc: "/assets/images/DSC01280.png",
        imageAlt: "Escritura creativa en Grupo Helechos 2",
        description:
          "La escritura se convierte en una herramienta para reflexionar, investigar, argumentar y expresar ideas con claridad. A través de distintos géneros literarios y proyectos de escritura, fortalecen el pensamiento crítico, la creatividad y la capacidad de comunicar con propósito.",
      },
      {
        title: "Laboratorio de Pensamiento",
        imageSrc: "/assets/images/DSC01281.png",
        imageAlt: "Laboratorio de pensamiento en Grupo Helechos 2",
        description:
          "A través de retos, investigaciones, análisis de casos, juegos de estrategia y círculos socráticos, fortalecemos el pensamiento crítico, la argumentación, la creatividad y la resolución de problemas, favoreciendo que niñas y niños aprendan a cuestionar, fundamentar sus ideas y construir conocimiento de manera colaborativa.",
      },
      {
        title: "Huerto y Sustentabilidad",
        imageSrc: "/assets/images/DSC01284.png",
        imageAlt: "Huerto y sustentabilidad en Grupo Helechos 2",
        description:
          "El huerto continúa siendo un laboratorio vivo donde profundizan en los procesos ecológicos y la comprensión de los sistemas naturales. Se complementa con proyectos de sustentabilidad, compostaje y cuidado del entorno que fortalecen la responsabilidad y el compromiso con la comunidad y el planeta.",
      },
      {
        title: "Escuela del Bosque",
        imageSrc: "/assets/images/DSC01285.png",
        imageAlt: "Escuela del Bosque en Grupo Helechos 2",
        description:
          "La naturaleza continúa siendo un espacio privilegiado de aprendizaje. A través de caminatas, exploración, orientación y habilidades de supervivencia —como construir refugios, encender fuego de manera responsable y desenvolverse en entornos naturales— fortalecen la autonomía, la resiliencia, el liderazgo y el trabajo colaborativo.",
      },
      {
        title: "Inteligencia Socioemocional",
        imageSrc: "/assets/images/DSC01286.png",
        imageAlt: "Espacio socioemocional en Grupo Helechos 2",
        description:
          "Las asambleas, los círculos socráticos y otros espacios de diálogo favorecen el autoconocimiento, la empatía, la comunicación, la resolución de conflictos y la construcción de acuerdos, fortaleciendo una participación cada vez más consciente dentro de la comunidad.",
      },
      {
        title: "Música",
        imageSrc: "/assets/images/DSC01291.png",
        imageAlt: "Aprendizaje musical en Grupo Helechos 2",
        description:
          "El aprendizaje de la flauta continúa desarrollando la atención, la disciplina, la sensibilidad musical, la coordinación y la perseverancia, integrando el desarrollo cognitivo, emocional y corporal.",
      },
      {
        title: "Inglés",
        imageSrc: "/assets/images/DSC01354.png",
        imageAlt: "Clase de inglés en Grupo Helechos 2",
        description:
          "El inglés se fortalece mediante clases estructuradas que profundizan en la comprensión lectora, la escritura, el vocabulario, la gramática y la comunicación oral. El objetivo es que niñas y niños utilicen el idioma con seguridad y confianza en diferentes contextos académicos y cotidianos.",
      },
      {
        title: "Movimiento",
        imageSrc: "/assets/images/DSC01355.png",
        imageAlt: "Experiencia de movimiento en Grupo Helechos 2",
        description:
          "A través de disciplinas como circo y frisbee, fortalecemos la conciencia corporal, la coordinación, el liderazgo, la cooperación y la capacidad de enfrentar retos con creatividad, perseverancia y confianza.",
      },
    ],
  },
];

export const methodologies: Methodology[] = [
  {
    title: "1. Fundamentos Antroposóficos",
    slug: "fundamentos-antroposoficos",
    imageSrc: "https://res.cloudinary.com/trsbzk8f/image/upload/v1788535893/koru/cms/rootcomo-acompanamos--grupo-helechos-2/group-image-card-9.webp",
    imageAlt: "Imagen de experiencias de aprendizaje en Koru",
    cardHighlight: "El desarrollo no se acelera; se acompaña.",
    paragraphs: [
      "Integramos algunos fundamentos de la pedagogía antroposófica que orientan nuestro modelo educativo y nos ayudan a diseñar experiencias de aprendizaje respetuosas del desarrollo integral de cada niña y niño.",
    ],
    detailParagraphs: [
      "En KORU integramos algunos fundamentos de la pedagogía antroposófica que consideramos especialmente valiosos para el desarrollo integral de niñas y niños. Más que adoptar una metodología de manera íntegra, retomamos aquellos principios que favorecen el bienestar, la seguridad emocional y un aprendizaje profundamente humano.",
      "Esto se refleja en la construcción de ritmos diarios claros y predecibles, que alternan momentos de concentración y expansión (inhalación y exhalación); en la presencia de ritos y rituales que brindan sentido y pertenencia; en el contacto cotidiano con la naturaleza; y en el lugar esencial que ocupan la expresión artística y el juego libre como medios para explorar, crear, imaginar y comprender el mundo.",
      "Desde esta mirada entendemos que el desarrollo humano ocurre por etapas y que cada una trae consigo procesos de maduración física, emocional, social y cognitiva. Por ello, observamos los hitos de madurez no como metas que deban alcanzarse en una edad específica, sino como señales que nos ayudan a comprender cuándo niñas y niños están preparados para determinados aprendizajes y experiencias.",
      "Esta comprensión orienta el diseño de nuestras planeaciones transdisciplinarias, permitiéndonos ofrecer propuestas que respetan la singularidad de cada persona y acompañan su desarrollo de manera armónica.",
    ],

  },
  {
    title: "2. Aprendizaje Transdisciplinario",
    slug: "aprendizaje-transdisciplinario",
    imageSrc: "https://res.cloudinary.com/trsbzk8f/image/upload/v1788535891/koru/cms/rootcomo-acompanamos--grupo-helechos-2/group-image-card-8.webp",
    imageAlt: "Imagen de experiencias de aprendizaje en Koru",
    cardHighlight: "El mundo no está dividido en materias.",
    ctaLabel: "Conoce el cómo y el por qué",
    paragraphs: [
      "Diseñamos experiencias de aprendizaje que integran distintas áreas del conocimiento alrededor de preguntas, desafíos y situaciones reales, permitiendo que niñas y niños comprendan la realidad de manera conectada y significativa.",
    ],
    detailParagraphs: [
      "En KORU entendemos que el mundo no está dividido en materias. Por ello, diseñamos experiencias de aprendizaje que integran distintas áreas del conocimiento alrededor de preguntas, desafíos y situaciones reales, permitiendo que niñas y niños comprendan la realidad de manera conectada y significativa.",
      "A través de proyectos transdisciplinarios investigan, observan, experimentan, crean, dialogan y colaboran, relacionando lo que aprenden con su vida cotidiana, su comunidad y el entorno que los rodea. Así, el aprendizaje deja de ser la acumulación de información para convertirse en una experiencia con propósito.",
      "Elegimos este enfoque porque el mundo actual requiere personas capaces de comprender la complejidad, establecer conexiones entre distintas formas de conocimiento y generar respuestas creativas a los desafíos de su tiempo. Más que memorizar contenidos de forma aislada, buscamos desarrollar la capacidad de formular preguntas, pensar críticamente, trabajar en comunidad y construir nuevos aprendizajes a partir de la experiencia.",
      "Para nosotros, la transdisciplinariedad no consiste únicamente en integrar disciplinas, sino en conectar conocimientos, habilidades, emociones, valores y experiencias para que el aprendizaje refleje la complejidad de la vida misma. De esta manera formamos personas capaces de comprender su realidad y participar activamente en su transformación con sensibilidad, pensamiento crítico y propósito.",
    ],
  },
  {
    title: "3. Desarrollo Socio-Emocional",
    slug: "desarrollo-socioemocional",
    imageSrc: "https://res.cloudinary.com/trsbzk8f/image/upload/v1788535889/koru/cms/rootcomo-acompanamos--grupo-helechos-2/group-image-card-7.webp",
    imageAlt: "Imagen de experiencias de aprendizaje en Koru",
    cardHighlight:
      "Creemos que el bienestar individual y el bienestar colectivo están profundamente conectados.",
    ctaLabel: "Conoce el cómo y el por qué",
    paragraphs: [
      "Entendemos que aprender también implica conocerse, comprender a los demás y construir relaciones conscientes. A través de herramientas como la Comunicación No Violenta y el desarrollo del autoconocimiento, cultivamos una auténtica cultura de paz basada en la empatía, el diálogo y la corresponsabilidad.",
    ],
    detailParagraphs: [
      "En KORU entendemos que aprender también implica conocerse, comprender a los demás y construir relaciones conscientes. Por ello, la educación socioemocional no es una asignatura aislada, sino una dimensión que atraviesa la vida cotidiana de nuestra comunidad y todas las experiencias de aprendizaje.",
      "Acompañamos los procesos emocionales desde la escucha, la empatía y el respeto, creando espacios donde niñas y niños pueden reconocer lo que sienten, comprender qué les están comunicando sus emociones acerca de sus necesidades y desarrollar la capacidad de responder con mayor conciencia, en lugar de reaccionar de manera automática.",
      "Integramos herramientas de inteligencia emocional, como la Comunicación No Violenta (CNV) entre otras, que fortalecen la empatía, el diálogo y la colaboración. A través de ellas aprendemos a expresar sentimientos y necesidades con claridad, escuchar profundamente a los demás y transformar los conflictos en oportunidades de aprendizaje, reparación y crecimiento.",
      "Creemos que una comunidad se fortalece cuando quienes la integran participan activamente en su construcción. Por ello, muchos de los acuerdos de convivencia se dialogan y se construyen junto con niñas y niños, considerando las necesidades de todas las personas involucradas. Más que obedecer reglas impuestas, buscamos que comprendan el sentido de los acuerdos, desarrollen un compromiso genuino con ellos y experimenten cómo el diálogo, la corresponsabilidad y el respeto permiten construir una convivencia armónica.",
      "Asimismo, exploramos diversos lenguajes y mapas de las emociones que enriquecen el vocabulario emocional y favorecen una comprensión más precisa de la experiencia interna. Entendemos que las emociones no son algo que deba reprimirse o evitarse, sino una valiosa fuente de información sobre nuestro mundo interior. Al desarrollar esta conciencia, niñas y niños fortalecen su autoconocimiento, toman decisiones más responsables y construyen relaciones basadas en el cuidado mutuo y el respeto.",
      "Creemos que el bienestar individual y el bienestar colectivo están profundamente conectados. Por ello, cultivamos una auténtica cultura de paz, sostenida por el diálogo, la empatía, la corresponsabilidad y la convicción de que cada interacción es una oportunidad para crecer como personas y fortalecer la comunidad.",
    ],
  },
  {
    title:
      "4. Desarrollo de habilidades fundamentales (lectura, escritura y matemáticas)",
    slug: "lectura-escritura-y-matematicas",
    imageSrc: "https://res.cloudinary.com/trsbzk8f/image/upload/v1788535887/koru/cms/rootcomo-acompanamos--grupo-helechos-2/group-image-card-6.webp",
    imageAlt: "Imagen de experiencias de aprendizaje en Koru",
    cardHighlight:
      "Las grandes ideas se construyen sobre habilidades fundamentales",
    ctaLabel: "Conoce el cómo y el por qué",
    paragraphs: [
      "La lectura, la escritura y el pensamiento matemático son los lenguajes que nos permiten comprender, pensar y transformar la realidad.",
      "Creemos que son mucho más que asignaturas: son lenguajes fundamentales para comprender, pensar y transformar la realidad. Por ello, constituyen uno de los pilares esenciales de nuestro modelo educativo.",
    ],
    detailParagraphs: [
      "En KORU creemos que la lectura, la escritura y el pensamiento matemático son habilidades fundamentales para comprender el mundo, comunicar ideas, resolver problemas y continuar aprendiendo a lo largo de la vida. Más que asignaturas, son lenguajes que nos permiten interpretar la realidad, organizar el pensamiento y construir nuevos conocimientos.",
      "La lectura nos permite comprender las ideas de otros; la escritura nos ayuda a organizar, expresar y comunicar nuestro propio pensamiento; y las matemáticas nos enseñan a reconocer patrones, establecer relaciones y razonar con claridad. Juntas, estas habilidades amplían nuestra capacidad para comprender el mundo, tomar mejores decisiones y participar en él de manera crítica, creativa y consciente.",
      "Por ello, damos especial importancia a que cada niña y niño desarrolle estas capacidades con profundidad, comprensión y confianza. Nuestro objetivo no es únicamente que aprendan a leer, escribir o resolver operaciones, sino que construyan un sólido razonamiento verbal y lógico-matemático que les permita analizar información, formular preguntas, expresar sus ideas con claridad y enfrentarse a nuevos desafíos con autonomía.",
      "Para lograrlo, nos apoyamos en una metodología con más de 40 años de experiencia, basada en el desarrollo progresivo de capacidades y en el respeto al punto de partida de cada aprendiz. Este enfoque fortalece la comprensión lectora, la escritura, el pensamiento numérico, el cálculo mental y la resolución de problemas, priorizando siempre la comprensión profunda por encima de la memorización.",
      "Creemos que cuando estas habilidades se desarrollan de manera sólida, todos los demás aprendizajes encuentran una base firme sobre la cual crecer. Por eso constituyen uno de los pilares esenciales de nuestro modelo pedagógico.",
    ],
  },
  {
    title: "5. Conciencia ecológica",
    slug: "conciencia-ecologica",
    imageSrc: "https://res.cloudinary.com/trsbzk8f/image/upload/v1788535886/koru/cms/rootcomo-acompanamos--grupo-helechos-2/group-image-card-5.webp",
    imageAlt: "Imagen de experiencias de aprendizaje en Koru",
    cardHighlight: "La conciencia ecológica nace del vínculo",
    ctaLabel: "Conoce el cómo y el por qué",
    paragraphs: [
      "Cuidamos aquello de lo que nos sentimos parte.",
      "Promovemos una conciencia ecológica y social que nace de la experiencia, el vínculo y el sentido de pertenencia. Buscamos formar personas que comprendan que cada acción genera un impacto y que el cuidado del planeta comienza por la manera en que habitamos y nos relacionamos con el mundo.",
    ],
    detailParagraphs: [
      "En KORU entendemos que la conciencia ecológica no se construye únicamente aprendiendo sobre el medio ambiente, sino viviendo diariamente en relación con la naturaleza, la comunidad y los sistemas de los que formamos parte.",
      "Creemos que cuando niñas y niños experimentan el cuidado de manera cotidiana, desarrollan una comprensión profunda de la interdependencia entre las personas, los seres vivos y el entorno. Desde esta mirada, el respeto por la naturaleza deja de ser una obligación para convertirse en una forma natural de habitar el mundo.",
      "Por ello, la conciencia ecológica se vive todos los días a través de acciones concretas como la separación de residuos, el uso de baños secos, el cuidado de plantas, las actividades de huerto, las caminatas al bosque y el contacto constante con los ciclos naturales. Estas experiencias permiten comprender la naturaleza desde la observación, la participación y el cuidado, generando un vínculo profundo con el entorno.",
      "Asimismo, desarrollamos experiencias inspiradas en la Escuela del Bosque, donde niñas y niños fortalecen su autonomía y confianza mediante el aprendizaje al aire libre. A través de caminatas, exploración, orientación y habilidades de supervivencia —como construir refugios, encender fuego de manera responsable, identificar recursos naturales y desenvolverse con seguridad en el bosque— descubren que la naturaleza no es solo un lugar para visitar, sino una comunidad viva de la que formamos parte y con la que aprendemos a relacionarnos de manera respetuosa.",
      "Esta visión también se extiende a la dimensión social. Impulsamos proyectos y programas de impacto comunitario que fortalecen la empatía, el servicio y la corresponsabilidad, ayudando a comprender que el cuidado del entorno y el cuidado de las personas son inseparables.",
      "Más que reducir nuestro impacto, buscamos aprender a generar un impacto positivo en los sistemas vivos de los que formamos parte. Aspiramos a formar personas capaces de observar, cuidar, colaborar y actuar con conciencia, comprendiendo que cada decisión puede contribuir a construir un mundo más humano, regenerativo y sostenible.",
    ],
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
  learningPrinciplesSummary:
    "content.como-acompanamos.learning-principles.summary",
  connectedLearningTitle: "content.como-acompanamos.connected-learning.title",
  connectedLearningText: "content.como-acompanamos.connected-learning.text",
  integralDevelopmentTitle:
    "content.como-acompanamos.integral-development.title",
  integralDevelopmentText: "content.como-acompanamos.integral-development.text",
  groupsTitle: "content.como-acompanamos.groups.title",
  groupsIntro: "content.como-acompanamos.groups.intro",
  methodologiesTitle: "content.como-acompanamos.methodologies.title",
  methodologiesLead: "content.como-acompanamos.methodologies.lead",
  methodologiesIntro: "content.como-acompanamos.methodologies.intro",
  evaluationTitle: "content.como-acompanamos.evaluation.title",
  evaluationLead: "content.como-acompanamos.evaluation.lead",
  evaluationParagraphOne: "content.como-acompanamos.evaluation.paragraph.one",
  evaluationParagraphTwo: "content.como-acompanamos.evaluation.paragraph.two",
  evaluationParagraphThree:
    "content.como-acompanamos.evaluation.paragraph.three",
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
    styleControls: [
      "font",
      "size",
      "color",
      "align",
      "weight",
      "letterSpacing",
    ],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.heroIntro,
    label: "Hero / Introducción",
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
    label: "Acompañamiento conectado / Título",
    defaultValue: "Acompañamiento conectado a su ritmo de aprendizaje",
    defaultSize: 24,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.connectedLearningText,
    label: "Acompañamiento conectado / Texto",
    defaultValue:
      "Diseñamos experiencias de aprendizaje acordes a cada etapa del desarrollo. Observamos de cerca a cada niña y niño para brindar el acompañamiento y las estrategias que favorezcan su crecimiento integral, respetando su singularidad.",
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.integralDevelopmentTitle,
    label: "Desarrollo integral / Título",
    defaultValue: "Buscamos un desarrollo integral.",
    defaultSize: 60,
    multiline: false,
    styleControls: ["font", "size", "color", "align", "weight"],
  }),
  textSlot({
    id: comoAcompanamosContentSlotIds.integralDevelopmentText,
    label: "Desarrollo integral / Texto",
    defaultValue:
      "En Koru promovemos el desarrollo integral de cada niña y niño, cultivando sus capacidades físicas, emocionales, sociales, cognitivas, intuitivas y creativas. A través de experiencias significativas y prácticas respetuosas, favorecemos un ambiente de confianza, seguridad y pertenencia que les permite crecer de manera plena, fortaleciendo su bienestar y su relación consigo mismos, con los demás y con la naturaleza.",
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
    id: comoAcompanamosContentSlotIds.methodologiesLead,
    label: "Metodologías / Bajada destacada",
    defaultValue:
      "No elegimos metodologías por tradición, sino por el valor que aportan al desarrollo integral de cada aprendiz.",
    defaultSize: 28,
    styleControls: ["size", "color", "align", "lineHeight"],
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
    ...(methodology.paragraphs ?? []).map((paragraph, paragraphIndex) =>
      textSlot({
        id: methodologySlotId(index, `paragraph.${paragraphIndex}`),
        label: `Metodología ${index + 1} / Párrafo ${paragraphIndex + 1}`,
        defaultValue: paragraph,
      }),
    ),
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
    id: comoAcompanamosContentSlotIds.evaluationParagraphThree,
    label: "Evaluación / Párrafo 3",
    defaultValue:
      "Nuestra evaluación no se limita a l@s aprendices, si no que tanto el equipo de acompañantes como las familias mantienen un proceso de observación auto-observación y retroalimentación constante que nos ayuda a seguir mejorando.",
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
    ...(block.paragraphs ?? []).map((paragraph, paragraphIndex) =>
      textSlot({
        id: evaluationBlockSlotId(index, `paragraph.${paragraphIndex}`),
        label: `Evaluación bloque ${index + 1} / Párrafo ${paragraphIndex + 1}`,
        defaultValue: paragraph,
      }),
    ),
    ...(block.bullets ?? []).map((bullet, bulletIndex) =>
      textSlot({
        id: evaluationBlockSlotId(index, `bullet.${bulletIndex}`),
        label: `Evaluación bloque ${index + 1} / Lista ${bulletIndex + 1}`,
        defaultValue: bullet,
        multiline: false,
      }),
    ),
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
    eyebrow: getComoAcompanamosContentSlotValue(
      textMap,
      comoAcompanamosContentSlotIds.heroEyebrow,
    ),
    intro: getComoAcompanamosContentSlotValue(
      textMap,
      comoAcompanamosContentSlotIds.heroIntro,
    ),
  };
}

function repairLearningPrincipleText(value: string) {
  return value
    .replaceAll("Interconexi?n", "Interconexión")
    .replaceAll("Prop?sito", "Propósito")
    .replaceAll("maravill?ndonos", "maravillándonos")
    .replaceAll("m?s", "más")
    .replaceAll("?para qu??", "“para qué”")
    .replaceAll("para qu?", "para qué");
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

export function resolveAccompanyPillars(
  textMap: LandingTextMap,
): AccompanyPillar[] {
  return accompanyPillars.map((pillar, index) => ({
    ...pillar,
    title: getComoAcompanamosContentSlotValue(
      textMap,
      pillarSlotId(index, "title"),
    ),
    paragraphs: [
      getComoAcompanamosContentSlotValue(
        textMap,
        pillarSlotId(index, "paragraph"),
      ),
    ],
  }));
}

export function resolveAccompanimentGroups(textMap: LandingTextMap) {
  return accompanimentGroups.map((group, index) => ({
    ...group,
    title: getComoAcompanamosContentSlotValue(
      textMap,
      groupSlotId(index, "title"),
    ),
    ageRange: getComoAcompanamosContentSlotValue(
      textMap,
      groupSlotId(index, "ageRange"),
    ),
    paragraphs: group.paragraphs.map((_, paragraphIndex) =>
      getComoAcompanamosContentSlotValue(
        textMap,
        groupSlotId(index, `paragraph.${paragraphIndex}`),
      ),
    ),
    bullets: group.bullets?.map((_, bulletIndex) =>
      getComoAcompanamosContentSlotValue(
        textMap,
        groupSlotId(index, `bullet.${bulletIndex}`),
      ),
    ),
    closing: group.closing
      ? getComoAcompanamosContentSlotValue(
          textMap,
          groupSlotId(index, "closing"),
        )
      : undefined,
    rhythmIntro: group.rhythmIntro
      ? getComoAcompanamosContentSlotValue(
          textMap,
          groupSlotId(index, "rhythmIntro"),
        )
      : undefined,
    rhythmBullets: group.rhythmBullets?.map((_, bulletIndex) =>
      getComoAcompanamosContentSlotValue(
        textMap,
        groupSlotId(index, `rhythmBullet.${bulletIndex}`),
      ),
    ),
  }));
}

export function resolveMethodologies(textMap: LandingTextMap): Methodology[] {
  return methodologies.map((methodology, index) => ({
    ...methodology,
    title: getComoAcompanamosContentSlotValue(
      textMap,
      methodologySlotId(index, "title"),
    ),
    paragraphs: methodology.paragraphs?.map((_, paragraphIndex) =>
      getComoAcompanamosContentSlotValue(
        textMap,
        methodologySlotId(index, `paragraph.${paragraphIndex}`),
      ),
    ),
    cta: methodology.cta
      ? {
          ...methodology.cta,
          label: getComoAcompanamosContentSlotValue(
            textMap,
            methodologySlotId(index, "cta"),
          ),
        }
      : undefined,
  }));
}

export function resolveEvaluationBlocks(
  textMap: LandingTextMap,
): IllustratedTextBlock[] {
  return evaluationBlocks.map((block, index) => ({
    ...block,
    title: getComoAcompanamosContentSlotValue(
      textMap,
      evaluationBlockSlotId(index, "title"),
    ),
    paragraphs: block.paragraphs?.map((_, paragraphIndex) =>
      getComoAcompanamosContentSlotValue(
        textMap,
        evaluationBlockSlotId(index, `paragraph.${paragraphIndex}`),
      ),
    ),
    bullets: block.bullets?.map((_, bulletIndex) =>
      getComoAcompanamosContentSlotValue(
        textMap,
        evaluationBlockSlotId(index, `bullet.${bulletIndex}`),
      ),
    ),
    cta: block.cta
      ? {
          ...block.cta,
          label: getComoAcompanamosContentSlotValue(
            textMap,
            evaluationBlockSlotId(index, "cta"),
          ),
        }
      : undefined,
  }));
}
