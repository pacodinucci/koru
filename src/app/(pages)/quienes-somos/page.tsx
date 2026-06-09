import Image from "next/image";

const whoWeAreCopy = {
  eyebrow: "QUIENES SOMOS",
  titleLine1: "Creado por",
  titleLine2: "familias que cuidan",
  paragraphOne:
    "Koru es un Organismo Social de Aprendizaje (OSA), una comunidad viva donde aprendices, acompañantes, y familias crecemos y aprendemos junt@s.",
  paragraphTwo:
    "Creemos que la educación necesita transformarse. Vivimos en un mundo en constante cambio, marcado por desafíos sociales, ecológicos y tecnológicos cada vez más complejos.",
  paragraphThree:
    "En este contexto, las niñas y los niños necesitan desarrollar capacidades que les permitan comprender su realidad, adaptarse, colaborar con otros y participar activamente en la construcción de un futuro más humano y sostenible.",
  paragraphFour:
    "Por ello, cultivamos el desarrollo integral de las personas y las habilidades necesarias para comprender, cuidar y regenerar el tejido social y ecológico que habitamos.",
  featured:
    "Acompañamos a niñas y niños a desarrollar las habilidades que sabemos son esenciales en el mundo de hoy como: colaborar, comunicar, pensar crítica y creativamente, adaptarse al cambio y convertirse en agentes de transformación positiva en el mundo del que forman parte.",
};

const missionVisionCopy = {
  missionTitle: "Misión",
  missionParagraphs: [
    "Acompañar a niñas, niños y familias en el desarrollo de seres humanos críticos y libres, que se conocen profundamente, desarrollan sus dones, toman decisiones informadas y actúan con congruencia, cuidándose a sí mism@s, a l@s demás y a su entorno.",
  ],
  visionTitle: "Visión",
  visionParagraphs: [
    "Contribuir a una transformación profunda de la educación y de la forma en que habitamos el mundo, para que las personas vivan conectadas con su brújula interna y con la naturaleza, construyan vidas con sentido y pongan sus dones al servicio de una sociedad más humana, colaborativa, pacífica y en armonía con la vida.",
  ],
};

const teamMembers = [
  {
    name: "Equipo Koru",
    role: "Acompañante pedagógica",
    imageSrc: "/assets/images/equipo11.png",
  },
  {
    name: "Equipo Koru",
    role: "Coordinación de comunidad",
    imageSrc: "/assets/images/equipo10.png",
  },
  {
    name: "Equipo Koru",
    role: "Acompañante de aprendizaje",
    imageSrc: "/assets/images/equipo1.png",
  },
  {
    name: "Equipo Koru",
    role: "Acompañante socioemocional",
    imageSrc: "/assets/images/equipo2.png",
  },
  {
    name: "Equipo Koru",
    role: "Tallerista",
    imageSrc: "/assets/images/equipo3.png",
  },
  {
    name: "Equipo Koru",
    role: "Acompañante de naturaleza",
    imageSrc: "/assets/images/equipo8.png",
  },
  {
    name: "Equipo Koru",
    role: "Acompañante de arte",
    imageSrc: "/assets/images/equipo12.png",
  },
  {
    name: "Equipo Koru",
    role: "Gestión y familias",
    imageSrc: "/assets/images/equipo9.png",
  },
  {
    name: "Equipo Koru",
    role: "Acompañante pedagógica",
    imageSrc: "/assets/images/equipo4.png",
  },
  {
    name: "Equipo Koru",
    role: "Coordinación de comunidad",
    imageSrc: "/assets/images/equipo5.png",
  },
  {
    name: "Equipo Koru",
    role: "Acompañante de aprendizaje",
    imageSrc: "/assets/images/equipo7.png",
  },
  {
    name: "Equipo Koru",
    role: "Acompañante socioemocional",
    imageSrc: "/assets/images/equipo6.png",
  },
];

type MissionVisionSectionProps = {
  title: string;
  paragraphs: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
};

function MissionVisionSection({
  title,
  paragraphs,
  imageSrc,
  imageAlt,
  reverse = false,
}: MissionVisionSectionProps) {
  return (
    <section className="bg-white">
      <div
        className={`mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 md:px-10 lg:gap-16 lg:px-14 lg:py-24 ${
          reverse ? "lg:grid-cols-[0.95fr_1.05fr]" : "lg:grid-cols-[1.05fr_0.95fr]"
        }`}
      >
        <div className={reverse ? "lg:order-2" : ""}>
          <h2
            className="mb-8 text-5xl leading-[0.95] tracking-tight text-black md:text-6xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            {title}
          </h2>

          <div className="max-w-3xl space-y-6 text-xl leading-relaxed text-black/85">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className={`relative mx-auto w-full max-w-[28rem] ${reverse ? "lg:order-1" : ""}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section className="bg-[#caa27d] px-6 py-16 md:px-10 lg:px-14 lg:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-4 text-sm font-medium tracking-[0.18em] text-white/75">
            NUESTRO EQUIPO
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4">
          {teamMembers.map((member, index) => (
            <article
              key={`${member.name}-${member.role}-${index}`}
              tabIndex={0}
              className="group relative aspect-[4/5] overflow-hidden bg-black outline-none transition-transform duration-300 ease-out hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:scale-110"
            >
              <Image
                src={member.imageSrc}
                alt={`${member.name}, ${member.role}`}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover opacity-65 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                <h3
                  className="text-3xl leading-none"
                  style={{ fontFamily: "var(--font-roboto-condensed)" }}
                >
                  {member.name}
                </h3>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-white/80">
                  {member.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function QuienesSomosPage() {
  return (
    <main className="bg-white" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-14 lg:py-24">
        <div className="space-y-8">
          <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">
            {whoWeAreCopy.eyebrow}
          </p>

          <h1 className="space-y-1 text-5xl leading-[0.95] tracking-tight text-black md:text-6xl lg:text-7xl">
            <span
              className="block font-light"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              {whoWeAreCopy.titleLine1}
            </span>
            <span
              className="block italic"
              style={{ fontFamily: "var(--font-indie-flower)" }}
            >
              {whoWeAreCopy.titleLine2}
            </span>
          </h1>

          <div className="max-w-3xl space-y-6 text-xl leading-relaxed text-black/85">
            <p>{whoWeAreCopy.paragraphOne}</p>
            <p>{whoWeAreCopy.paragraphTwo}</p>
            <p>{whoWeAreCopy.paragraphThree}</p>
            <p>{whoWeAreCopy.paragraphFour}</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[28rem]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image
              src="/assets/images/DSC01400.png"
              alt="Niñas y niños compartiendo una actividad en comunidad"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f3f2ef]">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 lg:px-14 lg:py-20">
          <p
            className="mx-auto max-w-5xl text-center text-3xl leading-[1.25] text-black md:text-4xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            {whoWeAreCopy.featured}
          </p>
        </div>
      </section>

      <MissionVisionSection
        title={missionVisionCopy.missionTitle}
        paragraphs={missionVisionCopy.missionParagraphs}
        imageSrc="/assets/img7.jpg"
        imageAlt="Niñas y niños aprendiendo juntos en la naturaleza"
      />

      <MissionVisionSection
        title={missionVisionCopy.visionTitle}
        paragraphs={missionVisionCopy.visionParagraphs}
        imageSrc="/assets/img9.jpg"
        imageAlt="Comunidad educativa compartiendo actividades"
        reverse
      />

      <TeamSection />
    </main>
  );
}
