import type { LandingTextMap } from "@/modules/landing/types/landing-text";

type LandingCommunityProps = {
  textMap: LandingTextMap;
};

export function LandingCommunity({ textMap }: LandingCommunityProps) {
  return (
    <section id="comunidad" className="flex min-h-screen items-center">
      <div className="mx-auto grid w-full max-w-400 gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <div className="rounded-3xl border border-black/10 bg-[#f8f7f2] p-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-black/55">
            KORU ES
          </p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {textMap["community-title"]}
          </h2>
          <p className="mt-5 max-w-2xl leading-7 text-black/75">
            {textMap["community-body"]}
          </p>
        </div>
        <div
          id="tour"
          className="rounded-3xl bg-black p-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        >
          <p className="text-xs font-semibold tracking-[0.2em] text-white/60">
            SUMATE A KORU OSA
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            {textMap["community-card-title"]}
          </h3>
          <p className="mt-4 leading-7 text-white/75">
            {textMap["community-card-body"]}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:hola@koru.academy"
              className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-white/85"
            >
              Contacto
            </a>
            <a
              href="/sign-in"
              className="inline-flex h-10 items-center rounded-full border border-white/30 px-5 text-sm font-medium transition hover:bg-white/10"
            >
              Acceso admin
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
