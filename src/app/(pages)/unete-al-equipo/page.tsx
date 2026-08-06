import Link from "next/link";

import { TeamApplicationForm } from "../comunidad/team-application-form";

export default function UneteAlEquipoPage() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 lg:px-14"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          href="/contacto"
          className="inline-flex text-sm font-semibold uppercase tracking-[0.18em] text-[var(--complement-800)] transition hover:text-[var(--complement-900)]"
        >
          Volver a contacto
        </Link>

        <div className="space-y-3">
          <h1 className="text-4xl tracking-tight md:text-5xl">Únete al equipo</h1>
          <p className="text-base leading-relaxed text-black/75 md:text-lg">
            Si querés aplicar para trabajar en KORU, completá el formulario y
            contanos sobre tu experiencia, tu área de interés y tu motivación
            para formar parte de la comunidad.
          </p>
        </div>

        <TeamApplicationForm />
      </div>
    </main>
  );
}
