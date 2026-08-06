"use client";

import { useEffect, useState, type CSSProperties, type ElementType } from "react";

import {
  comoAcompanamosContentSlotIds,
  getComoAcompanamosContentSlots,
  learningPrincipleSlotId,
  type LearningPrinciple,
} from "@/modules/como-acompanamos/content-slots";
import type {
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
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
  const [mobileModalIndex, setMobileModalIndex] = useState<number | null>(null);
  const activeArrow =
    activeIndex === null ? null : arrowPaths[activeIndex % arrowPaths.length];
  const modalPrincipleStyle =
    mobileModalIndex === null
      ? null
      : principleStyles[mobileModalIndex % principleStyles.length];

  function closeMobileModal() {
    setMobileModalIndex(null);
    setActiveIndex(null);
  }

  useEffect(() => {
    if (mobileModalIndex === null) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileModal();
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileModalIndex]);

  function handlePrincipleClick(index: number) {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setActiveIndex(index);
      setMobileModalIndex(index);
      return;
    }

    setActiveIndex(activeIndex === index ? null : index);
  }

  return (
    <div className="mt-16 bg-[#fdfbf6] py-10 md:mt-20 md:py-12">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-14">
        <h2
          className="text-[clamp(1.35rem,5.5vw,1.55rem)] leading-[1.02] tracking-tight text-black md:text-5xl lg:text-6xl"
          style={{ fontFamily: "var(--font-roboto-condensed)" }}
        >
          Principios de aprendizaje
        </h2>
      </div>

      <div className="relative mx-auto mt-10 grid w-full max-w-7xl gap-8 px-6 md:mt-12 md:px-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.38fr)] lg:items-center lg:px-14">
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
              style={{
                animation: "koruDrawLearningArrow 760ms ease-out forwards",
              }}
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
                animation:
                  "koruRevealLearningArrowHead 160ms ease-out 720ms forwards",
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
                  onClick={() => handlePrincipleClick(index)}
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

        <aside
          className="relative z-10 hidden h-[28rem] lg:flex lg:items-center lg:pl-4"
          aria-live="polite"
        >
          {activeIndex !== null ? (
            <div className="px-5 py-5 text-5xl leading-[1.05] text-[var(--complement-800)] opacity-100 transition duration-200 [font-family:var(--font-indie-flower)] md:text-5xl">
              <EditablePrincipleCopy
                as="p"
                slotId={learningPrincipleSlotId(activeIndex, "description")}
                textMap={textMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
                className="block text-[var(--complement-800)]"
                style={{
                  fontFamily: "var(--font-indie-flower)",
                  color: "var(--complement-800)",
                  fontSize: "clamp(1.85rem, 2.55vw, 2.75rem)",
                  lineHeight: "1.08",
                }}
                stylePriority="override"
              />
            </div>
          ) : null}
        </aside>
      </div>

      {mobileModalIndex !== null && modalPrincipleStyle ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-3 py-8 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="learning-principle-modal-title"
          onClick={closeMobileModal}
        >
          <div
            className={`relative min-h-[27rem] w-full max-w-[25rem] overflow-visible border px-10 py-16 shadow-xl rounded-[45%_55%_47%_53%/34%_34%_66%_66%] ${modalPrincipleStyle.color} ${modalPrincipleStyle.border}`}
            onClick={(event) => event.stopPropagation()}
          >
            <span
              className="pointer-events-none absolute inset-[0.8rem] z-0 rounded-[42%_58%_50%_50%/38%_37%_63%_62%] border border-white/75"
              aria-hidden="true"
            />
            <div className="relative z-10 flex min-h-[20rem] flex-col items-center justify-center space-y-5 text-center">
              <h3
                id="learning-principle-modal-title"
                className="text-[clamp(1.35rem,5vw,1.6rem)] leading-none text-[var(--complement-900)]"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                <EditablePrincipleCopy
                  slotId={learningPrincipleSlotId(mobileModalIndex, "title")}
                  textMap={textMap}
                  previewMode={previewMode}
                  selectedContentSlotId={selectedContentSlotId}
                  onSelectContentSlot={onSelectContentSlot}
                  className="block max-w-full break-words [overflow-wrap:anywhere]"
                  stylePriority="override"
                />
              </h3>
              <EditablePrincipleCopy
                as="p"
                slotId={learningPrincipleSlotId(mobileModalIndex, "description")}
                textMap={textMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
                className="block max-w-full break-words text-[var(--complement-800)] [overflow-wrap:anywhere]"
                style={{
                  fontFamily: "var(--font-indie-flower)",
                  color: "var(--complement-800)",
                  fontSize: "clamp(1.85rem, 6.8vw, 2.5rem)",
                  lineHeight: "1.08",
                }}
                stylePriority="override"
              />
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto mt-8 w-full max-w-5xl px-6 pb-2 md:mt-10 md:px-10 lg:px-14">
        <div className="relative overflow-hidden border border-[color-mix(in_srgb,var(--orange-500)_30%,white)] bg-[color-mix(in_srgb,var(--orange-500)_14%,white)] px-7 py-7 text-center shadow-sm rounded-[6rem_4.5rem_5.5rem_4rem/3.25rem_4.5rem_3.5rem_4.25rem] md:px-12 md:py-9">
          <span
            className="pointer-events-none absolute inset-[0.55rem] border border-white/70 rounded-[4.75rem_5.75rem_4.25rem_5.25rem/3.75rem_3rem_4.5rem_3.25rem]"
            aria-hidden="true"
          />
          <EditablePrincipleCopy
            as="p"
            slotId={comoAcompanamosContentSlotIds.learningPrinciplesSummary}
            textMap={textMap}
            previewMode={previewMode}
            selectedContentSlotId={selectedContentSlotId}
            onSelectContentSlot={onSelectContentSlot}
            className="relative z-10 block max-w-full break-words text-lg font-medium leading-relaxed text-[var(--complement-900)] [overflow-wrap:anywhere] md:text-xl"
            style={{ fontFamily: "var(--font-montserrat)" }}
            stylePriority="override"
          />
        </div>
      </div>
    </div>
  );
}
