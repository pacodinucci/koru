"use client";

import Link from "next/link";

import { TeamApplicationForm } from "@/app/(pages)/comunidad/team-application-form";
import { CmsPageEditableCopy } from "@/modules/cms/components/cms-page-editable-copy";
import { CmsPageEditableImage } from "@/modules/cms/components/cms-page-editable-image";
import type { CmsContentPageKey } from "@/modules/cms/content-page-config";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import type {
  AccompanimentGroup,
  Methodology,
} from "@/modules/como-acompanamos/content-slots";
import type {
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";

type ChildViewProps = {
  pageKey: CmsContentPageKey;
  textMap: LandingTextMap;
  imageMap?: CmsImageMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>;

function useEditable(props: ChildViewProps) {
  return {
    page: props.pageKey,
    textMap: props.textMap,
    previewMode: props.previewMode,
    selectedContentSlotId: props.selectedContentSlotId,
    onSelectContentSlot: props.onSelectContentSlot,
  };
}

export function CommunityAgreementsView(props: ChildViewProps) {
  const editable = useEditable(props);
  return (
    <main className="bg-white pb-16" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 md:py-16 lg:px-14">
        <CmsPageEditableCopy {...editable} as="p" slotId="community.agreements.eyebrow" className="mb-4 text-sm font-medium tracking-[0.18em] text-[#6d7e96]" />
        <CmsPageEditableCopy {...editable} as="h1" slotId="community.agreements.title" className="max-w-4xl text-4xl leading-[1] tracking-tight text-black md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-roboto-condensed)" }} />
        <CmsPageEditableCopy {...editable} as="p" slotId="community.agreements.intro" className="mt-5 max-w-4xl text-base leading-relaxed text-black/75 md:text-lg" />
      </section>
      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-6 pb-12 md:grid-cols-2 md:px-10 md:pb-16 lg:grid-cols-3 lg:px-14">
          {Array.from({ length: 7 }, (_, index) => (
            <article key={index} className="rounded-2xl border border-black/10 bg-[#f7f6f1] p-5">
              <CmsPageEditableCopy {...editable} as="h2" slotId={`community.agreements.item.${index}.title`} className="text-2xl leading-tight text-black" style={{ fontFamily: "var(--font-roboto-condensed)" }} />
              <CmsPageEditableCopy {...editable} as="p" slotId={`community.agreements.item.${index}.text`} className="mt-3 text-sm leading-relaxed text-black/75 md:text-base" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function TeamApplicationView(props: ChildViewProps) {
  const editable = useEditable(props);
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 lg:px-14" style={{ fontFamily: "var(--font-montserrat)" }}>
      <div className="mx-auto max-w-3xl space-y-8">
        <Link href="/contacto" className="inline-flex text-sm font-semibold uppercase tracking-[0.18em] text-[var(--complement-800)] transition hover:text-[var(--complement-900)]">
          <CmsPageEditableCopy {...editable} as="span" slotId="team.back" />
        </Link>
        <div className="space-y-3">
          <CmsPageEditableCopy {...editable} as="h1" slotId="team.title" className="text-4xl tracking-tight md:text-5xl" />
          <CmsPageEditableCopy {...editable} as="p" slotId="team.intro" className="text-base leading-relaxed text-black/75 md:text-lg" />
        </div>
        <TeamApplicationForm />
      </div>
    </main>
  );
}

export function GroupDetailView({
  group,
  ...props
}: ChildViewProps & { group: AccompanimentGroup }) {
  const editable = useEditable(props);
  return (
    <main className="bg-[#f7f6f1]" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:px-14 lg:py-20">
        <div className="space-y-7">
          <Link href="/como-acompanamos#grupos-de-acompanamiento" className="inline-flex text-sm font-semibold uppercase tracking-[0.18em] text-[var(--complement-800)]">
            <CmsPageEditableCopy {...editable} as="span" slotId="group.back" />
          </Link>
          <header className="space-y-3">
            <CmsPageEditableCopy {...editable} as="h1" slotId="group.title" className="text-[clamp(3rem,9vw,6rem)] leading-[0.9] tracking-tight text-black" style={{ fontFamily: "var(--font-roboto-condensed)" }} />
            <CmsPageEditableCopy {...editable} as="p" slotId="group.ageRange" className="text-[clamp(1.8rem,5vw,2.6rem)] leading-none text-black/75" style={{ fontFamily: "var(--font-indie-flower)" }} />
          </header>
          <div className="space-y-4 text-lg leading-relaxed text-black/80 md:text-xl">
            {group.paragraphs.map((_, index) => (
              <CmsPageEditableCopy key={index} {...editable} as="p" slotId={`group.paragraph.${index}`} />
            ))}
          </div>
        </div>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[24rem] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
          <CmsPageEditableImage slotId="group.image.hero" defaultSrc={group.imageSrc} alt={group.imageAlt} imageMap={props.imageMap} previewMode={props.previewMode} selectedContentSlotId={props.selectedContentSlotId} onSelectContentSlot={props.onSelectContentSlot} fill className="object-cover" priority />
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 md:py-20 lg:px-14">
          <div className="mx-auto max-w-5xl pb-[45svh]">
            {group.experienceCards.map((card, index) => (
              <article key={index} className="sticky top-48 mb-[35svh] grid min-h-[34rem] overflow-hidden rounded-[2rem] border border-black/10 bg-[#f7f6f1] shadow-[0_22px_70px_rgba(0,0,0,0.16)] md:grid-cols-2 lg:min-h-[38rem]" style={{ zIndex: index + 1 }}>
                <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
                  <CmsPageEditableCopy {...editable} as="h2" slotId={`group.card.${index}.title`} className="mb-5 text-4xl leading-none text-black md:text-5xl" style={{ fontFamily: "var(--font-roboto-condensed)" }} />
                  <CmsPageEditableCopy {...editable} as="p" slotId={`group.card.${index}.description`} className="text-lg leading-relaxed text-black/80 md:text-xl" />
                </div>
                <div className="relative min-h-[18rem] md:min-h-full">
                  <CmsPageEditableImage slotId={`group.image.card.${index}`} defaultSrc={card.imageSrc} alt={card.imageAlt} imageMap={props.imageMap} previewMode={props.previewMode} selectedContentSlotId={props.selectedContentSlotId} onSelectContentSlot={props.onSelectContentSlot} fill className="object-cover" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function MethodologyDetailView({
  methodology,
  ...props
}: ChildViewProps & { methodology: Methodology }) {
  const editable = useEditable(props);
  const paragraphs = methodology.detailParagraphs ?? methodology.paragraphs ?? [];
  return (
    <main className="min-h-screen bg-[#f7f6f1]" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto w-full max-w-5xl px-6 py-12 md:px-10 md:py-16 lg:px-14 lg:py-20">
        <Link href="/como-acompanamos#metodologias-y-experiencias" className="inline-flex text-sm font-semibold uppercase tracking-[0.18em] text-[var(--complement-800)]">
          <CmsPageEditableCopy {...editable} as="span" slotId="methodology.back" />
        </Link>
        <header className="mt-8 max-w-4xl">
          <CmsPageEditableCopy {...editable} as="h1" slotId="methodology.title" className="text-[clamp(3rem,9vw,6rem)] leading-[0.9] tracking-tight text-black" style={{ fontFamily: "var(--font-roboto-condensed)" }} />
        </header>
        <div className="mt-12 max-w-4xl space-y-6 text-lg leading-relaxed text-black/80 md:text-xl">
          {paragraphs.map((_, index) => (
            <CmsPageEditableCopy key={index} {...editable} as="p" slotId={`methodology.paragraph.${index}`} />
          ))}
        </div>
      </section>
    </main>
  );
}
