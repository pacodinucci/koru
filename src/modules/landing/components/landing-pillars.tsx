import { landingPillars } from "@/modules/landing/data/landing-content";

export function LandingPillars() {
  return (
    <section id="metodo" className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-[92rem] px-5 py-20 md:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-black/55">
            NUESTRA MIRADA
          </p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Nos nutrimos de pedagogias alternativas, crianza consciente y
            comunidad.
          </h2>
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
