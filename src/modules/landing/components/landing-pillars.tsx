import { landingPillars } from "@/modules/landing/data/landing-content";
import { cn } from "@/lib/utils";
import {
  getLandingFieldFontSize,
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";

type LandingPillarsProps = {
  textMap: LandingTextMap;
} & LandingPreviewBindings;

function selectableClass(active: boolean, previewMode?: boolean) {
  return cn(previewMode && "cursor-pointer rounded-sm transition", active && "ring-2 ring-primary/50");
}

export function LandingPillars({
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingPillarsProps) {
  return (
    <section id="metodo" className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-[92rem] px-5 py-20 md:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-black/55">
            NUESTRA MIRADA
          </p>
          <h2
            className={cn(
              "mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl",
              selectableClass(selectedFieldId === "vision-title", previewMode),
            )}
            onClick={() => onSelectField?.("vision-title")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "vision-title", 40)}px`,
            }}
          >
            {textMap["vision-title"]}
          </h2>
          <p
            className={cn(
              "mt-4 max-w-2xl leading-7 text-black/75",
              selectableClass(selectedFieldId === "vision-body", previewMode),
            )}
            onClick={() => onSelectField?.("vision-body")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "vision-body", 18)}px`,
            }}
          >
            {textMap["vision-body"]}
          </p>
          <p
            className={cn(
              "mt-4 text-lg font-medium text-black/85",
              selectableClass(selectedFieldId === "vision-highlight", previewMode),
            )}
            onClick={() => onSelectField?.("vision-highlight")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "vision-highlight", 26)}px`,
            }}
          >
            {textMap["vision-highlight"]}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {landingPillars.map((pillar) => (
            <article
              key={pillar.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              <p className="text-sm font-semibold text-black/55">{pillar.id}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                {pillar.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-black/60">
                {pillar.subtitle}
              </p>
              <p className="mt-4 leading-7 text-black/75">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
