import Image from "next/image";
import Link from "next/link";

type TextImageSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  sectionClassName?: string;
  children?: React.ReactNode;
};

function TextImageSection({
  id,
  title,
  subtitle,
  paragraphs,
  imageSrc,
  imageAlt,
  reverse = false,
  sectionClassName = "bg-white",
  children,
}: TextImageSectionProps) {
  return (
    <section id={id} className={`${sectionClassName} scroll-mt-36`}>
      <div
        className={`mx-auto grid w-full max-w-7xl items-center gap-8 px-6 py-10 md:px-10 md:py-12 lg:gap-10 lg:px-14 lg:py-14 ${
          reverse ? "lg:grid-cols-[0.95fr_1.05fr]" : "lg:grid-cols-[1.05fr_0.95fr]"
        }`}
      >
        <div className={reverse ? "lg:order-2" : ""}>
          <h2
            className="mb-5 text-3xl leading-[1] tracking-tight text-black md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            {title}
            {subtitle ? (
              <span
                className="mt-2 block text-2xl md:text-3xl"
                style={{ fontFamily: "var(--font-indie-flower)" }}
              >
                {subtitle}
              </span>
            ) : null}
          </h2>

          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {children ? <div className="mt-5">{children}</div> : null}
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

export default function ComunidadPage() {
  return (
    <main className="bg-white pb-16" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section
        id="nuestra-comunidad"
        className="mx-auto grid w-full max-w-7xl items-start gap-8 px-6 pt-10 md:px-10 md:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-14 lg:pt-14"
      >
        <div className="space-y-5">
          <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">COMUNIDAD</p>

          <h1 className="space-y-1 text-4xl leading-[0.95] tracking-tight text-black md:text-5xl lg:text-6xl">
            <span className="block font-light" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
              Creemos que la educación
            </span>
            <span className="block italic" style={{ fontFamily: "var(--font-indie-flower)" }}>
              es un proceso compartido
            </span>
          </h1>

          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
            <p>
              Niñas, niños, familias y colaboradores formamos un mismo organismo donde cada parte influye en el
              desarrollo individual y colectivo.
            </p>
            <p>Ser parte de esta comunidad implica una participación activa, comprometida y corresponsable.</p>
            <p>No buscamos familias perfectas, sino disponibles a cuestionar, aprender, construir y participar.</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[22rem] lg:mx-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image
              src="/assets/img7.jpg"
              alt="Comunidad Koru compartiendo actividades"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mt-8 bg-[#f3f2ef] md:mt-10 lg:mt-12">
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <p
            className="mx-auto max-w-5xl text-center text-2xl leading-[1.25] text-black md:text-3xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            La comunidad se sostiene cuando casa y espacio educativo caminan en la misma dirección.
          </p>
        </div>
      </section>

      <TextImageSection
        title="El día a día"
        imageSrc="/assets/img9.jpg"
        imageAlt="Vida cotidiana en la comunidad Koru"
        paragraphs={[
          "La vida cotidiana se organiza con ritmos claros, espacios de juego, proyectos y tiempos de encuentro.",
          "Cada jornada busca equilibrio entre movimiento, vínculo, aprendizaje y descanso.",
          "También celebramos eventos comunitarios donde familias, niñas, niños y colaboradores fortalecen el organismo vivo que somos.",
        ]}
      />

      <TextImageSection
        title="Acompañamiento conjunto"
        imageSrc="/assets/img4.jpg"
        imageAlt="Acompañamiento entre familia y comunidad educativa"
        reverse
        sectionClassName="bg-[#f7f6f1]"
        paragraphs={[
          "El proceso de cada niña y niño se acompaña de manera cercana también con su familia.",
          "Sostenemos seguimiento, comunicación continua y acuerdos compartidos para dar coherencia entre casa y comunidad.",
          "Cada niña y niño cuenta con un registro vivo de avances, procesos y acuerdos para dar continuidad desde casa.",
        ]}
      >
        <Link
          href="/sign-in"
          className="inline-flex items-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5"
        >
          Ingresar
        </Link>
      </TextImageSection>

      <TextImageSection
        title="Corresponsabilidad"
        imageSrc="/assets/img6.jpg"
        imageAlt="Comunidad participando activamente"
        paragraphs={[
          "Entendemos la corresponsabilidad como la base de nuestra comunidad.",
          "Las familias no son observadoras externas: participan, sostienen acuerdos y mantienen una comunicación abierta y respetuosa.",
          "Cuando hay coherencia entre casa y comunidad, niñas y niños encuentran mayor seguridad, claridad y contención.",
        ]}
      >
        <ul className="list-disc space-y-1 pl-6 text-base text-black/75">
          <li>Asambleas comunitarias</li>
          <li>Escuela para Familias</li>
          <li>Talleres introductorios</li>
          <li>Tequios</li>
          <li>Citas de seguimiento</li>
        </ul>
      </TextImageSection>

      <TextImageSection
        id="escuela-para-familias"
        title="Escuela para familias"
        imageSrc="/assets/img8.jpg"
        imageAlt="Encuentros de formación para familias"
        reverse
        sectionClassName="bg-[#f7f6f1]"
        paragraphs={[
          "Contamos con un espacio de formación y acompañamiento para madres y padres, con el objetivo de sostener sintonía en la forma de acompañar las infancias.",
          "Incluye talleres introductorios obligatorios (Comunicación No Violenta y etapas evolutivas) y encuentros quincenales con herramientas prácticas para la vida diaria.",
          "Además de contenido, estos espacios permiten compartir experiencias, reflexionar y construir acuerdos concretos.",
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <a
            href="#"
            className="inline-flex items-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5"
          >
            Calendario
          </a>
          <Link
            href="/blog"
            className="inline-flex items-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5"
          >
            Blog
          </Link>
        </div>
      </TextImageSection>

      <TextImageSection
        id="unete-al-equipo"
        title="Únete al equipo"
        imageSrc="/assets/img10.jpg"
        imageAlt="Equipo educativo en comunidad"
        paragraphs={[
          "Si querés sumarte a Koru, escribinos para conocer búsquedas abiertas y próximos procesos de selección.",
        ]}
      >
        <Link
          href="/admisiones"
          className="inline-flex items-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5"
        >
          Quiero sumarme
        </Link>
      </TextImageSection>

      <TextImageSection
        title="Protocolos y cuidado"
        imageSrc="/assets/img11.jpg"
        imageAlt="Cuidado y seguridad en la comunidad"
        reverse
        sectionClassName="bg-[#f7f6f1]"
        paragraphs={[
          "Para sostener un entorno seguro y coherente, contamos con protocolos claros que forman parte del funcionamiento comunitario.",
          "Estos lineamientos cuidan el bienestar individual y colectivo y brindan claridad para todas las familias.",
        ]}
      >
        <ul className="list-disc space-y-1 pl-6 text-base text-black/75">
          <li>Resolución de conflictos</li>
          <li>Prevención y manejo de enfermedades</li>
          <li>Protocolos de higiene</li>
          <li>Atención a emergencias</li>
        </ul>
      </TextImageSection>
    </main>
  );
}
