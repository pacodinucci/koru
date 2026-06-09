import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { TeamApplicationForm } from "./team-application-form";

type TextImageSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  sectionClassName?: string;
  children?: ReactNode;
};

const buttonClassName =
  "inline-flex items-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5";

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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 pl-5 text-base leading-relaxed text-black/75 md:text-lg">
      {items.map((item) => (
        <li key={item} className="list-disc marker:text-[var(--complement-800)]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function LinkGrid({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <Link key={link.label} href={link.href} className={buttonClassName}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

const communityAgreements = [
  {
    title: "Participación activa de las familias",
    text: "Las familias forman parte esencial del proceso educativo. Participan en espacios de formación, acompañamiento y diálogo, dando continuidad en casa a lo que se vive en la comunidad.",
  },
  {
    title: "Comunicación consciente",
    text: "Nos relacionamos desde el respeto, la escucha y la honestidad. Buscamos comprender antes que reaccionar, y utilizamos herramientas como la Comunicación No Violenta para gestionar los conflictos.",
  },
  {
    title: "Respeto a los procesos individuales",
    text: "Reconocemos que cada niñ@ tiene su propio ritmo de desarrollo. Evitamos comparaciones y acompañamos desde la observación y la comprensión.",
  },
  {
    title: "Cuidado del entorno y de los espacios",
    text: "Todos somos responsables del cuidado de los espacios y de la naturaleza. Fomentamos prácticas conscientes como la separación de residuos, el uso responsable de recursos y el respeto por el entorno.",
  },
  {
    title: "Coherencia entre casa y comunidad",
    text: "Buscamos generar continuidad entre lo que se vive en la comunidad y en casa, sosteniendo acuerdos que brinden claridad y seguridad a las niñas y niños.",
  },
  {
    title: "Resolución consciente de conflictos",
    text: "Los conflictos son oportunidades de aprendizaje. Acompañamos los procesos con presencia, límites claros y herramientas que favorecen la comprensión y la reparación.",
  },
  {
    title: "Compromiso con el proceso",
    text: "Ser parte de la comunidad implica disposición para observar, aprender y participar activamente en el desarrollo individual y colectivo.",
  },
];

const protocols = [
  {
    id: "resolucion-de-conflictos",
    title: "Resolución de conflictos",
    text: "Los conflictos son oportunidades de aprendizaje. Los acompañamos con presencia, límites claros, escucha y reparación.",
  },
  {
    id: "prevencion-y-manejo-de-enfermedades",
    title: "Prevención y manejo de enfermedades",
    text: "Sostenemos criterios claros para cuidar la salud individual y colectiva, con comunicación oportuna entre casa y comunidad.",
  },
  {
    id: "protocolos-de-higiene",
    title: "Protocolos de higiene",
    text: "Incluyen prácticas preventivas como cuidado cotidiano de espacios, hábitos de limpieza y prevención de piojos.",
  },
  {
    id: "atencion-a-emergencias",
    title: "Atención a emergencias",
    text: "Definen cómo actuar ante situaciones imprevistas para brindar claridad, seguridad y confianza a todas las familias.",
  },
];

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
              Niñas, niños, familias y colaboradores formamos un mismo organismo, donde cada parte influye en el
              desarrollo individual y colectivo.
            </p>
            <p>
              Por eso, el acompañamiento no ocurre sólo dentro del espacio educativo, sino también en casa y en la
              relación cotidiana.
            </p>
            <p>
              Ser parte de este espacio implica formar parte de una comunidad que aprende, se cuestiona y evoluciona.
            </p>
          </div>

          <BulletList items={["Cuestionar", "Aprender", "Construir en conjunto", "Participar"]} />
        </div>

        <div className="relative mx-auto w-full max-w-[22rem] lg:mx-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image
              src="/assets/images/comu3.png"
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
            No buscamos familias perfectas, sino disponibles a participar activa y comprometidamente.
          </p>
        </div>
      </section>

      <TextImageSection
        id="escuela-para-familias"
        title="Escuela para familias"
        imageSrc="/assets/images/comu1.png"
        imageAlt="Encuentros de formación para familias"
        reverse
        sectionClassName="bg-white"
        paragraphs={[
          "Contamos con un espacio de formación y acompañamiento para madres y padres, con el propósito de construir una visión compartida sobre cómo acompañar el desarrollo de las niñas y niños.",
          "Los talleres introductorios obligatorios —Comunicación No Violenta y etapas evolutivas desde la antroposofía— están incluidos en la cuota de inscripción.",
          "También realizamos talleres y charlas dos veces al mes sobre gestión emocional, retos cotidianos en la crianza, construcción de acuerdos, educación sexual, retos de cada etapa, pantallas y otros temas.",
          "Algunos encuentros pueden tener costo extra. Además de contenido, estos espacios permiten compartir experiencias, reflexionar y generar herramientas prácticas para la vida diaria.",
        ]}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Link href="/blog" className={buttonClassName}>
              Comunicación No Violenta · Conoce más
            </Link>
            <Link href="/blog" className={buttonClassName}>
              Etapas evolutivas · Conoce más
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/family-dashboard/calendario" className={buttonClassName}>
              Calendario
            </Link>
            <Link href="/blog" className={buttonClassName}>
              Charlas anteriores y artículos
            </Link>
          </div>
        </div>
      </TextImageSection>

      <TextImageSection
        id="acompanamiento-conjunto"
        title="Acompañamiento conjunto"
        imageSrc="/assets/images/comu5.png"
        imageAlt="Acompañamiento entre familia y comunidad educativa"
        sectionClassName="bg-[#f7f6f1]"
        paragraphs={[
          "Nuestra comunidad se sostiene a partir de acuerdos que nos permiten convivir, acompañar y crecer de manera coherente.",
          "Estos acuerdos no son reglas impuestas, sino compromisos compartidos que hacen posible el bienestar individual y colectivo.",
        ]}
      >
        <Link href="#acuerdos-comunidad" className={buttonClassName}>
          Conoce los acuerdos que mantenemos como comunidad
        </Link>
      </TextImageSection>

      <section id="acuerdos-comunidad" className="scroll-mt-36 bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <h2
            className="mb-5 text-3xl leading-[1] tracking-tight text-black md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Acuerdos de la comunidad
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communityAgreements.map((agreement) => (
              <article key={agreement.title} className="rounded-2xl border border-black/10 bg-[#f7f6f1] p-5">
                <h3 className="text-2xl leading-tight text-black" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
                  {agreement.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black/75 md:text-base">{agreement.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-base leading-relaxed text-black/75 md:text-lg">
            Estos acuerdos son la base que nos permite sostener una comunidad viva, donde el aprendizaje, el cuidado y
            la convivencia se construyen entre todos.
          </p>
        </div>
      </section>

      <TextImageSection
        id="protocolos-y-cuidado"
        title="Protocolos y cuidado"
        imageSrc="/assets/images/comu2.png"
        imageAlt="Cuidado y seguridad en la comunidad"
        reverse
        sectionClassName="bg-[#f7f6f1]"
        paragraphs={[
          "Para sostener un entorno seguro y coherente, contamos con protocolos claros que forman parte del funcionamiento de la comunidad.",
          "Estos lineamientos permiten cuidar el bienestar individual y colectivo, generando claridad y confianza para todas las familias.",
        ]}
      >
        <LinkGrid links={protocols.map((protocol) => ({ label: protocol.title, href: `#${protocol.id}` }))} />
      </TextImageSection>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-10 md:grid-cols-2 md:px-10 md:py-12 lg:grid-cols-4 lg:px-14 lg:py-14">
          {protocols.map((protocol) => (
            <article id={protocol.id} key={protocol.id} className="scroll-mt-36 rounded-2xl border border-black/10 p-5">
              <h3 className="text-2xl leading-tight text-black" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
                {protocol.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-black/75 md:text-base">{protocol.text}</p>
            </article>
          ))}
        </div>
      </section>

      <TextImageSection
        id="dia-a-dia-en-koru"
        title="El día a día en KORU"
        imageSrc="/assets/images/comu6.png"
        imageAlt="Vida cotidiana en la comunidad Koru"
        paragraphs={[
          "Conoce cómo se vive cada día en KORU a través del ritmo de cada grupo y de nuestras celebraciones comunitarias.",
          "Cada etapa tiene necesidades, experiencias y formas de acompañamiento distintas; por eso organizamos la vida cotidiana con ritmos claros y acordes al momento evolutivo.",
        ]}
      >
        <div className="space-y-5">
          <LinkGrid
            links={[
              { label: "Ritmo en Esporas", href: "/como-acompanamos#grupo-esporas" },
              { label: "Ritmo en Grupo Koru", href: "/como-acompanamos#grupo-koru" },
              { label: "Ritmo en Helechos 1", href: "/como-acompanamos#grupo-helechos-1" },
              { label: "Ritmo en Helechos 2", href: "/como-acompanamos#grupo-helechos-2" },
            ]}
          />
          <div>
            <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-black/55">NUESTRAS CELEBRACIONES COMUNITARIAS</p>
            <BulletList
              items={["Celebración del Maíz", "Celebración día de muertos", "Bazar navideño", "Kermés de primavera"]}
            />
          </div>
        </div>
      </TextImageSection>

      <TextImageSection
        id="unete-al-equipo"
        title="Únete al equipo"
        imageSrc="/assets/images/comu4.png"
        imageAlt="Equipo educativo en comunidad"
        reverse
        sectionClassName="bg-[#f7f6f1]"
        paragraphs={[
          "Si querés sumarte a KORU, completá el formulario y contanos sobre tu experiencia, tu área de interés y tu motivación para formar parte de la comunidad.",
        ]}
      >
        <TeamApplicationForm />
      </TextImageSection>
    </main>
  );
}
