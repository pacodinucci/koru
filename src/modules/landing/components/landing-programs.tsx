import { landingPrograms } from "@/modules/landing/data/landing-content";
import { cn } from "@/lib/utils";
import type {
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
import { getLandingFieldFontSize } from "@/modules/landing/types/landing-text";

type LandingProgramsProps = {
  textMap: LandingTextMap;
} & LandingPreviewBindings;

function selectableClass(active: boolean, previewMode?: boolean) {
  return cn(
    previewMode && "cursor-pointer rounded-sm transition",
    active && "ring-2 ring-primary/50",
  );
}

export function LandingPrograms({
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingProgramsProps) {
  return (
    <section
      id="niveles"
      className="flex min-h-screen items-center border-y border-black/10 bg-[#ece9df]"
    >
      <div className="mx-auto w-full max-w-[92rem] px-5 py-20 md:px-8 lg:px-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-black/55">
              CAMINO KORU
            </p>
            <h2
              className={cn(
                "mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl",
                selectableClass(selectedFieldId === "path-title", previewMode),
              )}
              onClick={() => onSelectField?.("path-title")}
              style={{
                fontSize: `${getLandingFieldFontSize(textMap, "path-title", 40)}px`,
              }}
            >
              {textMap["path-title"]}
            </h2>
          </div>
          <p
            className={cn(
              "max-w-md text-sm leading-6 text-black/70",
              selectableClass(selectedFieldId === "path-body", previewMode),
            )}
            onClick={() => onSelectField?.("path-body")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "path-body", 14)}px`,
            }}
          >
            {textMap["path-body"]}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {landingPrograms.map((program) => (
            <article
              key={program.studio}
              className="rounded-3xl border border-black/10 bg-white p-6"
            >
              <p className="text-xs font-semibold tracking-[0.12em] text-black/55">
                {program.stage}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                {program.studio}
              </h3>
              <p className="mt-1 text-sm text-black/60">{program.ages}</p>
              <p className="mt-4 leading-7 text-black/75">{program.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
