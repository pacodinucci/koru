import { landingMetrics } from "@/modules/landing/data/landing-content";
import { cn } from "@/lib/utils";
import {
  getLandingFieldFontSize,
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";

type LandingHeroProps = {
  textMap: LandingTextMap;
} & LandingPreviewBindings;

function selectableClass(active: boolean, previewMode?: boolean) {
  return cn(previewMode && "cursor-pointer rounded-sm transition", active && "ring-2 ring-primary/50");
}

export function LandingHero({
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingHeroProps) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden border-b border-black/10 bg-[#f4efe5]">
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#d5e8d4]/60 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-[#c8d8f0]/70 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
        <div>
          <p
            className={cn(
              "text-xs font-semibold tracking-[0.25em] text-black/60",
              selectableClass(selectedFieldId === "hero-kicker", previewMode),
            )}
            onClick={() => onSelectField?.("hero-kicker")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "hero-kicker", 12)}px`,
            }}
          >
            {textMap["hero-kicker"]}
          </p>
          <h1
            className={cn(
              "mt-4 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-black sm:text-5xl lg:text-6xl",
              selectableClass(selectedFieldId === "hero-title", previewMode),
            )}
            onClick={() => onSelectField?.("hero-title")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "hero-title", 56)}px`,
            }}
          >
            {textMap["hero-title"]}
          </h1>
          <p
            className={cn(
              "mt-6 max-w-2xl text-base leading-7 text-black/70 sm:text-lg",
              selectableClass(selectedFieldId === "hero-body", previewMode),
            )}
            onClick={() => onSelectField?.("hero-body")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "hero-body", 20)}px`,
            }}
          >
            {textMap["hero-body"]}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#tour"
              onClick={(event) => {
                if (previewMode) {
                  event.preventDefault();
                  onSelectField?.("hero-cta");
                }
              }}
              className="inline-flex h-11 items-center rounded-full bg-black px-6 text-sm font-medium text-white transition hover:opacity-85"
            >
              <span
                className={selectableClass(selectedFieldId === "hero-cta", previewMode)}
                style={{
                  fontSize: `${getLandingFieldFontSize(textMap, "hero-cta", 14)}px`,
                }}
              >
                {textMap["hero-cta"]}
              </span>
            </a>
            <a
              href="#metodo"
              className="inline-flex h-11 items-center rounded-full border border-black/20 bg-white/70 px-6 text-sm font-medium text-black transition hover:bg-white"
            >
              Conoce nuestra vision
            </a>
          </div>
        </div>
        <aside className="grid gap-4 self-end rounded-3xl border border-black/10 bg-white/70 p-6 backdrop-blur sm:grid-cols-3 lg:grid-cols-1">
          {landingMetrics.map((metric) => (
            <div
              key={metric.label}
              className="border-b border-black/10 pb-4 last:border-b-0 last:pb-0"
            >
              <p className="text-3xl font-semibold tracking-tight">
                {metric.value}
              </p>
              <p className="mt-1 text-sm text-black/65">{metric.label}</p>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
