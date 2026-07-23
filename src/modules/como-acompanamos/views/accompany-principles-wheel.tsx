"use client";

import { useState, type CSSProperties, type ElementType } from "react";

import {
  getComoAcompanamosContentSlots,
  learningPrincipleSlotId,
  type LearningPrinciple,
} from "@/modules/como-acompanamos/content-slots";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";
import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";

type AccompanyPrinciplesWheelProps = {
  principles: LearningPrinciple[];
  textMap: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>;

const contentSlotMap = new Map(
  getComoAcompanamosContentSlots().map((slot) => [slot.id, slot]),
);

const principleStyles = [
  {
    color: "bg-[color-mix(in_srgb,var(--complement-700)_34%,white)]",
    border: "border-[color-mix(in_srgb,var(--complement-800)_42%,white)]",
    shape: "rounded-[44%_56%_48%_52%/58%_42%_58%_42%]",
    innerShape: "rounded-[58%_42%_52%_48%/45%_55%_44%_56%]",
    innerInset: "inset-[0.45rem]",
    left: "25%",
    top: "18%",
    width: "clamp(10.75rem, 13vw, 12.75rem)",
    titleSize: "clamp(1.08rem, 1.22vw, 1.24rem)",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_14%,white)]",
    border: "border-[color-mix(in_srgb,var(--orange-500)_30%,white)]",
    shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
    innerShape: "rounded-[46%_54%_45%_55%/58%_42%_56%_44%]",
    innerInset: "inset-[0.55rem]",
    left: "45%",
    top: "19%",
    width: "clamp(13rem, 16vw, 15.25rem)",
    titleSize: "clamp(1.02rem, 1.14vw, 1.18rem)",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_20%,white)]",
    border: "border-[color-mix(in_srgb,var(--brand-700)_24%,white)]",
    shape: "rounded-[52%_48%_43%_57%/47%_55%_45%_53%]",
    innerShape: "rounded-[61%_39%_54%_46%/48%_58%_42%_52%]",
    innerInset: "inset-[0.5rem]",
    left: "17%",
    top: "49%",
    width: "clamp(11rem, 13vw, 13rem)",
    titleSize: "clamp(1.06rem, 1.18vw, 1.22rem)",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_58%,white)]",
    border: "border-[color-mix(in_srgb,var(--orange-500)_70%,white)]",
    shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
    innerShape: "rounded-[48%_52%_39%_61%/42%_58%_53%_47%]",
    innerInset: "inset-[0.42rem]",
    left: "58%",
    top: "43%",
    width: "clamp(10.75rem, 13vw, 12.75rem)",
    titleSize: "clamp(1.08rem, 1.22vw, 1.24rem)",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--complement-900)_16%,white)]",
    border: "border-[color-mix(in_srgb,var(--complement-900)_34%,white)]",
    shape: "rounded-[47%_53%_56%_44%/57%_43%_52%_48%]",
    innerShape: "rounded-[53%_47%_59%_41%/56%_44%_48%_52%]",
    innerInset: "inset-[0.48rem]",
    left: "40%",
    top: "66%",
    width: "clamp(9.75rem, 11vw, 11.25rem)",
    titleSize: "clamp(1.06rem, 1.14vw, 1.18rem)",
  },
];

const arrowPaths = [
  {
    line: "M 296 104 C 352 72 418 58 498 58 C 584 58 674 76 758 116",
    head: "M 728 114 L 758 116 L 737 94",
  },
  {
    line: "M 570 128 C 630 100 688 96 728 110 C 742 114 750 115 758 116",
    head: "M 729 126 L 758 116 L 732 100",
  },
  {
    line: "M 300 268 C 438 320 604 266 682 174 C 708 144 734 124 758 116",
    head: "M 736 138 L 758 116 L 728 114",
  },
  {
    line: "M 600 236 C 652 202 700 162 742 126 C 748 122 753 119 758 116",
    head: "M 742 142 L 758 116 L 728 120",
  },
  {
    line: "M 455 342 C 570 350 660 310 704 256 C 718 240 726 230 740 222",
    head: "M 720 246 L 740 222 L 710 225",
  },
];

function getContentSlot(slotId: string) {
  const slot = contentSlotMap.get(slotId);

  if (!slot) {
    throw new Error(`Unknown Como acompanamos content slot: ${slotId}`);
  }

  return slot;
}

