import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const accompanyCopy = {
  eyebrow: "COMO ACOMPANAMOS",
  titleLine1: "Un aprendizaje",
  titleLine2: "vivo y en comunidad",
  intro: [
    "Acompañamos el desarrollo de cada niña y niño de manera integral, respetando sus etapas evolutivas y reconociendo que cada proceso es unico.",
    "Nuestro enfoque une la mirada antroposofica, la educacion socioemocional y experiencias vivenciales que integran pensamiento, cuerpo y emocion, dentro de una comunidad donde familias, niñ@s y colaboradores participan de forma activa y corresponsable.",
    "No entendemos el aprendizaje como la adquisicion de contenidos aislados, sino como un proceso vivo que conecta a cada persona consigo misma, con l@s demas y con el mundo.",
    "Nuestro curriculo es una guia flexible que se adapta a los procesos de cada grupo y de cada niñ@.",
    "No es una receta, es una brujula que orienta procesos de aprendizaje vivos.",
  ],
  featured:
    "Acompañamos procesos para que cada niña y niño despliegue sus dones, fortalezca su autonomia y participe conscientemente en la vida comunitaria.",
};

const accompanimentGroups = [
  {
    title: "Grupo Esporas",
    ageRange: "3 a 6 años",
    imageSrc: "/assets/img7.jpg",
    imageAlt: "Niñas y niños pequeños explorando en la naturaleza",
    paragraphs: [
      "En esta etapa, las niñas y niños se encuentran en un momento de profunda conexion con el juego, la imaginacion y el cuerpo.",
      "Acompañamos creando un entorno seguro, ritmico y amoroso donde el juego libre, la exploracion sensorial y el vinculo cercano son la base del desarrollo.",
      "Se siembran aspectos fundamentales como seguridad emocional, autonomia, lenguaje y capacidad de imaginar y crear.",
    ],
  },
  {
    title: "Grupo Koru",
    ageRange: "6/5 a 7/8 años",
    imageSrc: "/assets/img9.jpg",
    imageAlt: "Niñas y niños en una etapa de transición de aprendizaje",
    paragraphs: [
      "Es una etapa de transicion profunda: comienzan a salir del mundo predominantemente imaginativo para abrirse al entendimiento del mundo real.",
      "Surge una nueva relacion con la autoridad y el aprendizaje, mientras fortalecen respeto, pertenencia e identidad.",
      "Acompañamos la curiosidad, los vinculos sociales y el pasaje progresivo hacia aprendizajes con proposito.",
    ],
  },
  {
    title: "Grupo Helechos 1",
    ageRange: "8 a 9/5 años",
    imageSrc: "/assets/img4.jpg",
    imageAlt: "Grupo escolar en actividades colaborativas",
    paragraphs: [
      "En esta etapa aparece una mayor conciencia del mundo, de si mism@s y de l@s demas.",
      "Se intensifican la necesidad de pertenecer, la sensibilidad hacia la justicia y los desafios vinculares.",
      "Acompañamos la autorregulacion emocional, los limites, la convivencia y el cuidado mutuo.",
    ],
  },
  {
    title: "Grupo Helechos 2",
    ageRange: "9/8 a 12 años",
    imageSrc: "/assets/img6.jpg",
    imageAlt: "Niñez desarrollando autonomía y pensamiento crítico",
    paragraphs: [
      "Se fortalece la conciencia de si mism@s, de sus decisiones y de su impacto en el entorno.",
      "Crece el pensamiento critico, la capacidad de reflexion y el deseo de participar activamente en la comunidad.",
      "Acompañamos autonomia, responsabilidad y toma de decisiones con proposito y servicio.",
    ],
  },
];

type TextImageSectionProps = {
  title: string;
  subtitle?: string;
  paragraphs: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  titleLevel?: "h2" | "h3";
  sectionClassName?: string;
};

