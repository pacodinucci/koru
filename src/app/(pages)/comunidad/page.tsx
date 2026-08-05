import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProtocolBlobList } from "./protocol-blob-list";
import { TeamApplicationForm } from "./team-application-form";

type TextImageSectionProps = {
  id?: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
  imageSrc?: string;
  imageAlt?: string;
  reverse?: boolean;
  sectionClassName?: string;
  children?: ReactNode;
};

const buttonClassName =
  "inline-flex items-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5";

const communityActionStyles = [
  {
    color: "bg-[color-mix(in_srgb,var(--complement-700)_34%,white)]",
    border: "border-[color-mix(in_srgb,var(--complement-800)_42%,white)]",
    shape: "rounded-[44%_56%_48%_52%/58%_42%_58%_42%]",
    innerShape: "rounded-[58%_42%_52%_48%/45%_55%_44%_56%]",
    innerInset: "inset-[0.32rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_14%,white)]",
    border: "border-[color-mix(in_srgb,var(--orange-500)_30%,white)]",
    shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
    innerShape: "rounded-[46%_54%_45%_55%/58%_42%_56%_44%]",
    innerInset: "inset-[0.36rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_20%,white)]",
    border: "border-[color-mix(in_srgb,var(--brand-700)_24%,white)]",
    shape: "rounded-[52%_48%_43%_57%/47%_55%_45%_53%]",
    innerShape: "rounded-[61%_39%_54%_46%/48%_58%_42%_52%]",
    innerInset: "inset-[0.34rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_58%,white)]",
    border: "border-[color-mix(in_srgb,var(--orange-500)_70%,white)]",
    shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
    innerShape: "rounded-[48%_52%_39%_61%/42%_58%_53%_47%]",
    innerInset: "inset-[0.3rem]",
  },
];

const workshopChipColors = [
  "border-[color-mix(in_srgb,var(--complement-800)_30%,white)] bg-[color-mix(in_srgb,var(--complement-700)_22%,white)]",
  "border-[color-mix(in_srgb,var(--orange-500)_32%,white)] bg-[color-mix(in_srgb,var(--orange-500)_14%,white)]",
  "border-[color-mix(in_srgb,var(--brand-700)_24%,white)] bg-[color-mix(in_srgb,var(--orange-500)_20%,white)]",
  "border-[color-mix(in_srgb,var(--orange-500)_50%,white)] bg-[color-mix(in_srgb,var(--orange-500)_30%,white)]",
];

