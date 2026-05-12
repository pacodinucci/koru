import Image from "next/image";

const whoWeAreCopy = {
  eyebrow: "QUIENES SOMOS",
  titleLine1: "Creado por",
  titleLine2: "familias que cuidan",
  paragraphOne:
    "Koru es un Organismo Social de Aprendizaje: una comunidad viva donde niñas, niños, familias y acompañantes co-creamos una nueva forma de educar.",
  paragraphTwo:
    "Nuestra propuesta no parte de la transmisión de contenidos, sino de la creación de experiencias significativas, donde el aprendizaje surge en relación, en movimiento y en conexión con la vida.",
  paragraphThree:
    "Creemos que aprender es un proceso profundamente humano que ocurre cuando hay vínculo, sentido y presencia.",
  featured:
    "Formamos personas que se conocen, piensan por sí mismas y actúan con congruencia para transformar su entorno.",
};

const missionVisionCopy = {
  missionTitle: "Misión",
  missionParagraphs: [
    "Somos una comunidad educativa donde niñas, niños, familias y colaboradores co-creamos un espacio de aprendizaje vivo.",
    "Acompañamos de manera personalizada el desarrollo integral de cada niñ@, respetando sus etapas evolutivas y reconociendo sus dones únicos. A través de un enfoque antroposófico, herramientas de inteligencia socioemocional, como la Comunicación NoViolenta y experiencias vivenciales en conexión con la naturaleza y la comunidad, fomentamos el autoconocimiento, el vínculo auténtico y la responsabilidad compartida.",
    "Queremos formar seres humanos que estén conectados consigo mismos, y con su entorno; capaces de poner sus talentos al servicio de la vida.",
  ],
  visionTitle: "Visión",
  visionParagraphs: [
    "Co-crear una cultura donde niñas, niños, familias y colaboradores asumen un rol activo y corresponsable en los procesos de aprendizaje y desarrollo.",
    "Aspiramos a una comunidad donde cada persona fortalezca la conexión con su brújula interna, desarrolle sus dones y participe conscientemente en la regeneración social y ecológica, construyendo formas de vida más humanas, colaborativas y sostenibles.",
  ],
};

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
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[28rem]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image
              src="/assets/img4.jpg"
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
    </main>
  );
}