const admissionSteps = [
  {
    eyebrow: "Cuestionario inicial",
    title: "1er contacto",
    items: [
      "La familia llena un primer cuestionario con información general.",
      "Se agenda cita para conocer el espacio.",
    ],
  },
  {
    eyebrow: "Conocer el espacio",
    title: "Conocer",
    items: [
      "La familia conoce el espacio físico y profundiza en dudas.",
      "Se agenda semana de prueba.",
      "Se proporciona propuesta con cuotas.",
      "Se paga semana de prueba.",
    ],
  },
  {
    eyebrow: "Semana de prueba",
    title: "Conectar",
    items: [
      "Se completa 2do cuestionario sobre él/la niñ@.",
      "Durante esta semana: evaluación diagnóstica en lectura y matemáticas.",
      "Evaluación psicopedagógica.",
      "Observaciones generales de ambos lados.",
      "Se agenda cita de retroalimentación.",
    ],
  },
  {
    eyebrow: "Retroalimentación",
    title: "Profundizar",
    items: [
      "Se hace entre tutor y coordinador psicopedagógico.",
      "Se entregan resultados de evaluaciones y recibe retroalimentación en ambas direcciones.",
      "Se decide si desea continuar con inscripción.",
    ],
  },
  {
    eyebrow: "Inscripción",
    title: "Confirmar",
    items: [
      "Se hace el pago de inscripción.",
      "Se llenan y firman formatos de admisión.",
    ],
  },
];

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
            Gracias por su interés en unirse KORU OSA. Antes de programar su visita,
            por favor revise detenidamente nuestro proceso de admisión.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pt-10 md:px-10 lg:px-14">
        <div className="rounded-[2rem] bg-[#f8ead8] px-5 py-10 shadow-sm md:px-8 lg:px-10 lg:py-14">
          <header className="max-w-3xl space-y-3 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6d7e45]">
              Inscripciones 2026–2027
            </p>
            <h2
              className="text-4xl font-semibold leading-tight text-[#55764d] md:text-5xl"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              Proceso para nuevas familias
            </h2>
          </header>

          <div className="relative mt-12 md:mx-auto md:mt-16 md:max-w-5xl">
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-5 top-0 w-px bg-[#a9b16a] md:left-1/2 md:-translate-x-1/2"
            />

            <ol className="relative space-y-8 md:space-y-0">
              {admissionSteps.map((item, index) => (
                <li
                  key={item.eyebrow}
                  className={`relative pl-14 md:grid md:grid-cols-[1fr_4rem_1fr] md:gap-6 md:pl-0 ${
                    index !== 0 ? "md:-mt-2" : ""
                  }`}
                >
                  <div
                    className={`rounded-2xl border border-[#55764d]/15 bg-white/70 p-5 shadow-sm md:p-6 ${
                    index % 2 === 0 ? "md:col-start-3" : "md:col-start-1 md:text-right"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9f9b35]">
                      {item.eyebrow}
                    </p>
                    <h3
                      className="mt-2 text-3xl font-semibold leading-none text-[#55764d]"
                      style={{ fontFamily: "var(--font-roboto-condensed)" }}
                    >
                      {item.title}
                    </h3>
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-[#486141] md:text-base">
                      {item.items.map((text) => (
                        <li
                          key={text}
                          className={`flex gap-2 ${
                            index % 2 === 0 ? "" : "md:flex-row-reverse"
                          }`}
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#55764d]" />
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="absolute left-5 top-6 z-10 -translate-x-1/2 md:static md:col-start-2 md:row-start-1 md:flex md:translate-x-0 md:items-start md:justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8ead8] ring-4 ring-[#f8ead8]">
                      <span className="h-4 w-4 rounded-full bg-[#6d7e45]" />
                    </div>
                  </div>

                  <div
                    aria-hidden="true"
                    className={`hidden md:row-start-1 md:block ${
                      index % 2 === 0 ? "md:col-start-1" : "md:col-start-3"
                    }`}
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
