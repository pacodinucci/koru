
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

function getContentSlot(slotId: string) {
  const slot = contentSlotMap.get(slotId);

  if (!slot) {
    throw new Error(`Unknown Cómo acompañamos group content slot: ${slotId}`);
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
      className={className}
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
    <ul className="space-y-2 pl-5 text-black/80">
      {items.map((item, index) => {
        const slotId = slotIdForIndex?.(index);

        return (
          <li key={`${item}-${index}`} className="list-disc marker:text-[var(--complement-800)]">
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

function scrollToGroupsTop() {
  document
    .getElementById("grupos-de-acompanamiento")
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

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      const groupTitle = slugsByTitle.get(hash);

      if (groupTitle) {
        setActiveGroup(groupTitle);
        scrollToGroupsTop();
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
      value={activeGroup}
      onValueChange={setActiveGroup}
      className="mt-10 grid gap-6 md:grid-cols-[18rem_minmax(0,1fr)] md:items-start"
    >
      <TabsList className="grid h-[32rem] w-full grid-rows-4 gap-0 rounded-none bg-transparent px-0 py-2 md:sticky md:top-28 md:self-start">
        {groups.map((group, index) => (
          <TabsTrigger
            key={group.title}
            value={group.title}
            onClick={() => {
              window.history.replaceState(null, "", `#${groupSlug(group.title)}`);
              scrollToGroupsTop();
            }}
            className="relative h-full w-full flex-col items-start justify-center rounded-none border-0 bg-transparent px-3 py-4 text-left font-normal whitespace-normal text-black/85 data-[active]:bg-transparent data-[active]:!text-[var(--complement-800)] data-[selected]:!text-[var(--complement-800)] aria-selected:!text-[var(--complement-800)]"
          >
            <span className="block text-[1.45rem] leading-[0.95]" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
              <EditableGroupCopy
                slotId={groupSlotId(index, "title")}
                {...slotBindingProps}
              />
            </span>
            <span className="mt-2 block text-[1.3rem] leading-none" style={{ fontFamily: "var(--font-indie-flower)" }}>
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
          className="mt-0 h-full scroll-mt-36 rounded-[2rem] border border-complement-600 bg-white/60 p-3 md:p-4"
        >
          <div className="grid gap-8 p-4 md:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <h3 className="mb-2 text-3xl leading-none text-black md:text-4xl" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
                <EditableGroupCopy
                  slotId={groupSlotId(index, "title")}
                  {...slotBindingProps}
                />
              </h3>
              <p className="mb-5 text-3xl leading-none text-black/75" style={{ fontFamily: "var(--font-indie-flower)" }}>
                <EditableGroupCopy
                  slotId={groupSlotId(index, "ageRange")}
                  {...slotBindingProps}
                />
              </p>
              <div className="space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
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
