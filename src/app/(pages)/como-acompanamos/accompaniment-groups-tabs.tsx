
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CmsPageEditableImage } from "@/modules/cms/components/cms-page-editable-image";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";
import { getComoAcompanamosContentSlots, groupSlotId } from "@/modules/como-acompanamos/content-slots";

type AccompanimentGroup = {
  title: string;
  ageRange: string;
  imageSrc: string;
  imageAlt: string;
  paragraphs: string[];
  bullets?: string[];
  closing?: string;
  rhythmIntro?: string;
  rhythmBullets?: string[];
};

type AccompanimentGroupsTabsProps = {
  groups: AccompanimentGroup[];
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
const groupTabSummaries: Record<string, string[]> = {
  "grupo-esporas": [
    "En este grupo se ofrece un espacio estructurado a base de un ritmo que promueve el desarrollo integral y contribuye a una vida equilibrada a lo largo del tiempo, responde a las necesidades vitales de socialización, movimiento y juego, basado en la pedagogía Waldorf.",
  ],
  "grupo-koru": [
    "En Grupo Koru continúa la influencia/inspiración Waldorf y se integra el enfoque transdisciplinario - antroposófico, que organiza el aprendizaje en torno a grandes conceptos vivos. A través de proyectos, experiencias sensoriales, relatos, preguntas colectivas y la observación del entorno, se despierta el interés genuino por comprender el mundo.",
  ],
  "grupo-helechos-1": [
    "En Helechos 1 el enfoque transdisciplinario - antroposófico, es la metodología para aprender las distintas asignaturas y manifestarlas a través de proyectos, A través de estos, se integran habilidades cognitivas (medir, calcular, leer, escribir) en contextos de vida real, favoreciendo así una transferencia significativa del aprendizaje.",
  ],
  "grupo-helechos-2": [
    "En Helechos 2 el enfoque transdisciplinario - antroposófico, es la metodología para aprender las distintas asignaturas y manifestarlas a través de proyectos, A través de estos proyectos, se integran habilidades cognitivas (medir, calcular, leer, escribir) en contextos de vida real, favoreciendo así una transferencia significativa del aprendizaje.",
    "En esta etapa, las niñas y niños avanzan hacia una mayor autoconciencia, de sus decisiones y de su impacto en el entorno. Por eso, sostenemos espacios donde puedan cuestionar, proponer, colaborar y poner en práctica sus ideas, integrando sus dones en experiencias reales que los conecten con el mundo y su transformación.",
  ],
};

function getContentSlot(slotId: string) {
  const slot = contentSlotMap.get(slotId);

  if (!slot) {
    throw new Error(`Unknown como-acompanamos group content slot: ${slotId}`);
  }

  return slot;
}

function EditableGroupCopy({
  slotId,
  as,
  className,
  style,
  stylePriority,
  renderInsertedBlocks,
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: {
  slotId: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  stylePriority?: "base" | "override";
  renderInsertedBlocks?: boolean;
  textMap: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>) {
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
      renderInsertedBlocks={renderInsertedBlocks}
    />
  );
}

function scrollToGroupsTabsTop() {
  document
    .getElementById("grupos-de-acompanamiento-tabs")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function groupSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AccompanimentGroupsTabs({
  groups,
  textMap = {},
  imageMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: AccompanimentGroupsTabsProps) {
  const slugsByTitle = useMemo(
    () => new Map(groups.map((group) => [groupSlug(group.title), group.title])),
    [groups],
  );
  const [activeGroup, setActiveGroup] = useState(groups[0]?.title ?? "");
  const activeGroupIndex = Math.max(
    0,
    groups.findIndex((group) => group.title === activeGroup),
  );
  const activeGroupForMobile = groups[activeGroupIndex];

  function selectGroup(groupTitle: string) {
    setActiveGroup(groupTitle);
    window.history.replaceState(null, "", `#${groupSlug(groupTitle)}`);
    scrollToGroupsTabsTop();
  }

  function selectMobileGroup(direction: "previous" | "next") {
    if (groups.length === 0) return;

    const nextIndex =
      direction === "previous"
        ? (activeGroupIndex - 1 + groups.length) % groups.length
        : (activeGroupIndex + 1) % groups.length;

    selectGroup(groups[nextIndex].title);
  }

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      const groupTitle = slugsByTitle.get(hash);

      if (groupTitle) {
        setActiveGroup(groupTitle);
        scrollToGroupsTabsTop();
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [slugsByTitle]);

  const slotBindingProps = {
    textMap,
    previewMode,
    selectedContentSlotId,
    onSelectContentSlot,
  };

  return (
    <Tabs
      id="grupos-de-acompanamiento-tabs"
      value={activeGroup}
      onValueChange={selectGroup}
      className="mt-10 grid min-w-0 scroll-mt-24 gap-6 md:scroll-mt-28 md:grid-cols-[18rem_minmax(0,1fr)] md:items-start"
    >
      {activeGroupForMobile ? (
        <div className="flex min-w-0 items-center gap-3 rounded-[2rem] border border-complement-600 bg-white/70 px-3 py-4 md:hidden">
          <button
            type="button"
            aria-label="Ver grupo anterior"
            onClick={() => selectMobileGroup("previous")}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-complement-700 text-3xl leading-none text-[var(--complement-800)] transition hover:bg-[var(--complement-100)]"
          >
            &lsaquo;
          </button>
          <div className="min-w-0 flex-1 text-center">
            <span className="block max-w-full break-words text-[clamp(1.25rem,5vw,1.45rem)] leading-none text-[var(--complement-800)] [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
              <EditableGroupCopy
                slotId={groupSlotId(activeGroupIndex, "title")}
                style={{ fontSize: "inherit", lineHeight: "inherit" }}
                stylePriority="override"
                renderInsertedBlocks={false}
                {...slotBindingProps}
              />
            </span>
            <span className="mt-2 block max-w-full break-words text-[1.6rem] leading-none text-black/75 [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-indie-flower)" }}>
              <EditableGroupCopy
                slotId={groupSlotId(activeGroupIndex, "ageRange")}
                renderInsertedBlocks={false}
                {...slotBindingProps}
              />
            </span>
          </div>
          <button
            type="button"
            aria-label="Ver grupo siguiente"
            onClick={() => selectMobileGroup("next")}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-complement-700 text-3xl leading-none text-[var(--complement-800)] transition hover:bg-[var(--complement-100)]"
          >
            &rsaquo;
          </button>
        </div>
      ) : null}

      <TabsList className="hidden h-[32rem] w-full grid-rows-4 gap-0 rounded-none bg-transparent px-0 py-2 md:sticky md:top-28 md:grid md:self-start">
        {groups.map((group, index) => (
          <TabsTrigger
            key={group.title}
            value={group.title}
            className="relative h-full w-full min-w-0 flex-col items-start justify-center rounded-none border-0 bg-transparent px-3 py-4 text-left font-normal whitespace-normal break-words text-black/85 [overflow-wrap:anywhere] data-[active]:bg-transparent data-[active]:!text-[var(--complement-800)] data-[selected]:!text-[var(--complement-800)] aria-selected:!text-[var(--complement-800)]"
          >
            <span className="block max-w-full break-words text-[1.45rem] leading-[0.95] [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
              <EditableGroupCopy
                slotId={groupSlotId(index, "title")}
                style={{ fontSize: "inherit", lineHeight: "inherit" }}
                stylePriority="override"
                renderInsertedBlocks={false}
                {...slotBindingProps}
              />
            </span>
            <span className="mt-2 block max-w-full break-words text-[1.3rem] leading-none [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-indie-flower)" }}>
              <EditableGroupCopy
                slotId={groupSlotId(index, "ageRange")}
                renderInsertedBlocks={false}
                {...slotBindingProps}
              />
            </span>
            {index < groups.length - 1 ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-0 bottom-0 left-0 h-px"
                style={{
                  backgroundImage: "repeating-linear-gradient(to right, currentColor 0 10px, transparent 10px 18px)",
                  color: "rgb(var(--complement-700) / 0.75)",
                }}
              />
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>

      {groups.map((group, index) => (
        <TabsContent
          id={groupSlug(group.title)}
          key={group.title}
          value={group.title}
          className="mt-0 h-full min-w-0 scroll-mt-36 rounded-[2rem] border border-complement-600 bg-white/60 p-3 md:p-4"
        >
          <div className="grid min-w-0 gap-8 p-4 md:p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            <div className="min-w-0">
              <h3 className="mb-2 max-w-full break-words text-[clamp(1.25rem,5vw,1.45rem)] leading-none text-black [overflow-wrap:anywhere] md:text-4xl" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
                <EditableGroupCopy
                  slotId={groupSlotId(index, "title")}
                  style={{ fontSize: "inherit", lineHeight: "inherit" }}
                  stylePriority="override"
                  {...slotBindingProps}
                />
              </h3>
              <p className="mb-5 max-w-full break-words text-[clamp(1.25rem,5vw,1.45rem)] leading-none text-black/75 [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-indie-flower)" }}>
                <EditableGroupCopy
                  slotId={groupSlotId(index, "ageRange")}
                  {...slotBindingProps}
                />
              </p>
              <div className="min-w-0 space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
                {(groupTabSummaries[groupSlug(group.title)] ?? group.paragraphs.slice(0, 1)).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <Link
                  href={`/como-acompanamos/${groupSlug(group.title)}`}
                  className="inline-flex w-fit items-center justify-center rounded-full border border-[var(--complement-700)] bg-[var(--complement-700)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--complement-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--complement-700)] focus-visible:ring-offset-2"
                >
                  Conocer más
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[22rem]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
                <CmsPageEditableImage
                  slotId={`accompaniment.image.group.${index}`}
                  defaultSrc={group.imageSrc}
                  alt={group.imageAlt}
                  imageMap={imageMap}
                  previewMode={previewMode}
                  selectedContentSlotId={selectedContentSlotId}
                  onSelectContentSlot={onSelectContentSlot}
                  fill
                  className="object-cover"
                  lockFrame
                />
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}