function TextImageSection({
  title,
  subtitle,
  paragraphs,
  imageSrc,
  imageAlt,
  reverse = false,
  titleLevel = "h2",
  sectionClassName = "bg-white",
}: TextImageSectionProps) {
  const TitleTag = titleLevel;

  return (
    <section className={sectionClassName}>
      <div
        className={`mx-auto grid w-full max-w-7xl items-center gap-8 px-6 py-10 md:px-10 md:py-12 lg:gap-10 lg:px-14 lg:py-14 ${
          reverse ? "lg:grid-cols-[0.95fr_1.05fr]" : "lg:grid-cols-[1.05fr_0.95fr]"
        }`}
      >
        <div className={reverse ? "lg:order-2" : ""}>
          <TitleTag
            className="mb-5 text-3xl leading-[1] tracking-tight text-black md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            {title}
            {subtitle ? (
              <span
                className="mt-2 block text-2xl md:text-3xl lg:text-4xl"
                style={{ fontFamily: "var(--font-indie-flower)" }}
              >
                {subtitle}
              </span>
            ) : null}
          </TitleTag>
          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className={`relative mx-auto w-full max-w-[22rem] ${reverse ? "lg:order-1" : ""}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ComoAcompanamosPage() {
  return (
    <main className="bg-white" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-14 lg:py-14">
        <div className="space-y-5">
          <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">{accompanyCopy.eyebrow}</p>
          <h1 className="space-y-1 text-4xl leading-[0.95] tracking-tight text-black md:text-5xl lg:text-6xl">
            <span className="block font-light" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
              {accompanyCopy.titleLine1}
            </span>
            <span className="block italic" style={{ fontFamily: "var(--font-indie-flower)" }}>
              {accompanyCopy.titleLine2}
            </span>
          </h1>
          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
            {accompanyCopy.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[22rem]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image
              src="/assets/img6.jpg"
              alt="Acompañantes y niñez compartiendo un espacio de aprendizaje"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f3f2ef]">
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <p
            className="mx-auto max-w-4xl text-center text-2xl leading-[1.25] text-black md:text-3xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            {accompanyCopy.featured}
          </p>
        </div>
      </section>

      <TextImageSection
        title="Grupos de acompañamiento"
        imageSrc="/assets/img8.jpg"
        imageAlt="Comunidad educativa organizada por etapas evolutivas"
        paragraphs={[
          "Nuestros grupos se organizan a partir de las etapas evolutivas, respondiendo a las necesidades fisicas, emocionales, sociales y cognitivas de cada momento del desarrollo.",
          "Cada grupo tiene objetivos, ritmos y formas de acompañamiento especificas.",
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 pb-10 md:px-10 md:pb-12 lg:px-14 lg:pb-14">
          <Tabs
            defaultValue={accompanimentGroups[0].title}
            className="grid gap-6 md:grid-cols-[18rem_minmax(0,1fr)] md:items-stretch"
          >
            <TabsList className="grid h-[32rem] w-full grid-rows-4 gap-0 rounded-none bg-transparent px-0 py-2">
              {accompanimentGroups.map((group, index) => (
                <TabsTrigger
                  key={group.title}
                  value={group.title}
                  className="relative h-full w-full flex-col items-start justify-center rounded-none border-0 bg-transparent px-3 py-4 text-left font-normal whitespace-normal text-black/85 data-[active]:bg-transparent data-[active]:!text-[var(--complement-800)] data-[selected]:!text-[var(--complement-800)] aria-selected:!text-[var(--complement-800)]"
                >
                  <span
                    className="block text-[1.9rem] leading-[0.95]"
                    style={{ fontFamily: "var(--font-roboto-condensed)" }}
                  >
                    {group.title}
                  </span>
                  <span
                    className="mt-2 block text-[1.8rem] leading-none"
                    style={{ fontFamily: "var(--font-indie-flower)" }}
                  >
                    {group.ageRange}
                  </span>
                  {index < accompanimentGroups.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-0 bottom-0 left-0 h-px"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to right, currentColor 0 10px, transparent 10px 18px)",
                        color: "rgb(var(--complement-700) / 0.75)",
                      }}
                    />
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
            {accompanimentGroups.map((group, index) => (
              <TabsContent
                key={group.title}
                value={group.title}
                className="mt-0 h-full rounded-[2rem] border border-complement-600 bg-transparent p-3 md:p-4"
              >
                <TextImageSection
                  title={group.title}
                  subtitle={group.ageRange}
                  paragraphs={group.paragraphs}
                  imageSrc={group.imageSrc}
                  imageAlt={group.imageAlt}
                  reverse={false}
                  titleLevel="h3"
                  sectionClassName="bg-transparent"
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <TextImageSection
        title="Metodologias y experiencias de aprendizaje"
        imageSrc="/assets/img9.jpg"
        imageAlt="Niñez colaborando en una experiencia de proyecto"
        reverse
        sectionClassName="bg-[#f7f6f1]"
        paragraphs={[
          "Integramos proyectos transdisciplinarios, inteligencia socioemocional y herramientas de Comunicacion NoViolenta para aprender con sentido.",
          "Fortalecemos lectura, escritura y matematicas con metodologias estructuradas y respetuosas de procesos individuales.",
          "Promovemos pensamiento critico con circulos socraticos y asambleas, y habilidades para la vida con herramientas de organizacion y autonomia.",
          "El arte, el movimiento corporal y la conciencia ecologica son ejes centrales para el desarrollo integral.",
          "Familias, niñez y colaboradores participan como un organismo vivo de corresponsabilidad.",
        ]}
      />

      <TextImageSection
        title="Evaluacion"
        imageSrc="/assets/img4.jpg"
        imageAlt="Acompañante registrando procesos de aprendizaje en comunidad"
        paragraphs={[
          "Entendemos la evaluacion como un proceso continuo de crecimiento y auto-observacion, no como un momento aislado ni una definicion.",
          "Observamos, registramos y compartimos el proceso de cada niñ@, visibilizando su desarrollo corporal, emocional, social, cognitivo y de autogestion.",
          "Evaluamos para acompañar, no para clasificar: reconocer avances, identificar oportunidades y ajustar el acompañamiento.",
          "Usamos el Ecociclo (Semilla, Brote, Arbol y Fuego) para comunicar el desarrollo de forma integral y dinamica.",
          "Tambien sostenemos una cultura de mejora continua del equipo mediante autoevaluacion, evaluacion entre colegas y formacion constante.",
        ]}
      />
    </main>
  );
}

