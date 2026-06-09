import Image from "next/image";
import { FloatingSkills } from "./floating-skills";
import { ScrollFloatingFerns } from "./scroll-floating-ferns";
import { AccompanimentGroupsTabs } from "./accompaniment-groups-tabs";

type TextBlock = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  cta?: {
    label: string;
    href: string;
  };
};

const methodologyCardBackgrounds = [
  "color-mix(in srgb, var(--complement-700) 34%, white)",
  "color-mix(in srgb, var(--brand-600) 28%, white)",
  "color-mix(in srgb, var(--orange-500) 34%, white)",
  "color-mix(in srgb, var(--complement-900) 24%, white)",
];

type AccompanyPillar = TextBlock & {
  imageSrc: string;
  imageAlt: string;
};

type IllustratedTextBlock = TextBlock & {
  imageSrc: string;
  imageAlt: string;
};

const accompanyCopy = {
  eyebrow: "COMO ACOMPAÑAMOS",
  title: "Cómo acompañamos",
  intro:
    "Nuestro enfoque pedagógico integra la mirada antroposófica, la inteligencia socioemocional, el aprendizaje transdisciplinario basado en proyectos, y las habilidades basadas en diversas investigaciones que se definen como habilidades del siglo 21, promoviendo experiencias de aprendizaje que responden al desarrollo integral de cada niña y niño.",
};

