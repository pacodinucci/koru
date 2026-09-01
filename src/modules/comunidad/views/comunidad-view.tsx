
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProtocolBlobList } from "@/app/(pages)/comunidad/protocol-blob-list";
import { CmsPageEditableCopy } from "@/modules/cms/components/cms-page-editable-copy";
import { CmsPageEditableImage } from "@/modules/cms/components/cms-page-editable-image";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";

type TextImageSectionProps = {
  id?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  paragraphs: ReactNode[];
  imageSrc?: string;
  imageAlt?: string;
  imageSlotId?: string;
  imageMap?: CmsImageMap;
  previewMode?: boolean;
  selectedContentSlotId?: string | null;
  onSelectContentSlot?: (slotId: string) => void;
  reverse?: boolean;
  sectionClassName?: string;
  children?: ReactNode;
};

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
  imageSlotId,
  imageMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
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
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {children ? <div className="mt-5">{children}</div> : null}
        </div>

        {imageSrc ? (
          <div
            className={`relative mx-auto w-full max-w-[22rem] ${reverse ? "lg:order-1" : ""}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <CmsPageEditableImage
                slotId={imageSlotId ?? ""}
                defaultSrc={imageSrc}
                alt={imageAlt ?? ""}
                imageMap={imageMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
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

function CommunityActionRow({ items }: { items: ReactNode[] }) {
  return (
    <div className="grid w-full max-w-[18.5rem] grid-cols-2 items-center gap-3 pt-1 sm:max-w-none sm:flex sm:flex-wrap sm:justify-center lg:flex-nowrap">
      {items.map((item, index) => {
        const style =
          communityActionStyles[index % communityActionStyles.length];

        return (
          <div
            key={index}
            className={`relative flex min-h-[3.75rem] w-full min-w-0 items-center justify-center overflow-hidden border px-3 py-2 text-center text-xs font-medium leading-tight text-[var(--complement-900)] shadow-sm sm:min-h-[4.6rem] sm:w-auto sm:min-w-[8.75rem] sm:px-5 sm:py-3 sm:text-sm ${style.color} ${style.border} ${style.shape}`}
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

const protocolDefinitions = [
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

const dailyRhythms = [
  {
    label: "Esporas",
    href: "/como-acompanamos/grupo-esporas#ritmo-y-experiencias",
  },
  {
    label: "Grupo Koru",
    href: "/como-acompanamos/grupo-koru#ritmo-y-experiencias",
  },
  {
    label: "Helechos 1",
    href: "/como-acompanamos/grupo-helechos-1#ritmo-y-experiencias",
  },
  {
    label: "Helechos 2",
    href: "/como-acompanamos/grupo-helechos-2#ritmo-y-experiencias",
  },
  { label: "Ritmo anual", href: "#celebraciones-comunitarias" },
];

const communityCelebrations = [
  {
    title: "Celebración del Maíz",
    imageSrc: "/assets/images/DSC01273.png",
    imageSlotId: "community.image.celebration.0",
    imageAlt: "Celebración del Maíz",
  },
  {
    title: "Celebración día de muertos",
    imageSrc: "/assets/images/DSC01338.png",
    imageSlotId: "community.image.celebration.1",
    imageAlt: "Celebración día de muertos",
  },
  {
    title: "Bazar navideño",
    imageSrc: "/assets/images/DSC01638.png",
    imageSlotId: "community.image.celebration.2",
    imageAlt: "Bazar navideño",
  },
  {
    title: "Kermés de primavera",
    imageSrc: "/assets/images/DSC02336.png",
    imageSlotId: "community.image.celebration.3",
    imageAlt: "Kermés de primavera",
  },
];

type ComunidadViewProps = {
  textMap: LandingTextMap;
  imageMap?: CmsImageMap;
} & Pick<LandingPreviewBindings, "previewMode" | "selectedContentSlotId" | "onSelectContentSlot">;

export function ComunidadView({ textMap, imageMap = {}, previewMode, selectedContentSlotId, onSelectContentSlot }: ComunidadViewProps) {
  const editable = { page: "comunidad" as const, textMap, previewMode, selectedContentSlotId, onSelectContentSlot };
  const copy = (slotId: string) => <CmsPageEditableCopy as="span" slotId={slotId} {...editable} />;
  const protocols = protocolDefinitions.map((protocol, index) => ({
    ...protocol,
    title: copy(`community.protocols.item.${index}.title`),
    text: copy(`community.protocols.item.${index}.description`),
  }));
  return (
    <main
      className="bg-white"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <section
        id="nuestra-comunidad"
        className="mx-auto grid w-full max-w-7xl items-start gap-8 px-6 pt-10 md:px-10 md:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-14 lg:pt-14"
      >
        <div className="space-y-5">
          <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">
            <CmsPageEditableCopy as="span" slotId="community.eyebrow" {...editable} />
          </p>

          <h1 className="space-y-1 text-4xl leading-[0.95] tracking-tight text-black md:text-5xl lg:text-6xl">
            <span
              className="block font-light"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              <CmsPageEditableCopy as="span" slotId="community.hero.first" {...editable} />
            </span>
            <span
              className="block italic"
              style={{ fontFamily: "var(--font-indie-flower)" }}
            >
              <CmsPageEditableCopy as="span" slotId="community.hero.second" {...editable} />
            </span>
          </h1>

          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
            <p>
              <CmsPageEditableCopy as="span" slotId="community.intro.one" {...editable} />
            </p>
            <p>
              <CmsPageEditableCopy as="span" slotId="community.intro.two" {...editable} />
            </p>
            <p>
              <CmsPageEditableCopy as="span" slotId="community.intro.three" {...editable} />
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[22rem] lg:mx-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <CmsPageEditableImage
              slotId="community.image.hero"
              defaultSrc="/assets/images/comu3.png"
              alt="Comunidad Koru compartiendo actividades"
              imageMap={imageMap}
              previewMode={previewMode}
              selectedContentSlotId={selectedContentSlotId}
              onSelectContentSlot={onSelectContentSlot}
              fill
              className="object-cover"
              priority
            />
          </div>
          <p className="mt-4 text-center text-base leading-relaxed text-black/85 md:text-lg">
            <CmsPageEditableCopy as="span" slotId="community.caption" {...editable} />
          </p>
        </div>
      </section>

      <section className="mt-8 bg-[#f3f2ef] md:mt-10 lg:mt-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-5 py-8 sm:px-6 md:gap-6 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <p
            className="mx-auto max-w-[19rem] text-center text-2xl leading-[1.15] text-black sm:max-w-3xl md:text-3xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            {copy("community.actions.title")}
          </p>
          <CommunityActionRow
            items={[
              copy("community.actions.item.0"),
              copy("community.actions.item.1"),
              copy("community.actions.item.2"),
              copy("community.actions.item.3"),
            ]}
          />
        </div>
      </section>

      <TextImageSection
        id="escuela-para-familias"
        title={copy("community.school.title")}
        subtitle={copy("community.school.subtitle")}
        imageSrc="/assets/images/comu1.png"
        imageAlt="Encuentros de formación para familias"
        imageSlotId="community.image.school"
        imageMap={imageMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
        reverse
        sectionClassName="bg-white"
        paragraphs={[
          copy("community.school.description"),
          copy("community.school.workshopsLabel"),
        ]}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {[
              "community.school.workshop.0",
              "community.school.workshop.1",
            ].map((workshop, index) => (
              <div key={workshop} className="flex items-center gap-2">
                <span className={workshopChipClassName(index)}>{copy(workshop)}</span>
                <Link
                  href="/blog"
                  className="text-sm font-medium text-[var(--complement-800)] underline underline-offset-4 transition hover:text-[var(--complement-900)]"
                >
                  {copy(`community.school.workshopCta.${index}`)}
                </Link>
              </div>
            ))}
          </div>
          <div>{copy("community.school.note")}</div>
        </div>
      </TextImageSection>

      <TextImageSection
        id="talleres-y-charlas"
        title={copy("community.talks.title")}
        sectionClassName="bg-white"
        paragraphs={[
          copy("community.talks.description"),
        ]}
      >
        <div className="space-y-4">
          <div className="flex max-w-4xl flex-wrap gap-3">
            {[
              "community.talks.topic.0",
              "community.talks.topic.1",
              "community.talks.topic.2",
              "community.talks.topic.3",
              "community.talks.topic.4",
              "community.talks.topic.5",
              "community.talks.topic.6",
              "community.talks.topic.7",
            ].map((topic, index) => (
              <span key={topic} className={workshopChipClassName(index)}>
                {copy(topic)}
              </span>
            ))}
          </div>
          <div className="max-w-3xl space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
            <p>{copy("community.talks.note")}</p>
            <p>
              {copy("community.talks.closing")}
            </p>
          </div>
        </div>
      </TextImageSection>

      <TextImageSection
        id="acompanamiento-conjunto"
        title={copy("community.support.title")}
        imageSrc="/assets/images/comu5.png"
        imageAlt="Acompañamiento entre familia y comunidad educativa"
        imageSlotId="community.image.support"
        imageMap={imageMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
        sectionClassName="bg-[#f7f6f1]"
        reverse
        paragraphs={[
          copy("community.support.description.0"),
          copy("community.support.description.1"),
        ]}
      >
        <Link
          href="/comunidad/acuerdos"
          className="text-base font-medium text-[var(--complement-800)] underline underline-offset-4 transition hover:text-[var(--complement-900)]"
        >
          {copy("community.support.cta")}
        </Link>
      </TextImageSection>

      <section id="protocolos-y-cuidado" className="scroll-mt-36 bg-[#f7f0e5]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10 lg:px-14 lg:py-24">
          <div className="space-y-6 lg:pt-2">
            <div className="max-w-3xl space-y-5">
              <h2
                className="text-3xl leading-[1] tracking-tight text-black md:text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                {copy("community.protocols.title")}
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
                <p>
                  {copy("community.protocols.description.0")}
                </p>
                <p>
                  {copy("community.protocols.description.1")}
                </p>
              </div>
            </div>

            <ProtocolBlobList protocols={protocols} />
          </div>

          <div className="relative mx-auto w-full max-w-[22rem] lg:mx-0 lg:justify-self-end">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <CmsPageEditableImage
                slotId="community.image.protocols"
                defaultSrc="/assets/images/comu2.png"
                alt="Cuidado y seguridad en la comunidad"
                imageMap={imageMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="dia-a-dia-en-koru" className="scroll-mt-36 bg-white">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-14 lg:py-24">
          <div className="space-y-6">
            <div className="max-w-3xl space-y-5">
              <h2
                className="text-3xl leading-[1] tracking-tight text-black md:text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                {copy("community.daily.title")}
              </h2>
              <p
                className="text-lg leading-relaxed text-black/85 md:text-2xl"
                style={{ fontFamily: "var(--font-indie-flower)" }}
              >
                {copy("community.daily.subtitle")}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-[0.16em] text-black/55">
                {copy("community.daily.eyebrow")}
              </p>
              <div className="flex max-w-4xl flex-wrap gap-3">
                {dailyRhythms.map((rhythm, index) => (
                  <Link
                    key={rhythm.label}
                    href={rhythm.href}
                    className={workshopChipClassName(index)}
                  >
                    {copy(`community.daily.rhythm.${index}`)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[22rem] lg:mx-0 lg:justify-self-end">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <CmsPageEditableImage
                slotId="community.image.daily"
                defaultSrc="/assets/images/comu6.png"
                alt="Vida cotidiana en la comunidad Koru"
                imageMap={imageMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="celebraciones-comunitarias"
        className="scroll-mt-36 bg-[#f7f6f1]"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 md:py-20 lg:px-14 lg:py-24">
          <div className="mb-8 max-w-4xl space-y-4">
            <h2
              className="text-3xl leading-[1] tracking-tight text-black md:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              {copy("community.celebrations.title")}
            </h2>
            <p className="text-base leading-relaxed text-black/75 md:text-lg">
              {copy("community.celebrations.description")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {communityCelebrations.map((celebration, index) => (
              <article
                key={celebration.title}
                className="group overflow-hidden rounded-[1.75rem] border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <CmsPageEditableImage
                    slotId={celebration.imageSlotId}
                    defaultSrc={celebration.imageSrc}
                    alt={celebration.imageAlt}
                    imageMap={imageMap}
                    previewMode={previewMode}
                    selectedContentSlotId={selectedContentSlotId}
                    onSelectContentSlot={onSelectContentSlot}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <div className="p-5">
                  <h3
                    className="text-2xl leading-tight text-black"
                    style={{ fontFamily: "var(--font-roboto-condensed)" }}
                  >
                    {copy(`community.celebrations.item.${index}`)}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
