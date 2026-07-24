
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>;

const contentSlotMap = new Map(
  getComoAcompanamosContentSlots().map((slot) => [slot.id, slot]),
);

const responsiveTextClass = "max-w-full break-words [overflow-wrap:anywhere]";

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
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: {
  slotId: string;
  as?: React.ElementType;
  className?: string;
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
    />
  );
}

function BulletList({
  items,
  slotIdForIndex,
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: {
  items: string[];
  slotIdForIndex?: (index: number) => string;
  textMap?: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>) {
  return (
    <ul className="min-w-0 space-y-2 pl-5 text-black/80">
      {items.map((item, index) => {
        const slotId = slotIdForIndex?.(index);

        return (
          <li key={`${item}-${index}`} className="list-disc break-words [overflow-wrap:anywhere] marker:text-[var(--complement-800)]">
            {slotId && textMap ? (
              <EditableGroupCopy
                slotId={slotId}
                textMap={textMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
              />
            ) : (
              item
            )}
          </li>
        );
      })}
    </ul>
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
            <span className="block max-w-full break-words text-[2rem] leading-none text-[var(--complement-800)] [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
              <EditableGroupCopy
                slotId={groupSlotId(activeGroupIndex, "title")}
                {...slotBindingProps}
              />
            </span>
            <span className="mt-2 block max-w-full break-words text-[1.6rem] leading-none text-black/75 [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-indie-flower)" }}>
              <EditableGroupCopy
                slotId={groupSlotId(activeGroupIndex, "ageRange")}
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
                {...slotBindingProps}
              />
            </span>
            <span className="mt-2 block max-w-full break-words text-[1.3rem] leading-none [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-indie-flower)" }}>
              <EditableGroupCopy
                slotId={groupSlotId(index, "ageRange")}
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
              <h3 className="mb-2 max-w-full break-words text-4xl leading-none text-black [overflow-wrap:anywhere] md:text-4xl" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
                <EditableGroupCopy
                  slotId={groupSlotId(index, "title")}
                  {...slotBindingProps}
                />
              </h3>
              <p className="mb-5 max-w-full break-words text-3xl leading-none text-black/75 [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-indie-flower)" }}>
                <EditableGroupCopy
                  slotId={groupSlotId(index, "ageRange")}
                  {...slotBindingProps}
                />
              </p>
              <div className="min-w-0 space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
                {group.paragraphs.map((paragraph, paragraphIndex) => (
                  <EditableGroupCopy
                    key={`${paragraph}-${paragraphIndex}`}
                    as="p"
                    slotId={groupSlotId(index, `paragraph.${paragraphIndex}`)}
                    {...slotBindingProps}
                  />
                ))}
                {group.bullets ? (
                  <BulletList
                    items={group.bullets}
                    slotIdForIndex={(bulletIndex) => groupSlotId(index, `bullet.${bulletIndex}`)}
                    {...slotBindingProps}
                  />
                ) : null}
                {group.closing ? (
                  <EditableGroupCopy
                    as="p"
                    slotId={groupSlotId(index, "closing")}
                    {...slotBindingProps}
                  />
                ) : null}
                {group.rhythmIntro ? (
                  <EditableGroupCopy
                    as="p"
                    slotId={groupSlotId(index, "rhythmIntro")}
                    {...slotBindingProps}
                  />
                ) : null}
                {group.rhythmBullets ? (
                  <BulletList
                    items={group.rhythmBullets}
                    slotIdForIndex={(bulletIndex) => groupSlotId(index, `rhythmBullet.${bulletIndex}`)}
                    {...slotBindingProps}
                  />
                ) : null}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[22rem]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
                <Image src={group.imageSrc} alt={group.imageAlt} fill className="object-cover" />
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