const accompanyPillars: AccompanyPillar[] = [
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

const cultivatedSkills = [
  "Pensamiento crítico",
  "Colaboración",
  "Comunicación",
  "Creatividad",
  "Inteligencia socioemocional",
  "Conexión con la naturaleza",
  "Autoconocimiento",
];

const accompanimentGroups = [
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

const methodologies: TextBlock[] = [
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

const ecoCycleStages = [
  "Semilla: El potencial comienza a emerger. Está presente, aunque aún de forma incipiente.",
  "Brote: El potencial se expresa de manera más constante y en distintos contextos.",
  "Árbol: El potencial ha madurado y se manifiesta de forma integrada en diferentes áreas de la vida.",
  "Fuego: El potencial entra en una fase de transformación, donde necesita renovarse para seguir evolucionando.",
];

const evaluationBlocks: IllustratedTextBlock[] = [
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

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl space-y-5">
      {eyebrow ? (
        <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className="text-4xl leading-[0.95] tracking-tight text-black md:text-5xl lg:text-6xl"
        style={{ fontFamily: "var(--font-roboto-condensed)" }}
      >
        {title}
      </h2>
      {children ? (
        <div className="space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ContentCard({
  block,
  background,
  className = "",
}: {
  block: TextBlock;
  background?: string;
  className?: string;
}) {
  return (
    <article
      className={`rounded-[2rem] border border-complement-600 bg-white/70 p-6 shadow-sm ${className}`}
      style={background ? { background } : undefined}
    >
      <h3
        className="mb-3 text-2xl leading-none text-black"
        style={{ fontFamily: "var(--font-roboto-condensed)" }}
      >
        {block.title}
      </h3>
      <div className="space-y-3 text-sm leading-relaxed text-black/80 md:text-base">
        {block.paragraphs?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {block.bullets ? <BulletList items={block.bullets} /> : null}
      </div>
      {block.cta ? (
        <a
          href={block.cta.href}
          className="mt-5 inline-flex rounded-full border border-complement-700 px-4 py-2 text-sm font-semibold text-[var(--complement-800)] transition hover:bg-[var(--complement-100)]"
        >
          {block.cta.label}
        </a>
      ) : null}
    </article>
  );
}

function IllustratedContentCard({ block }: { block: IllustratedTextBlock }) {
  return (
    <article className="grid overflow-hidden rounded-[2rem] border border-complement-600 bg-white/70 shadow-sm md:grid-cols-[1.35fr_0.85fr]">
      <div className="p-6">
        <h3
          className="mb-3 text-2xl leading-none text-black"
          style={{ fontFamily: "var(--font-roboto-condensed)" }}
        >
          {block.title}
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-black/80 md:text-base">
          {block.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {block.bullets ? <BulletList items={block.bullets} /> : null}
        </div>
        {block.cta ? (
          <a
            href={block.cta.href}
            className="mt-5 inline-flex rounded-full border border-complement-700 px-4 py-2 text-sm font-semibold text-[var(--complement-800)] transition hover:bg-[var(--complement-100)]"
          >
            {block.cta.label}
          </a>
        ) : null}
      </div>
      <div className="relative min-h-[13rem] border-t border-complement-600 md:min-h-full md:border-t-0 md:border-l">
        <Image
          src={block.imageSrc}
          alt={block.imageAlt}
          fill
          className="object-cover"
        />
      </div>
    </article>
  );
}

function AccompanyPillarCard({ pillar }: { pillar: AccompanyPillar }) {
  return (
    <article className="grid overflow-hidden rounded-[2rem] border border-complement-600 bg-[color-mix(in_srgb,var(--complement-700)_22%,transparent)] shadow-sm md:grid-cols-[1.35fr_0.9fr]">
      <div className="p-6 md:p-8">
        <h3
          className="mb-3 text-3xl leading-none text-[var(--complement-900)]"
          style={{ fontFamily: "var(--font-indie-flower)" }}
        >
          {pillar.title}
        </h3>
        <div className="max-w-2xl space-y-3 text-base leading-relaxed text-[var(--complement-900)] md:text-lg">
          {pillar.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <div className="relative min-h-[13rem] border-t border-complement-600 md:min-h-full md:border-t-0 md:border-l">
        <Image
          src={pillar.imageSrc}
          alt={pillar.imageAlt}
          fill
          className="object-cover"
        />
      </div>
    </article>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-5 text-black/80">
      {items.map((item) => (
        <li
          key={item}
          className="list-disc marker:text-[var(--complement-800)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ComoAcompanamosPage() {
  return (
    <main className="bg-white" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section
        id="como-acompanamos"
        className="scroll-mt-28 mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14"
      >
        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <SectionHeading
            eyebrow={accompanyCopy.eyebrow}
            title={accompanyCopy.title}
          >
            <p>{accompanyCopy.intro}</p>
          </SectionHeading>
          <div className="relative mx-auto w-full max-w-[22rem] lg:pt-20">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <Image
                src="/assets/images/DSC01280.png"
                alt="Acompañantes y niñez compartiendo un espacio de aprendizaje"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        <div className="mt-20 space-y-6 md:mt-24">
          {accompanyPillars.map((pillar) => (
            <AccompanyPillarCard key={pillar.title} pillar={pillar} />
          ))}
        </div>

        <FloatingSkills skills={cultivatedSkills} />
      </section>

      <section
        id="grupos-de-acompanamiento"
        className="scroll-mt-28 bg-[#f7f6f1]"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <SectionHeading title="Grupos de acompañamiento">
            <p>
              Nuestros grupos se organizan a partir de las etapas evolutivas,
              respondiendo a las necesidades físicas, emocionales, sociales y
              cognitivas de cada momento del desarrollo.
            </p>
          </SectionHeading>
          <AccompanimentGroupsTabs groups={accompanimentGroups} />
        </div>
      </section>

      <section
        id="metodologias-y-experiencias"
        className="scroll-mt-28 bg-white"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:px-14 lg:py-14">
          <div className="lg:order-2">
            <SectionHeading title="Metodologías y experiencias de aprendizaje">
              <p>
                Nuestro enfoque pedagógico se vive a través de metodologías
                activas, vivenciales y transdisciplinarias que integran el
                pensamiento, la emoción, el cuerpo y la acción. No enseñamos
                contenidos aislados, sino experiencias que conectan a las niñas
                y niños con el mundo y consigo mism@s.
              </p>
            </SectionHeading>
            <div className="mt-10 space-y-8 pb-28">
              {methodologies.map((methodology, index) => (
                <div
                  key={methodology.title}
                  className="sticky top-28"
                  style={{ zIndex: index + 1 }}
                >
                  <ContentCard
                    block={methodology}
                    background={methodologyCardBackgrounds[index % methodologyCardBackgrounds.length]}
                    className="h-[20.5rem] overflow-y-auto md:h-[22rem]"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:order-1 lg:block">
            <ScrollFloatingFerns sectionId="metodologias-y-experiencias" />
          </div>
        </div>
      </section>

      <section id="evaluacion" className="scroll-mt-28 bg-[#f7f6f1]">
        <div className="mx-auto grid w-full max-w-7xl items-start gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-14 lg:py-14">
          <div>
            <SectionHeading title="Evaluación">
              <p className="text-2xl font-semibold text-black">
                Evaluamos para acompañar, no para clasificar.
              </p>
              <p>
                A través de la observación continua, el Ecociclo y el diálogo
                con las familias, hacemos visible el desarrollo integral de cada
                niñ@.
              </p>
              <p>
                Nuestro enfoque reconoce el aprendizaje como un proceso vivo,
                único y en constante evolución para toda la comunidad.
              </p>
              <a
                href="#evaluacion-detallada"
                className="inline-flex rounded-full border border-complement-700 px-4 py-2 text-sm font-semibold text-[var(--complement-800)] transition hover:bg-[var(--complement-100)]"
              >
                Conocer más
              </a>
            </SectionHeading>
          </div>
          <div className="relative mx-auto w-full max-w-[22rem]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <Image
                src="/assets/images/DSC01386.png"
                alt="Acompañante registrando procesos de aprendizaje en comunidad"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div
            id="evaluacion-detallada"
            className="mx-auto grid w-full max-w-5xl scroll-mt-28 gap-6 lg:col-span-2"
          >
            {evaluationBlocks.map((block) => (
              <IllustratedContentCard key={block.title} block={block} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
