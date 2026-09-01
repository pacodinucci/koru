"use client";

import { CmsPageEditableCopy } from "@/modules/cms/components/cms-page-editable-copy";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";

export type EcocycleStage = { title: string; text: string };

const stageStyles = [
  { color: "bg-[color-mix(in_srgb,var(--complement-700)_28%,white)]", border: "border-[color-mix(in_srgb,var(--complement-800)_38%,white)]", shape: "rounded-[48%_52%_45%_55%/58%_42%_58%_42%]", innerShape: "rounded-[57%_43%_55%_45%/45%_55%_44%_56%]" },
  { color: "bg-[color-mix(in_srgb,var(--orange-500)_14%,white)]", border: "border-[color-mix(in_srgb,var(--orange-500)_30%,white)]", shape: "rounded-[54%_46%_58%_42%/44%_56%_44%_56%]", innerShape: "rounded-[46%_54%_45%_55%/58%_42%_56%_44%]" },
  { color: "bg-[color-mix(in_srgb,var(--orange-500)_20%,white)]", border: "border-[color-mix(in_srgb,var(--brand-700)_24%,white)]", shape: "rounded-[52%_48%_43%_57%/47%_55%_45%_53%]", innerShape: "rounded-[61%_39%_54%_46%/48%_58%_42%_52%]" },
  { color: "bg-[color-mix(in_srgb,var(--orange-500)_58%,white)]", border: "border-[color-mix(in_srgb,var(--orange-500)_70%,white)]", shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]", innerShape: "rounded-[48%_52%_39%_61%/42%_58%_53%_47%]" },
];

function EcocycleStageCard({ index, editable, className = "" }: { index: number; editable: EcocycleEditable; className?: string }) {
  const style = stageStyles[index % stageStyles.length];

  return (
    <article className={`relative z-10 flex min-h-[12rem] w-full max-w-[16rem] flex-col items-center justify-center overflow-hidden border px-5 py-6 text-center shadow-sm ${style.color} ${style.border} ${style.shape} ${className}`}>
      <span className={`pointer-events-none absolute inset-[0.38rem] border border-white/70 ${style.innerShape}`} aria-hidden="true" />
      <h3 className="relative z-10 text-[clamp(1.55rem,2.4vw,2.1rem)] leading-none text-[var(--complement-800)]" style={{ fontFamily: "var(--font-roboto-condensed)" }}><CmsPageEditableCopy {...editable} as="span" slotId={"evaluations.ecocycle.stage." + index + ".title"} /></h3>
      <p className="relative z-10 mt-3 text-sm leading-relaxed text-black/75"><CmsPageEditableCopy {...editable} as="span" slotId={"evaluations.ecocycle.stage." + index + ".text"} /></p>
    </article>
  );
}

type EcocycleEditable = { page: "evaluaciones"; textMap: LandingTextMap } & Pick<LandingPreviewBindings, "previewMode" | "selectedContentSlotId" | "onSelectContentSlot">;

export function EcocycleSpiral({ stages, textMap, previewMode, selectedContentSlotId, onSelectContentSlot }: { stages: EcocycleStage[]; textMap: LandingTextMap } & Pick<LandingPreviewBindings, "previewMode" | "selectedContentSlotId" | "onSelectContentSlot">) {
  const editable: EcocycleEditable = { page: "evaluaciones", textMap, previewMode, selectedContentSlotId, onSelectContentSlot };
  return (
    <div className="w-full">
      <div className="relative mx-auto hidden w-full max-w-[70rem] py-12 md:block">
        <svg className="pointer-events-none absolute inset-x-0 top-1/2 h-24 w-full -translate-y-1/2 text-[var(--orange-500)] opacity-85" viewBox="0 0 1120 96" fill="none" aria-hidden="true">
          <defs>
            <marker id="ecocycle-thread-arrow" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto">
              <path d="M0 0L9 4.5L0 9Z" fill="currentColor" />
            </marker>
          </defs>
          <path d="M38 50C145 10 255 86 360 48C465 10 575 86 680 48C785 10 895 86 1068 48" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.24" />
          <path d="M38 50C145 10 255 86 360 48C465 10 575 86 680 48C785 10 895 86 1068 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.5 12" markerEnd="url(#ecocycle-thread-arrow)" />
        </svg>
        <div className="relative grid grid-cols-4 items-center gap-5 px-5">
          {stages.map((stage, index) => (
            <div key={stage.title} className="flex justify-center">
              <EcocycleStageCard index={index} editable={editable} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-sm md:hidden">
        <div className="absolute bottom-8 left-1/2 top-8 -translate-x-1/2 border-l-[3px] border-dotted border-[var(--orange-500)] opacity-85" aria-hidden="true" />
        <div className="relative z-10 grid justify-items-center gap-5">
          {stages.map((stage, index) => <EcocycleStageCard key={stage.title} index={index} editable={editable} className="max-w-[21rem]" />)}
        </div>
      </div>
    </div>
  );
}
