"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { CmsPageEditableImage } from "@/modules/cms/components/cms-page-editable-image";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import { AccompanimentGroupsTabs } from "@/app/(pages)/como-acompanamos/accompaniment-groups-tabs";
import { AccompanyPrinciplesWheel } from "@/modules/como-acompanamos/views/accompany-principles-wheel";
import { IntegralDevelopmentMap } from "@/modules/como-acompanamos/views/integral-development-map";
import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";
import type {
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
import {
  comoAcompanamosContentSlotIds,
  getComoAcompanamosContentSlots,
  methodologySlotId,
  resolveLearningPrinciples,
  resolveAccompanimentGroups,
  resolveMethodologies,
  type Methodology,
} from "@/modules/como-acompanamos/content-slots";

type ComoAcompanamosViewProps = {
  textMap?: LandingTextMap;
  imageMap?: CmsImageMap;
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
  block: Methodology;
  index: number;
  className?: string;
  textMap: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>) {
  return (
    <article
      className={`flex h-full w-full min-w-0 flex-col rounded-[2.5rem] p-8 md:p-12 lg:p-14 ${className}`}
      style={{
        backgroundColor:
          methodologySnapBackgrounds[index % methodologySnapBackgrounds.length],
      }}
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
      {block.cardHighlight ? (
        <p
          className="mb-5 max-w-3xl text-[clamp(1.6rem,3vw,2.35rem)] leading-[1.05] text-black/75"
          style={{ fontFamily: "var(--font-indie-flower)" }}
        >
          {block.cardHighlight}
        </p>
      ) : null}
      <div className="min-w-0 flex-1 space-y-5 overflow-y-auto pr-2 text-lg leading-relaxed text-black/85 [scrollbar-color:var(--complement-900)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--complement-700)] md:text-xl md:leading-9">
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
      <Link
        href={`/como-acompanamos/metodologias/${block.slug}`}
        className="mt-8 inline-flex w-fit self-end items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--complement-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        {block.ctaLabel ?? "Conoce el cómo"}
      </Link>
    </article>
  );
}

function MethodologiesCarousel({
  methodologies,
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: {
  methodologies: Methodology[];
  textMap: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncActiveCard = () => {
    const scroller = scrollerRef.current;

    if (!scroller) return;

    const nextIndex = Array.from(scroller.children).reduce(
      (closestIndex, card, index) => {
        const closestCard = scroller.children[closestIndex] as HTMLElement;
        const currentCard = card as HTMLElement;

        return Math.abs(currentCard.offsetLeft - scroller.scrollLeft) <
          Math.abs(closestCard.offsetLeft - scroller.scrollLeft)
          ? index
          : closestIndex;
      },
      0,
    );

    setActiveIndex(nextIndex);
  };

  const move = (direction: "previous" | "next") => {
    const scroller = scrollerRef.current;

    if (!scroller) return;

    const nextIndex =
      direction === "next"
        ? Math.min(activeIndex + 1, methodologies.length - 1)
        : Math.max(activeIndex - 1, 0);
    const nextCard = scroller.children[nextIndex] as HTMLElement | undefined;

    if (!nextCard) return;

    scroller.scrollTo({ left: nextCard.offsetLeft, behavior: "smooth" });
  };

  return (
    <div className="relative mt-12">
      <div
        ref={scrollerRef}
        onScroll={syncActiveCard}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Carrusel de metodologias y experiencias"
      >
        {methodologies.map((methodology, index) => {
          const isActive = activeIndex === index;

          return (
            <div
              key={methodology.title}
              className="w-full shrink-0 snap-center"
              aria-current={isActive ? "true" : undefined}
            >
              <ContentCard
                block={methodology}
                index={index}
                className={`h-[32rem] shadow-md transition duration-300 md:h-[35rem] ${
                  isActive ? "blur-0" : "blur-sm"
                }`}
                textMap={textMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
              />
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-5 flex w-full justify-center gap-5 md:justify-end">
        <button
          type="button"
          onClick={() => move("previous")}
          disabled={activeIndex === 0}
          className="text-3xl font-bold leading-none text-black transition hover:text-[var(--orange-500)] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          aria-label="Ver metodologia anterior"
        >
          &larr;
        </button>
        <button
          type="button"
          onClick={() => move("next")}
          disabled={activeIndex === methodologies.length - 1}
          className="text-3xl font-bold leading-none text-black transition hover:text-[var(--orange-500)] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          aria-label="Ver siguiente metodologia"
        >
          &rarr;
        </button>
      </div>
    </div>
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
  const { imageMap, previewMode, selectedContentSlotId, onSelectContentSlot } = props;
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
                <CmsPageEditableImage
                  slotId="accompaniment.image.hero"
                  defaultSrc="/assets/images/DSC01280.png"
                  alt="Acompañantes y niñez compartiendo un espacio de aprendizaje"
                  imageMap={imageMap}
                  previewMode={previewMode}
                  selectedContentSlotId={selectedContentSlotId}
                  onSelectContentSlot={onSelectContentSlot}
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
                  slotId={
                    comoAcompanamosContentSlotIds.integralDevelopmentTitle
                  }
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
            title={
              <EditableCopy
                slotId={comoAcompanamosContentSlotIds.groupsTitle}
                style={{ fontSize: "inherit", lineHeight: "inherit" }}
                stylePriority="override"
                {...slotBindingProps}
              />
            }
          >
            <EditableCopy
              as="p"
              slotId={comoAcompanamosContentSlotIds.groupsIntro}
              {...slotBindingProps}
            />
          </SectionHeading>
          <AccompanimentGroupsTabs
            groups={resolvedAccompanimentGroups}
            {...slotBindingProps}
          />
        </div>
      </section>

      <section
        id="metodologias-y-experiencias"
        className="scroll-mt-28 bg-white"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <SectionHeading
            title={
              <EditableCopy
                slotId={comoAcompanamosContentSlotIds.methodologiesTitle}
                style={{ fontSize: "inherit", lineHeight: "inherit" }}
                stylePriority="override"
                {...slotBindingProps}
              />
            }
          >
            <div className="py-4">
              <EditableCopy
                as="p"
                slotId={comoAcompanamosContentSlotIds.methodologiesLead}
                className="max-w-3xl text-[clamp(1.55rem,3vw,2.1rem)] leading-[1.08]"
                style={{ fontFamily: "var(--font-indie-flower)" }}
                stylePriority="override"
                {...slotBindingProps}
              />
            </div>
            <EditableCopy
              as="p"
              slotId={comoAcompanamosContentSlotIds.methodologiesIntro}
              {...slotBindingProps}
            />
          </SectionHeading>

          <MethodologiesCarousel
            methodologies={resolvedMethodologies}
            {...slotBindingProps}
          />
        </div>
      </section>

      <section id="evaluacion" className="scroll-mt-28 bg-[#f7f6f1]">
        <div className="mx-auto grid w-full max-w-7xl min-w-0 items-start gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:px-14 lg:py-14">
          <div>
            <SectionHeading
              title={
                <EditableCopy
                  slotId={comoAcompanamosContentSlotIds.evaluationTitle}
                  style={{ fontSize: "inherit", lineHeight: "inherit" }}
                  stylePriority="override"
                  {...slotBindingProps}
                />
              }
            >
              <p className="max-w-full break-words text-2xl font-semibold text-black [overflow-wrap:anywhere]">
                <EditableCopy
                  slotId={comoAcompanamosContentSlotIds.evaluationLead}
                  {...slotBindingProps}
                />
              </p>
              <EditableCopy
                as="p"
                slotId={comoAcompanamosContentSlotIds.evaluationParagraphOne}
                {...slotBindingProps}
              />
              <EditableCopy
                as="p"
                slotId={comoAcompanamosContentSlotIds.evaluationParagraphTwo}
                {...slotBindingProps}
              />
              <EditableCopy
                as="p"
                slotId={comoAcompanamosContentSlotIds.evaluationParagraphThree}
                {...slotBindingProps}
              />
              <a
                href="/evaluaciones"
                className="inline-flex rounded-full border border-complement-700 px-4 py-2 text-sm font-semibold text-[var(--complement-800)] transition hover:bg-[var(--complement-100)]"
              >
                <EditableCopy
                  slotId={comoAcompanamosContentSlotIds.evaluationCta}
                  {...slotBindingProps}
                />
              </a>
            </SectionHeading>
          </div>
          <div className="relative mx-auto w-full max-w-[22rem]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <CmsPageEditableImage
                slotId="accompaniment.image.evaluation"
                defaultSrc="/assets/images/DSC01386.png"
                alt="Acompañante registrando procesos de aprendizaje en comunidad"
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
    </main>
  );
}