function EditablePrincipleCopy({
  slotId,
  as,
  className,
  style,
  stylePriority,
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: {
  slotId: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  stylePriority?: "base" | "override";
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
      style={style}
      stylePriority={stylePriority}
    />
  );
}

export function AccompanyPrinciplesWheel({
  principles,
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: AccompanyPrinciplesWheelProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeArrow =
    activeIndex === null ? null : arrowPaths[activeIndex % arrowPaths.length];

  return (
    <div className="mt-16 bg-[#fdfbf6] py-10 md:mt-20 md:py-12">
      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-6 md:px-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.38fr)] lg:items-center lg:px-14">
        <style>{`
          @keyframes koruDrawLearningArrow {
            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes koruRevealLearningArrowHead {
            to {
              opacity: 1;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .koru-learning-arrow-line {
              animation: none;
              stroke-dashoffset: 0;
            }

            .koru-learning-arrow-head {
              animation: none;
              opacity: 1;
            }
          }
        `}</style>

        {activeArrow ? (
          <svg
            key={activeIndex}
            className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full overflow-visible text-[var(--complement-800)] lg:block"
            viewBox="0 0 1000 420"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="koru-learning-arrow-line"
              d={activeArrow.line}
              pathLength={1}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1"
              strokeDashoffset="1"
              style={{ animation: "koruDrawLearningArrow 760ms ease-out forwards" }}
            />
            <path
              className="koru-learning-arrow-head"
              d={activeArrow.head}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0}
              style={{
                animation: "koruRevealLearningArrowHead 160ms ease-out 720ms forwards",
              }}
            />
          </svg>
        ) : null}

        <div className="relative z-10 grid gap-5 md:block md:min-h-[26rem] lg:min-h-[28rem]">
          {principles.map((principle, index) => {
            const style = principleStyles[index % principleStyles.length];
            const isActive = activeIndex === index;

            return (
              <article
                key={`${principle.title}-${index}`}
                className="group relative md:absolute md:left-[var(--principle-left)] md:top-[var(--principle-top)]"
                style={
                  {
                    "--principle-left": style.left,
                    "--principle-top": style.top,
                    "--principle-width": style.width,
                    "--principle-title-size": style.titleSize,
                  } as CSSProperties
                }
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
              >
                <button
                  type="button"
                  className={`relative flex min-h-[7.5rem] w-full flex-col items-center justify-center overflow-hidden border px-6 py-4 text-center shadow-sm outline-none transition duration-200 hover:scale-[1.03] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--complement-800)] md:w-[var(--principle-width)] ${style.color} ${style.border} ${style.shape}`}
                  onClick={() => setActiveIndex(isActive ? null : index)}
                  aria-expanded={isActive}
                >
                  <span
                    className={`absolute z-0 border border-white/70 ${style.innerInset} ${style.innerShape}`}
                    aria-hidden="true"
                  />
                  <EditablePrincipleCopy
                    slotId={learningPrincipleSlotId(index, "title")}
                    textMap={textMap}
                    previewMode={previewMode}
                    selectedContentSlotId={selectedContentSlotId}
                    onSelectContentSlot={onSelectContentSlot}
                    className="relative z-10 block max-w-[calc(var(--principle-width)-3.25rem)] whitespace-nowrap break-normal [overflow-wrap:normal] [word-break:keep-all] leading-[1.05] text-[var(--complement-900)]"
                    style={{ fontSize: "var(--principle-title-size)" }}
                    stylePriority="override"
                  />
                </button>
              </article>
            );
          })}
        </div>

        <aside className="relative z-10 min-h-[10rem] lg:pl-4" aria-live="polite">
          <div
            className={`rounded-[1.75rem] border border-[#e7dfcf] bg-white/80 px-5 py-5 text-sm leading-relaxed text-black/75 shadow-sm transition duration-200 md:text-base ${
              activeIndex === null ? "opacity-70" : "opacity-100"
            }`}
          >
            {activeIndex === null ? (
              <p className="text-[var(--complement-900)]/70">
                Acercate a cada principio para conocer más.
              </p>
            ) : (
              <EditablePrincipleCopy
                as="p"
                slotId={learningPrincipleSlotId(activeIndex, "description")}
                textMap={textMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
