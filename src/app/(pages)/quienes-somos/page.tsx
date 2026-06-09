import Image from "next/image";

import { FacilitiesCarousel } from "./facilities-carousel";

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
    name: "Karla Novelo",
    role: "Fundadora y Directora General",
    imageSrc: "/assets/images/equipo11.png",
  },
  {
    name: "Florencia Bennetts",
    role: "Directora de la Cultura",
    imageSrc: "/assets/images/equipo10.png",
  },
  {
    name: "Daniel",
    role: "Coordinador Psicopedagógico",
  },
  {
    name: "Samantha",
    role: "Coordinadora Académica",
    imageSrc: "/assets/images/equipo7.png",
  },
  {
    name: "Radha",
    role: "Tutora Grupo Esporas",
    imageSrc: "/assets/images/equipo3.png",
  },
  {
    name: "Nélida",
    role: "Tutora Grupo Esporas",
  },
  {
    name: "Isaac",
    role: "Tutor Grupo Koru",
  },
  {
    name: "Indra",
    role: "Asistente Grupo Koru",
  },
  {
    name: "Beatriz",
    role: "Tutora de Helechos 1",
    imageSrc: "/assets/images/equipo1.png",
  },
  {
    name: "Jari",
    role: "Asistente Helechos 1",
  },
  {
    name: "Diego",
    role: "Co-tutor Helechos 2",
  },
  {
    name: "Vamsi",
    role: "Co-tutora Helechos 2",
  },
  {
    name: "Violeta",
    role: "Maestra de Lectura y Matemáticas",
    imageSrc: "/assets/images/equipo9.png",
  },
  {
    name: "Francisco",
    role: "Circo",
    imageSrc: "/assets/images/equipo12.png",
  },
  {
    name: "Michael",
    role: "Ecología",
  },
];

const facilityImages = [
  {
    src: "/assets/images/insta1.png",
    alt: "Instalaciones de Koru preparadas para actividades de aprendizaje",
    caption: "Instalaciones Koru.",
  },
  {
    src: "/assets/images/insta2.png",
    alt: "Espacio interior de Koru para explorar y convivir",
    caption: "Espacios para explorar, crear y convivir.",
  },
  {
    src: "/assets/images/insta3.png",
    alt: "Ambiente de aprendizaje dentro de las instalaciones de Koru",
    caption: "Ambientes pensados para aprender en comunidad.",
    objectPosition: "center bottom",
  },
  {
    src: "/assets/images/insta4.png",
    alt: "Área de Koru preparada para experiencias educativas",
    caption: "Rincones vivos para el aprendizaje cotidiano.",
  },
  {
    src: "/assets/images/insta5.png",
    alt: "Instalación de Koru con materiales y espacios de trabajo",
    caption: "Espacios que acompañan distintas formas de aprender.",
  },
  {
    src: "/assets/images/insta6.png",
    alt: "Vista de una instalación de Koru",
    caption: "Entornos cálidos para compartir y descubrir.",
  },
  {
    src: "/assets/images/insta7.png",
    alt: "Espacio de convivencia en las instalaciones de Koru",
    caption: "Lugares para el encuentro y la colaboración.",
  },
  {
    src: "/assets/images/insta8.png",
    alt: "Instalaciones de Koru integradas al día a día de la comunidad",
    caption: "Instalaciones integradas a la vida de la comunidad.",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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
              {member.imageSrc ? (
                <Image
                  src={member.imageSrc}
                  alt={`${member.name}, ${member.role}`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover opacity-65 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f3d889] text-6xl font-semibold text-slate-950/80 transition duration-300 group-hover:text-slate-950 group-focus-visible:text-slate-950">
                  {getInitials(member.name)}
                </div>
              )}
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

function FacilitiesSection() {
  return (
    <section className="overflow-hidden bg-white py-16 md:py-20 lg:py-24">
      <div className="mx-auto mb-10 w-full max-w-7xl px-6 md:px-10 lg:px-14">
        <p className="mb-4 text-sm font-medium tracking-[0.18em] text-[#6d7e96]">
          INSTALACIONES
        </p>
      </div>

      <FacilitiesCarousel images={facilityImages} />
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
        imageSrc="/assets/images/image2.png"
        imageAlt="Niñas y niños aprendiendo juntos en la naturaleza"
      />

      <MissionVisionSection
        title={missionVisionCopy.visionTitle}
        paragraphs={missionVisionCopy.visionParagraphs}
        imageSrc="/assets/images/image1.png"
        imageAlt="Comunidad educativa compartiendo actividades"
        reverse
      />

      <TeamSection />
      <FacilitiesSection />
    </main>
  );
}
