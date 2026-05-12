export default function AdmisionesPage() {
  return (
    <main className="bg-white pb-16" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto w-full max-w-7xl space-y-10 px-6 pt-16 md:px-10 lg:space-y-12 lg:px-14 lg:pt-24">
        <header className="space-y-6">
          <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">ADMISIONES</p>

          <h1 className="space-y-1 text-5xl leading-[0.95] tracking-tight text-black md:text-6xl lg:text-7xl">
            <span
              className="block font-light"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              Queremos que cada familia
            </span>
            <span
              className="block italic"
              style={{ fontFamily: "var(--font-indie-flower)" }}
            >
              llegue con claridad y confianza
            </span>
          </h1>

        </header>
      </section>

      <section className="my-10 bg-[#f3f2ef] md:my-12 lg:my-16">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 md:py-16 lg:px-14 lg:py-20">
          <p
            className="max-w-5xl text-2xl leading-[1.3] text-black md:text-3xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Antes de iniciar, te invitamos a conocer cómo es el proceso de admisión para
            acompañar este paso de forma consciente, respetuosa y en sintonía con la comunidad.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-10 px-6 pt-10 md:px-10 lg:space-y-12 lg:px-14">
        <section className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <article className="space-y-4 rounded-2xl border border-black/10 p-6 lg:p-7">
            <p
              className="text-sm tracking-[0.14em] text-black/55"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              PASO 1
            </p>
            <h2 className="text-3xl leading-tight tracking-tight text-black md:text-[2rem]">
              Visita inicial
            </h2>
            <div className="space-y-3 text-base leading-7 text-black/75">
              <p>
                El proceso comienza con una visita familiar al espacio para conocer el ambiente,
                a los acompañantes y la propuesta de Koru.
              </p>
              <p>Es un primer encuentro para observar, preguntar y despejar dudas.</p>
            </div>
          </article>

          <article className="space-y-4 rounded-2xl border border-black/10 p-6 lg:p-7">
            <p
              className="text-sm tracking-[0.14em] text-black/55"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              PASO 2
            </p>
            <h2 className="text-3xl leading-tight tracking-tight text-black md:text-[2rem]">
              Días de prueba
            </h2>
            <div className="space-y-3 text-base leading-7 text-black/75">
              <p>
                En los primeros días, creamos un entorno de confianza y seguridad para facilitar
                la adaptación de cada niña o niño.
              </p>
              <p>
                La participación de madres, padres o tutores dentro del espacio no está prevista
                en esta etapa.
              </p>
            </div>
          </article>

          <article className="space-y-4 rounded-2xl border border-black/10 p-6 lg:p-7">
            <p
              className="text-sm tracking-[0.14em] text-black/55"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              PASO 3
            </p>
            <h2 className="text-3xl leading-tight tracking-tight text-black md:text-[2rem]">
              Documentación y cierre
            </h2>
            <div className="space-y-3 text-base leading-7 text-black/75">
              <p>
                Para confirmar el ingreso, se completa la documentación institucional y se
                formalizan inscripción, colegiatura y cuota de materiales.
              </p>
              <p>
                Incluye biografía, historia médica, autorizaciones, protocolos, contrato y
                compromiso de colaboración.
              </p>
            </div>
          </article>
        </section>
      </section>

    </main>
  );
}
