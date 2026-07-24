import Image from "next/image";

import { AccompanimentGroupsTabs } from "@/app/(pages)/como-acompanamos/accompaniment-groups-tabs";
import { ScrollFloatingFerns } from "@/app/(pages)/como-acompanamos/scroll-floating-ferns";
import { SnapScrollHandoff } from "@/app/(pages)/como-acompanamos/snap-scroll-handoff";
import { AccompanyPrinciplesWheel } from "@/modules/como-acompanamos/views/accompany-principles-wheel";
import { IntegralDevelopmentMap } from "@/modules/como-acompanamos/views/integral-development-map";
import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";
import {
  comoAcompanamosContentSlotIds,
  getComoAcompanamosContentSlots,
  methodologySlotId,
  resolveLearningPrinciples,
  resolveAccompanimentGroups,
  resolveMethodologies,
  type TextBlock,
} from "@/modules/como-acompanamos/content-slots";

type ComoAcompanamosViewProps = {
  textMap?: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>;

const contentSlotMap = new Map(
  getComoAcompanamosContentSlots().map((slot) => [slot.id, slot]),
);

const responsiveTextClass = "max-w-full break-words [overflow-wrap:anywhere]";

const methodologySnapBackgrounds = [
  "color-mix(in srgb, color-mix(in srgb, var(--complement-400) 28%, white) 78%, transparent)",
  "color-mix(in srgb, color-mix(in srgb, var(--complement-400) 40%, white) 78%, transparent)",
  "color-mix(in srgb, color-mix(in srgb, var(--complement-400) 55%, white) 78%, transparent)",
  "color-mix(in srgb, color-mix(in srgb, var(--complement-400) 72%, white) 78%, transparent)",
  "color-mix(in srgb, var(--complement-400) 78%, transparent)",
  "color-mix(in srgb, color-mix(in srgb, var(--complement-400) 88%, black) 78%, transparent)",
  "color-mix(in srgb, color-mix(in srgb, var(--complement-400) 76%, black) 78%, transparent)",
  "color-mix(in srgb, color-mix(in srgb, var(--complement-400) 62%, black) 78%, transparent)",
];

function getContentSlot(slotId: string) {
  const slot = contentSlotMap.get(slotId);

  if (!slot) {
    throw new Error(`Unknown Cómo acompañamos content slot: ${slotId}`);
  }

  return slot;
}

type EditableCopyProps = {
  slotId: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  stylePriority?: "base" | "override";
  textMap: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>;

function EditableCopy({
  slotId,
  as,
  className,
  style,
  stylePriority,
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: EditableCopyProps) {
  return (
    <EditableContentSlot
      as={as}
      slot={getContentSlot(slotId)}
      textMap={textMap}
      previewMode={previewMode}
      selected={selectedContentSlotId === slotId}
      onSelect={onSelectContentSlot}
      className={`${responsiveTextClass} ${className ?? ""}`}
      style={style}
      stylePriority={stylePriority}
    />
  );
}

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl min-w-0 space-y-5">
      {eyebrow ? (
        <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2
          className="max-w-full break-words text-[clamp(1.35rem,5.5vw,1.55rem)] leading-[1.02] tracking-tight text-black [overflow-wrap:anywhere] md:text-5xl lg:text-6xl"
          style={{ fontFamily: "var(--font-roboto-condensed)" }}
        >
          {title}
        </h2>
      ) : null}
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
  index,
  className = "",
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: {
  block: TextBlock;
  index: number;
  className?: string;
  textMap: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>) {
  return (
    <article
      className={`w-full min-w-0 rounded-[2.5rem] p-8 md:p-12 lg:p-14 ${className}`}
      style={{ backgroundColor: methodologySnapBackgrounds[index % methodologySnapBackgrounds.length] }}
    >
      <h3
        className="mb-5 max-w-full break-words text-[clamp(1.7rem,4.4vw,3.25rem)] leading-[0.95] text-black [overflow-wrap:anywhere]"
        style={{ fontFamily: "var(--font-roboto-condensed)" }}
      >
        <EditableCopy
          slotId={methodologySlotId(index, "title")}
          style={{ fontSize: "inherit", lineHeight: "inherit" }}
          stylePriority="override"
          textMap={textMap}
          previewMode={previewMode}
          selectedContentSlotId={selectedContentSlotId}
          onSelectContentSlot={onSelectContentSlot}
        />
      </h3>
      <div className="min-w-0 space-y-5 text-lg leading-relaxed text-black/85 md:text-xl md:leading-9">
        {block.paragraphs?.map((paragraph, paragraphIndex) => (
          <EditableCopy
            key={paragraphIndex}
            as="p"
            slotId={methodologySlotId(index, `paragraph.${paragraphIndex}`)}
            textMap={textMap}
            previewMode={previewMode}
            selectedContentSlotId={selectedContentSlotId}
            onSelectContentSlot={onSelectContentSlot}
          />
        ))}
        {block.bullets ? <BulletList items={block.bullets} /> : null}
      </div>
      {block.cta ? (
        <a
          href={block.cta.href}
          className="mt-8 inline-flex rounded-full border border-complement-700 px-5 py-2.5 text-sm font-semibold text-[var(--complement-800)] transition hover:bg-[var(--complement-100)]"
        >
          <EditableCopy
            slotId={methodologySlotId(index, "cta")}
            textMap={textMap}
            previewMode={previewMode}
            selectedContentSlotId={selectedContentSlotId}
            onSelectContentSlot={onSelectContentSlot}
          />
        </a>
      ) : null}
    </article>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="min-w-0 space-y-2 pl-5 text-black/80">
      {items.map((item) => (
        <li
          key={item}
          className="list-disc break-words [overflow-wrap:anywhere] marker:text-[var(--complement-800)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ComoAcompanamosView(props: ComoAcompanamosViewProps) {
  const {
    previewMode,
    selectedContentSlotId,
    onSelectContentSlot,
  } = props;
  const textMap = props.textMap ?? {};

  const slotBindingProps = {
    textMap,
    previewMode,
    selectedContentSlotId,
    onSelectContentSlot,
  };

  const resolvedLearningPrinciples = resolveLearningPrinciples(textMap);
  const resolvedAccompanimentGroups = resolveAccompanimentGroups(textMap);
  const resolvedMethodologies = resolveMethodologies(textMap);
  return (
    <main className="bg-white" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section id="como-acompanamos" className="scroll-mt-28 bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
            <SectionHeading
            eyebrow={
              <EditableCopy
                slotId={comoAcompanamosContentSlotIds.heroEyebrow}
                {...slotBindingProps}
              />
            }
          >
            <EditableCopy
              as="p"
              slotId={comoAcompanamosContentSlotIds.heroIntro}
              {...slotBindingProps}
            />
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
        </div>

        <AccompanyPrinciplesWheel
          principles={resolvedLearningPrinciples}
          {...slotBindingProps}
        />
        <section
          id="acompanamiento-conectado"
          className="bg-[#f3f2ef]"
          aria-labelledby="acompanamiento-conectado-title"
        >
          <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 lg:px-14 lg:py-20">
            <div className="max-w-4xl min-w-0">
              <h2
                id="acompanamiento-conectado-title"
                className="max-w-full break-words text-left text-[clamp(1.35rem,5.5vw,1.55rem)] leading-[1.08] text-black [overflow-wrap:anywhere] md:text-5xl"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                <EditableCopy
                  slotId={comoAcompanamosContentSlotIds.connectedLearningTitle}
                  style={{ fontSize: "inherit", lineHeight: "inherit" }}
                  stylePriority="override"
                  {...slotBindingProps}
                />
              </h2>
              <EditableCopy
                as="p"
                slotId={comoAcompanamosContentSlotIds.connectedLearningText}
                className="mt-6 max-w-4xl text-justify text-lg leading-relaxed text-black/85 md:text-xl"
                {...slotBindingProps}
              />
            </div>
          </div>
        </section>

        <section
          id="desarrollo-integral"
          className="bg-white"
          aria-labelledby="desarrollo-integral-title"
        >
          <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 lg:px-14 lg:py-20">
            <div className="max-w-4xl min-w-0">
              <h2
                id="desarrollo-integral-title"
                className="max-w-full break-words text-left text-[clamp(1.35rem,5.5vw,1.55rem)] leading-[1.08] text-black [overflow-wrap:anywhere] md:text-5xl"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                <EditableCopy
                  slotId={comoAcompanamosContentSlotIds.integralDevelopmentTitle}
                  style={{ fontSize: "inherit", lineHeight: "inherit" }}
                  stylePriority="override"
                  {...slotBindingProps}
                />
              </h2>
              <EditableCopy
                as="p"
                slotId={comoAcompanamosContentSlotIds.integralDevelopmentText}
                className="mt-6 max-w-4xl text-justify text-lg leading-relaxed text-black/85 md:text-xl"
                {...slotBindingProps}
              />
            </div>
            <IntegralDevelopmentMap />
          </div>
        </section>

        {/* <FloatingSkills skills={cultivatedSkills} /> */}
      </section>

      <section
        id="grupos-de-acompanamiento"
        className="scroll-mt-28 bg-[#f7f6f1]"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <SectionHeading
            title={<EditableCopy slotId={comoAcompanamosContentSlotIds.groupsTitle} style={{ fontSize: "inherit", lineHeight: "inherit" }} stylePriority="override" {...slotBindingProps} />}
          >
            <EditableCopy as="p" slotId={comoAcompanamosContentSlotIds.groupsIntro} {...slotBindingProps} />
          </SectionHeading>
          <AccompanimentGroupsTabs groups={resolvedAccompanimentGroups} {...slotBindingProps} />
        </div>
      </section>

      <section
        id="metodologias-y-experiencias"
        className="scroll-mt-28 bg-white"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <SectionHeading
            title={<EditableCopy slotId={comoAcompanamosContentSlotIds.methodologiesTitle} style={{ fontSize: "inherit", lineHeight: "inherit" }} stylePriority="override" {...slotBindingProps} />}
          >
            <EditableCopy as="p" slotId={comoAcompanamosContentSlotIds.methodologiesIntro} {...slotBindingProps} />
          </SectionHeading>

          <div className="relative left-1/2 mt-12 h-dvh w-screen -translate-x-1/2 overflow-hidden bg-white">
            <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
              <ScrollFloatingFerns
                sectionId="metodologias-y-experiencias"
                scrollContainerId="metodologias-snap-scroll"
                variant="sides"
                className="top-0 min-h-dvh rounded-none bg-transparent"
                canvasClassName="h-dvh min-h-dvh"
              />
            </div>
            <SnapScrollHandoff containerId="metodologias-snap-scroll" />
            <div
              id="metodologias-snap-scroll"
              className="scrollbar-none relative z-10 h-dvh w-screen snap-y snap-mandatory overflow-y-auto overscroll-auto scroll-smooth"
            >
              {resolvedMethodologies.map((methodology, index) => (
                <article
                  key={methodology.title}
                  className="flex h-dvh min-h-dvh w-screen snap-start snap-always scroll-mt-0 items-center justify-center bg-white px-6 py-20 md:px-10 lg:bg-transparent lg:px-28"
                >
                  <ContentCard
                    block={methodology}
                    index={index}
                    className="mx-auto max-w-5xl shadow-none"
                    {...slotBindingProps}
                  />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="evaluacion" className="scroll-mt-28 bg-[#f7f6f1]">
        <div className="mx-auto grid w-full max-w-7xl min-w-0 items-start gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:px-14 lg:py-14">
          <div>
            <SectionHeading title={<EditableCopy slotId={comoAcompanamosContentSlotIds.evaluationTitle} style={{ fontSize: "inherit", lineHeight: "inherit" }} stylePriority="override" {...slotBindingProps} />}>
              <p className="max-w-full break-words text-2xl font-semibold text-black [overflow-wrap:anywhere]">
                <EditableCopy slotId={comoAcompanamosContentSlotIds.evaluationLead} {...slotBindingProps} />
              </p>
              <EditableCopy as="p" slotId={comoAcompanamosContentSlotIds.evaluationParagraphOne} {...slotBindingProps} />
              <EditableCopy as="p" slotId={comoAcompanamosContentSlotIds.evaluationParagraphTwo} {...slotBindingProps} />
              <EditableCopy as="p" slotId={comoAcompanamosContentSlotIds.evaluationParagraphThree} {...slotBindingProps} />
              <a
                href="/evaluaciones"
                className="inline-flex rounded-full border border-complement-700 px-4 py-2 text-sm font-semibold text-[var(--complement-800)] transition hover:bg-[var(--complement-100)]"
              >
                <EditableCopy slotId={comoAcompanamosContentSlotIds.evaluationCta} {...slotBindingProps} />
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
        </div>
      </section>
    </main>
  );
}
