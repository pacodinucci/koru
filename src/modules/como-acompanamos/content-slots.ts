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
      "Aprendemos jugando, explorando y maravillándonos del mundo.",
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
        description: "El tejido, el modelado con barro y plastilina, el huerto y otras experiencias manuales fortalecen la motricidad fina, la creatividad, la concentración y la perseverancia, integrando el pensamiento, la emoción y la voluntad a través del hacer.",
      },
      {
        title: "Arte y movimiento",
        imageSrc: "/assets/images/DSC01365.png",
        imageAlt: "Experiencia de arte y movimiento en Grupo Koru",
        description: "Las artes plásticas y las clases de circo favorecen la creatividad, la coordinación, el equilibrio, la conciencia corporal y la confianza, acompañando el desarrollo integral mediante experiencias de expresión y movimiento.",
      },
      {
        title: "Inglés",
        imageSrc: "/assets/images/DSC01367.png",
        imageAlt: "Aprendizaje vivencial de inglés en Grupo Koru",
        description: "El idioma inglés continúa desarrollándose de manera vivencial a través de canciones, cuentos, versos, juegos y actividades cotidianas, ampliando progresivamente la comprensión y la comunicación en un segundo idioma.",
      },
      {
        title: "Exploración sensorial",
        imageSrc: "/assets/images/DSC01378.png",
        imageAlt: "Niñas y niños explorando la naturaleza",
        description: "La cocina, las caminatas en la naturaleza y otras experiencias sensoriales permiten observar, experimentar y comprender el mundo desde el hacer, despertando la curiosidad, la atención y el pensamiento científico.",
      },
      {
        title: "Música",
        imageSrc: "/assets/images/DSC01379.png",
        imageAlt: "Experiencia musical en Grupo Koru",
        description: "Las rítmicas, el canto y el repertorio de canciones tradicionales fortalecen la escucha, la memoria, el ritmo, la coordinación y la sensibilidad musical, acompañando el desarrollo del lenguaje y la expresión.",
      },
      {
        title: "Lectoescritura",
        imageSrc: "/assets/images/DSC01384.png",
        imageAlt: "Aprendizaje de lectoescritura en Grupo Koru",
        description: "El acercamiento a la lectoescritura inicia desde una mirada inspirada en la pedagogía antroposófica. Las vocales se presentan mediante el dibujo de formas, el movimiento, la narración y la experiencia artística, permitiendo que el lenguaje se construya desde la vivencia antes que desde la abstracción. Conforme cada niña y niño muestra las señales de madurez necesarias, realizamos una transición gradual hacia una metodología especializada con más de 40 años de experiencia, fortaleciendo la comprensión lectora, la escritura y las primeras habilidades de redacción.",
      },
      {
        title: "Pensamiento matemático",
        imageSrc: "/assets/images/DSC01385.png",
        imageAlt: "Experiencia de pensamiento matemático en Grupo Koru",
        description: "Las matemáticas se presentan como un lenguaje para comprender el mundo. A través de materiales concretos, juegos, desafíos y experiencias significativas, niñas y niños desarrollan el razonamiento lógico-matemático, el sentido numérico y la capacidad para descubrir relaciones y resolver problemas.",
      },
      {
        title: "Ritmo estacional",
        imageSrc: "/assets/images/DSC01386.png",
        imageAlt: "Niñas y niños conectando con el ritmo estacional",
        description: "Las estaciones del año y sus festividades continúan marcando el ritmo de la vida del grupo, fortaleciendo el vínculo con la naturaleza, la comunidad y los ciclos que nos rodean.",
      },
      {
        title: "Huerto y compostaje",
        imageSrc: "/assets/images/DSC01392.png",
        imageAlt: "Huerto y compostaje en Grupo Koru",
        description: "El huerto, el compostaje y el cuidado cotidiano del entorno permiten comprender los procesos de la naturaleza desde la experiencia directa, despertando una conciencia ecológica basada en el vínculo, la observación y el cuidado.",
      },
      {
        title: "Juego",
        imageSrc: "/assets/images/DSC01400.png",
        imageAlt: "Niñas y niños jugando en Grupo Koru",
        description: "El juego continúa siendo una herramienta esencial de aprendizaje. A través de él, niñas y niños exploran ideas, ponen a prueba hipótesis, desarrollan habilidades sociales y construyen conocimiento de manera activa y significativa.",
      },
      {
        title: "Calma y narración",
        imageSrc: "/assets/images/DSC01443.png",
        imageAlt: "Momento de calma y narración en Grupo Koru",
        description: "Cada día reservamos un momento para la calma, los cuentos y la narración, favoreciendo la imaginación, la atención, la comprensión del lenguaje y la integración de las experiencias vividas durante la jornada.",
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
        description: "El aprendizaje se organiza alrededor de proyectos que integran ciencias, historia, geografía, lenguaje, matemáticas, arte y otras áreas del conocimiento. A través de preguntas, investigaciones y desafíos reales, niñas y niños desarrollan una comprensión conectada del mundo y aprenden a aplicar sus conocimientos en contextos significativos. Las experiencias artísticas —como el teatro, el grabado, la pintura y otras disciplinas— forman parte de estos proyectos, enriqueciendo el aprendizaje mediante distintos lenguajes de expresión.",
      },
      {
        title: "Lectoescritura y Pensamiento Matemático",
        imageSrc: "/assets/images/DSC01639.png",
        imageAlt: "Lectoescritura y pensamiento matemático en Grupo Helechos 1",
        description: "Fortalecemos estas habilidades mediante una metodología especializada con más de 40 años de experiencia, enfocada en desarrollar una lectura fluida, comprensiva y sin vicios lectores, así como un pensamiento lógico-matemático sólido que les permita analizar, resolver problemas y aprender con autonomía.",
      },
      {
        title: "Redacción y Escritura Creativa",
        imageSrc: "/assets/images/DSC02336.png",
        imageAlt: "Escritura creativa en Grupo Helechos 1",
        description: "Promovemos la creación literaria como una herramienta para pensar, imaginar y comunicar. A través de distintos géneros y propuestas de escritura, niñas y niños fortalecen la expresión escrita, la organización de ideas, la creatividad y el razonamiento verbal.",
      },
      {
        title: "Laboratorio de Pensamiento",
        imageSrc: "/assets/images/DSC02353.png",
        imageAlt: "Laboratorio de pensamiento en Grupo Helechos 1",
        description: "Diseñamos experiencias que invitan a observar, cuestionar, investigar, analizar y argumentar. A través de retos, juegos de estrategia, resolución de problemas y espacios de reflexión, fortalecemos el pensamiento crítico, la creatividad y la capacidad de construir soluciones de manera autónoma y colaborativa.",
      },
      {
        title: "Huerto",
        imageSrc: "/assets/images/DSC02354.png",
        imageAlt: "Huerto de Grupo Helechos 1",
        description: "El huerto se convierte en un laboratorio vivo donde comprenden los ciclos de la naturaleza, desarrollan la responsabilidad, el trabajo colaborativo y la paciencia, mientras fortalecen su vínculo con el entorno.",
      },
      {
        title: "Escuela del Bosque",
        imageSrc: "/assets/images/DSC02358.png",
        imageAlt: "Exploración en la Escuela del Bosque",
        description: "La naturaleza continúa siendo un espacio privilegiado de aprendizaje. A través de caminatas, observación, exploración y experiencias al aire libre, fortalecen la autonomía, la resiliencia, la curiosidad y el respeto por los sistemas vivos.",
      },
      {
        title: "Inteligencia Socioemocional",
        imageSrc: "/assets/images/DSC02366.png",
        imageAlt: "Espacio socioemocional en Grupo Helechos 1",
        description: "A través de asambleas, círculos socráticos, juegos cooperativos y espacios de reflexión, fortalecemos el autoconocimiento, la empatía, la comunicación, la resolución de conflictos y la capacidad de construir comunidad desde el diálogo y el respeto.",
      },
      {
        title: "Música",
        imageSrc: "/assets/images/DSC02377.png",
        imageAlt: "Aprendizaje musical con flauta en Grupo Helechos 1",
        description: "El aprendizaje de la flauta, inspirado en la pedagogía Waldorf, favorece la coordinación, la atención, la escucha, la disciplina, la sensibilidad musical y la perseverancia, integrando el desarrollo cognitivo, emocional y corporal.",
      },
      {
        title: "Inglés",
        imageSrc: "/assets/images/DSC02381.png",
        imageAlt: "Clase de inglés en Grupo Helechos 1",
        description: "En esta etapa el aprendizaje del inglés evoluciona hacia clases más estructuradas, donde fortalecen progresivamente la comprensión lectora, la escritura, el vocabulario, la gramática y la comunicación oral. Todo ello se desarrolla mediante actividades dinámicas y significativas que permiten utilizar el idioma con mayor seguridad y confianza.",
      },
      {
        title: "Movimiento",
        imageSrc: "/assets/images/DSC01392.png",
        imageAlt: "Experiencia de movimiento en Grupo Helechos 1",
        description: "A través de disciplinas como circo y frisbee, fortalecemos la coordinación, el equilibrio, la conciencia corporal, el trabajo en equipo y la confianza. Entendemos el movimiento como una herramienta para aprender, colaborar y desarrollar habilidades para la vida.",
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
      { title: "Proyectos Transdisciplinarios", imageSrc: "/assets/images/DSC01273.png", imageAlt: "Proyecto transdisciplinario en Grupo Helechos 2", description: "Los proyectos integran ciencias, historia, geografía, lenguaje, matemáticas, arte y otras áreas del conocimiento alrededor de preguntas, investigaciones y desafíos reales. Niñas y niños profundizan en la comprensión de sistemas complejos, desarrollan proyectos con mayor nivel de autonomía y fortalecen la capacidad de generar soluciones creativas con impacto en su entorno." },
      { title: "Lectoescritura y Pensamiento Matemático", imageSrc: "/assets/images/DSC01276.png", imageAlt: "Lectoescritura y pensamiento matemático en Grupo Helechos 2", description: "Consolidamos la comprensión lectora, la escritura y el pensamiento lógico-matemático mediante una metodología especializada con más de 40 años de experiencia. Buscamos que niñas y niños desarrollen una lectura crítica y fluida, argumenten con claridad y utilicen el razonamiento matemático para analizar información, resolver problemas y tomar decisiones fundamentadas." },
      { title: "Redacción y Escritura Creativa", imageSrc: "/assets/images/DSC01280.png", imageAlt: "Escritura creativa en Grupo Helechos 2", description: "La escritura se convierte en una herramienta para reflexionar, investigar, argumentar y expresar ideas con claridad. A través de distintos géneros literarios y proyectos de escritura, fortalecen el pensamiento crítico, la creatividad y la capacidad de comunicar con propósito." },
      { title: "Laboratorio de Pensamiento", imageSrc: "/assets/images/DSC01281.png", imageAlt: "Laboratorio de pensamiento en Grupo Helechos 2", description: "A través de retos, investigaciones, análisis de casos, juegos de estrategia y círculos socráticos, fortalecemos el pensamiento crítico, la argumentación, la creatividad y la resolución de problemas, favoreciendo que niñas y niños aprendan a cuestionar, fundamentar sus ideas y construir conocimiento de manera colaborativa." },
      { title: "Huerto y Sustentabilidad", imageSrc: "/assets/images/DSC01284.png", imageAlt: "Huerto y sustentabilidad en Grupo Helechos 2", description: "El huerto continúa siendo un laboratorio vivo donde profundizan en los procesos ecológicos y la comprensión de los sistemas naturales. Se complementa con proyectos de sustentabilidad, compostaje y cuidado del entorno que fortalecen la responsabilidad y el compromiso con la comunidad y el planeta." },
      { title: "Escuela del Bosque", imageSrc: "/assets/images/DSC01285.png", imageAlt: "Escuela del Bosque en Grupo Helechos 2", description: "La naturaleza continúa siendo un espacio privilegiado de aprendizaje. A través de caminatas, exploración, orientación y habilidades de supervivencia —como construir refugios, encender fuego de manera responsable y desenvolverse en entornos naturales— fortalecen la autonomía, la resiliencia, el liderazgo y el trabajo colaborativo." },
      { title: "Inteligencia Socioemocional", imageSrc: "/assets/images/DSC01286.png", imageAlt: "Espacio socioemocional en Grupo Helechos 2", description: "Las asambleas, los círculos socráticos y otros espacios de diálogo favorecen el autoconocimiento, la empatía, la comunicación, la resolución de conflictos y la construcción de acuerdos, fortaleciendo una participación cada vez más consciente dentro de la comunidad." },
      { title: "Música", imageSrc: "/assets/images/DSC01291.png", imageAlt: "Aprendizaje musical en Grupo Helechos 2", description: "El aprendizaje de la flauta continúa desarrollando la atención, la disciplina, la sensibilidad musical, la coordinación y la perseverancia, integrando el desarrollo cognitivo, emocional y corporal." },
      { title: "Inglés", imageSrc: "/assets/images/DSC01354.png", imageAlt: "Clase de inglés en Grupo Helechos 2", description: "El inglés se fortalece mediante clases estructuradas que profundizan en la comprensión lectora, la escritura, el vocabulario, la gramática y la comunicación oral. El objetivo es que niñas y niños utilicen el idioma con seguridad y confianza en diferentes contextos académicos y cotidianos." },
      { title: "Movimiento", imageSrc: "/assets/images/DSC01355.png", imageAlt: "Experiencia de movimiento en Grupo Helechos 2", description: "A través de disciplinas como circo y frisbee, fortalecemos la conciencia corporal, la coordinación, el liderazgo, la cooperación y la capacidad de enfrentar retos con creatividad, perseverancia y confianza." },
    ],
  },
];

