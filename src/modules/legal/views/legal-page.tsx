import type { ReactNode } from "react";

type LegalSection = {
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

const supportEmail = "direccion@koru.com.mx";

export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
      <article className="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-medium text-emerald-800">Koru</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-700">{intro}</p>
        <p className="mt-4 text-sm text-slate-500">Última actualización: 14 de septiembre de 2026.</p>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
              <div className="mt-3 space-y-4 text-base leading-7 text-slate-700">{section.content}</div>
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-slate-200 pt-7">
          <h2 className="text-xl font-semibold text-slate-950">Contacto</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Para consultas sobre estas condiciones o sobre el tratamiento de datos, escribinos a{" "}
            <a className="font-medium text-emerald-800 underline underline-offset-4" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