function workshopChipClassName(index: number) {
  return `inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium leading-tight text-[var(--complement-900)] ${workshopChipColors[index % workshopChipColors.length]}`;
}

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
  const hasImage = Boolean(imageSrc);

  return (
    <section id={id} className={`${sectionClassName} scroll-mt-36`}>
      <div
        className={`mx-auto grid w-full max-w-7xl items-center gap-8 px-6 py-10 md:px-10 md:py-12 lg:gap-10 lg:px-14 lg:py-14 ${
          hasImage
            ? reverse
              ? "lg:grid-cols-[0.95fr_1.05fr]"
              : "lg:grid-cols-[1.05fr_0.95fr]"
            : "lg:grid-cols-1"
        }`}
      >
        <div className={hasImage && reverse ? "lg:order-2" : ""}>
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

        {imageSrc ? (
          <div
            className={`relative mx-auto w-full max-w-[22rem] ${reverse ? "lg:order-1" : ""}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <Image
                src={imageSrc}
                alt={imageAlt ?? ""}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CommunityActionRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1 lg:flex-nowrap">
      {items.map((item, index) => {
        const style =
          communityActionStyles[index % communityActionStyles.length];

        return (
          <div
            key={item}
            className={`relative flex min-h-[4.6rem] min-w-[8.75rem] items-center justify-center overflow-hidden border px-5 py-3 text-center text-sm font-medium leading-tight text-[var(--complement-900)] shadow-sm ${style.color} ${style.border} ${style.shape}`}
          >
            <span
              className={`pointer-events-none absolute z-0 border border-white/70 ${style.innerInset} ${style.innerShape}`}
              aria-hidden="true"
            />
            <span className="relative z-10">{item}</span>
          </div>
        );
      })}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 pl-5 text-base leading-relaxed text-black/75 md:text-lg">
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
    <main
      className="bg-white pb-16"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <section
        id="nuestra-comunidad"
        className="mx-auto grid w-full max-w-7xl items-start gap-8 px-6 pt-10 md:px-10 md:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-14 lg:pt-14"
      >
        <div className="space-y-5">
          <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">
            COMUNIDAD
          </p>

          <h1 className="space-y-1 text-4xl leading-[0.95] tracking-tight text-black md:text-5xl lg:text-6xl">
            <span
              className="block font-light"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              Creemos que la educación
            </span>
            <span
              className="block italic"
              style={{ fontFamily: "var(--font-indie-flower)" }}
            >
              es un proceso compartido
            </span>
          </h1>

          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
            <p>
              Niñas, niños, familias y colaboradores formamos un mismo
              organismo, donde cada parte influye en el desarrollo individual y
              colectivo.
            </p>
            <p>
              Por eso, el acompañamiento no ocurre sólo dentro del espacio
              educativo, sino también en casa y en la relación cotidiana.
            </p>
            <p>
              Ser parte de este espacio implica formar parte de una comunidad
              que aprende, se cuestiona y evoluciona.
            </p>
          </div>
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
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <p
            className="mx-auto max-w-5xl text-center text-2xl leading-[1.25] text-black md:text-3xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            No buscamos familias perfectas, sino disponibles a:
          </p>
          <CommunityActionRow
            items={[
              "Cuestionar",
              "Aprender",
              "Construir en conjunto",
              "Participar",
            ]}
          />
        </div>
      </section>

      <TextImageSection
        id="escuela-para-familias"
        title="Escuela para familias"
        subtitle="Las familias no observan el proceso desde fuera; forman parte de él."
        imageSrc="/assets/images/comu1.png"
        imageAlt="Encuentros de formación para familias"
        reverse
        sectionClassName="bg-white"
        paragraphs={[
          "Contamos con un espacio de formación y acompañamiento para madres y padres, con el propósito de construir una visión compartida sobre cómo acompañar el desarrollo de las niñas y niños.",
          "Talleres introductorios obligatorios:",
        ]}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {[
              "Comunicación No Violenta",
              "Etapas evolutivas desde la antroposofía",
            ].map((workshop, index) => (
              <div key={workshop} className="flex items-center gap-2">
                <span className={workshopChipClassName(index)}>{workshop}</span>
                <Link
                  href="/blog"
                  className="text-sm font-medium text-[var(--complement-800)] underline underline-offset-4 transition hover:text-[var(--complement-900)]"
                >
                  Conoce más
                </Link>
              </div>
            ))}
          </div>
          <div>Ambos incluídos en su cuota de inscripción.</div>
        </div>
      </TextImageSection>

      <TextImageSection
        id="talleres-y-charlas"
        title="Talleres y charlas"
        sectionClassName="bg-white"
        paragraphs={[
          "Se realizan encuentros dos veces al mes donde abordamos temas como:",
        ]}
      >
        <div className="space-y-4">
          <div className="flex max-w-4xl flex-wrap gap-3">
            {[
              "Gestión emocional",
              "Retos cotidianos en la crianza",
              "Construcción de acuerdos",
              "Educación sexual",
              "Retos de cada etapa",
              "Pantallas",
              "Límites",
              "Otros",
            ].map((topic, index) => (
              <span key={topic} className={workshopChipClassName(index)}>
                {topic}
              </span>
            ))}
          </div>
          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
            <p>Estos talleres pueden tener un costo extra.</p>
            <p>
              Además de contenido, estos espacios permiten compartir
              experiencias, reflexionar y generar herramientas prácticas para la
              vida diaria.
            </p>
          </div>
        </div>
      </TextImageSection>

      <TextImageSection
        id="acompanamiento-conjunto"
        title="Acompañamiento conjunto"
        imageSrc="/assets/images/comu5.png"
        imageAlt="Acompañamiento entre familia y comunidad educativa"
        sectionClassName="bg-[#f7f6f1]"
        reverse
        paragraphs={[
          "Nuestra comunidad se sostiene a partir de acuerdos que nos permiten convivir, acompañar y crecer de manera coherente.",
          "Estos acuerdos no son reglas impuestas, sino compromisos compartidos que hacen posible el bienestar individual y colectivo.",
        ]}
      >
        <Link
          href="/comunidad/acuerdos"
          className="text-base font-medium text-[var(--complement-800)] underline underline-offset-4 transition hover:text-[var(--complement-900)]"
        >
          Conoce los acuerdos que mantenemos como comunidad
        </Link>
      </TextImageSection>

      <section
        id="protocolos-y-cuidado"
        className="scroll-mt-36 bg-[#f7f0e5]"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10 lg:px-14 lg:py-24">
          <div className="space-y-6 lg:pt-2">
            <div className="max-w-3xl space-y-5">
              <h2
                className="text-3xl leading-[1] tracking-tight text-black md:text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                Protocolos y cuidado
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
                <p>
                  Para sostener un entorno seguro y coherente, contamos con
                  protocolos claros que forman parte del funcionamiento de la
                  comunidad.
                </p>
                <p>
                  Estos lineamientos permiten cuidar el bienestar individual y
                  colectivo, generando claridad y confianza para todas las
                  familias.
                </p>
              </div>
            </div>

            <ProtocolBlobList protocols={protocols} />
          </div>

          <div className="relative mx-auto w-full max-w-[22rem] lg:mx-0 lg:justify-self-end">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <Image
                src="/assets/images/comu2.png"
                alt="Cuidado y seguridad en la comunidad"
                fill
                className="object-cover"
              />
            </div>
          </div>
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
              {
                label: "Ritmo en Esporas",
                href: "/como-acompanamos#grupo-esporas",
              },
              {
                label: "Ritmo en Grupo Koru",
                href: "/como-acompanamos#grupo-koru",
              },
              {
                label: "Ritmo en Helechos 1",
                href: "/como-acompanamos#grupo-helechos-1",
              },
              {
                label: "Ritmo en Helechos 2",
                href: "/como-acompanamos#grupo-helechos-2",
              },
            ]}
          />
          <div>
            <p className="mb-3 text-sm font-semibold tracking-[0.16em] text-black/55">
              NUESTRAS CELEBRACIONES COMUNITARIAS
            </p>
            <BulletList
              items={[
                "Celebración del Maíz",
                "Celebración día de muertos",
                "Bazar navideño",
                "Kermés de primavera",
              ]}
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