export const methodologies: TextBlock[] = [
  {
    title: "1. Fundamentos Antroposóficos",
    paragraphs: [
      "En Koru, hemos escogido ciertos fundamentos antroposóficos a través de: generar un ritmo de inhalación y exhalación claro y predecible, ritos y rituales del día a día, contacto con la naturaleza, expresión artística y juego libre. De esta mirada nacen los hitos de madurez que nos guían en la creación de las planeaciones transdisciplinarias.",
    ],
  },
  {
    title: "2. Aprendizaje Transdisciplinario",
    paragraphs: [
      "Desarrollamos proyectos que integran distintas áreas del conocimiento, permitiendo que las niñas y niños comprendan la realidad de manera conectada y significativa. A través de estos procesos, investigan, crean, colaboran y encuentran sentido en lo que aprenden.",
      "En Koru adoptamos el aprendizaje transdisciplinario porque el mundo actual exige pensar y actuar más allá de las fronteras disciplinarias. La realidad es compleja, interconectada y en constante cambio, por lo que guiamos el aprendizaje social hacia la integración del conocimiento, la creatividad y la resolución de problemas reales.",
      "La transdisciplinariedad fomenta el pensamiento crítico, la colaboración y el aprendizaje basado en la experiencia, permitiendo que los aprendices construyan significado de manera profunda.",
      "Al cruzar y conectar saberes, promovemos una educación viva, flexible y en evolución, donde cada persona desarrolla herramientas para comprender y transformar su entorno con sensibilidad y propósito.",
    ],
  },
  {
    title: "3. Desarrollo Socio-Emocional",
    paragraphs: [
      "Acompañamos los procesos socioemocionales desde la escucha, la empatía y el respeto.",
      "Integramos herramientas como la Comunicación NoViolenta para gestionar conflictos, fortalecer la colaboración y desarrollar la capacidad de expresar necesidades y sentimientos de manera clara y cuidadosa.",
      "Exploramos lenguajes y mapas de las emociones para poder ser más precisos a la hora de entender lo que nos sucede y poder tomar mejores decisiones y desarrollar la conexión con los demás y una comunicación asertiva.",
      "Así, se fortalece la cultura de paz, sostenida por el diálogo, respeto y responsabilidad compartida, que nos permite crecer juntos como seres humanos y en el desarrollo socio emocional de Koru OSA.",
    ],
  },
  {
    title:
      "4. Desarrollo de habilidades fundamentales (lectura, escritura y matemáticas)",
    paragraphs: [
      "Acompañamos el desarrollo de la lectoescritura y el pensamiento matemático a través de metodologías estructuradas, respetuosas de los procesos individuales y reconocidas por su efectividad, integrando el aprendizaje de forma significativa y no mecánica.",
      "Basada en una metodología premiada con más de 40 años de experiencia.",
    ],
    cta: { label: "Conocer más", href: "#lectura-escritura-y-matematicas" },
  },
  {
    title: "5. Conciencia ecológica",
    paragraphs: [
      "Fomentamos una relación cercana y de reciprocidad con el entorno.",
      "A través del huerto, habilidades de supervivencia, caminatas en el bosque, separación de residuos y prácticas como el uso de baños secos, entre otros, las niñas y niños desarrollan conciencia ecológica desde la experiencia, comprendiendo su papel dentro de un sistema vivo.",
    ],
    cta: { label: "Quiero saber más", href: "#conciencia-ecologica" },
  },
  {
    title: "6. Pensamiento crítico y diálogo",
    paragraphs: [
      "Generamos espacios como círculos socráticos y asambleas, donde las niñas y niños desarrollan la escucha, el pensamiento reflexivo y la capacidad de expresar ideas, cuestionar y construir conocimiento en comunidad.",
    ],
  },
  {
    title: "7. Expresión artística",
    paragraphs: [
      "El arte es un medio fundamental para el desarrollo emocional, creativo y expresivo. A través de talleres, integramos disciplinas como las artes plásticas y escénicas como parte del proceso de aprendizaje, permitiendo que las niñas y niños elaboren su mundo interno y se expresen con libertad.",
    ],
    cta: { label: "Conocer más", href: "#expresion-artistica" },
  },
  {
    title: "8. Movimiento y desarrollo corporal",
    paragraphs: [
      "El cuerpo es parte esencial del aprendizaje.",
      "Generamos experiencias de movimiento que responden a las necesidades e intereses del grupo, ofreciendo talleres como circo, fútbol, danza y otras actividades corporales que permiten canalizar energía, favorecer la autorregulación y fortalecer la conexión con el propio cuerpo.",
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
