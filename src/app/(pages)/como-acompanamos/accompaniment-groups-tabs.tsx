
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-5 text-black/80">
      {items.map((item) => (
        <li key={item} className="list-disc marker:text-[var(--complement-800)]">
          {item}
        </li>
      ))}
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

export function AccompanimentGroupsTabs({ groups }: AccompanimentGroupsTabsProps) {
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
              {group.title}
            </span>
            <span className="mt-2 block text-[1.3rem] leading-none" style={{ fontFamily: "var(--font-indie-flower)" }}>
              {group.ageRange}
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

      {groups.map((group) => (
        <TabsContent
          id={groupSlug(group.title)}
          key={group.title}
          value={group.title}
          className="mt-0 h-full scroll-mt-36 rounded-[2rem] border border-complement-600 bg-white/60 p-3 md:p-4"
        >
          <div className="grid gap-8 p-4 md:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <h3 className="mb-2 text-3xl leading-none text-black md:text-4xl" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
                {group.title}
              </h3>
              <p className="mb-5 text-3xl leading-none text-black/75" style={{ fontFamily: "var(--font-indie-flower)" }}>
                {group.ageRange}
              </p>
              <div className="space-y-4 text-base leading-relaxed text-black/85 md:text-lg">
                {group.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {group.bullets ? <BulletList items={group.bullets} /> : null}
                {group.closing ? <p>{group.closing}</p> : null}
                {group.rhythmIntro ? <p>{group.rhythmIntro}</p> : null}
                {group.rhythmBullets ? <BulletList items={group.rhythmBullets} /> : null}
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
