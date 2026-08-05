const communityAgreements = [
  {
    title: "Participación activa de las familias",
    text: "Las familias forman parte esencial del proceso educativo. Participan en espacios de formación, acompañamiento y diálogo, dando continuidad en casa a lo que se vive en la comunidad.",
  },
  {
    title: "Comunicación consciente",
    text: "Nos relacionamos desde el respeto, la escucha y la honestidad. Buscamos comprender antes que reaccionar, y utilizamos herramientas como la Comunicación No Violenta para gestionar los conflictos.",
  },
  {
    title: "Respeto a los procesos individuales",
    text: "Reconocemos que cada niñ@ tiene su propio ritmo de desarrollo. Evitamos comparaciones y acompañamos desde la observación y la comprensión.",
  },
  {
    title: "Cuidado del entorno y de los espacios",
    text: "Todos somos responsables del cuidado de los espacios y de la naturaleza. Fomentamos prácticas conscientes como la separación de residuos, el uso responsable de recursos y el respeto por el entorno.",
  },
  {
    title: "Coherencia entre casa y comunidad",
    text: "Buscamos generar continuidad entre lo que se vive en la comunidad y en casa, sosteniendo acuerdos que brinden claridad y seguridad a las niñas y niños.",
  },
  {
    title: "Resolución consciente de conflictos",
    text: "Los conflictos son oportunidades de aprendizaje. Acompañamos los procesos con presencia, límites claros y herramientas que favorecen la comprensión y la reparación.",
  },
  {
    title: "Compromiso con el proceso",
    text: "Ser parte de la comunidad implica disposición para observar, aprender y participar activamente en el desarrollo individual y colectivo.",
  },
];

export default function AcuerdosComunidadPage() {
  return (
    <main className="bg-white pb-16" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 md:py-16 lg:px-14">
        <p className="mb-4 text-sm font-medium tracking-[0.18em] text-[#6d7e96]">
          COMUNIDAD
        </p>
        <h1
          className="max-w-4xl text-4xl leading-[1] tracking-tight text-black md:text-5xl lg:text-6xl"
          style={{ fontFamily: "var(--font-roboto-condensed)" }}
        >
          Acuerdos de la comunidad
        </h1>
        <p className="mt-5 max-w-4xl text-base leading-relaxed text-black/75 md:text-lg">
          Estos acuerdos son la base que nos permite sostener una comunidad viva,
          donde el aprendizaje, el cuidado y la convivencia se construyen entre todos.
        </p>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-6 pb-12 md:grid-cols-2 md:px-10 md:pb-16 lg:grid-cols-3 lg:px-14">
          {communityAgreements.map((agreement) => (
            <article
              key={agreement.title}
              className="rounded-2xl border border-black/10 bg-[#f7f6f1] p-5"
            >
              <h2
                className="text-2xl leading-tight text-black"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                {agreement.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-black/75 md:text-base">
                {agreement.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
