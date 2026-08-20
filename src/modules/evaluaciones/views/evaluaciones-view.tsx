import Image from "next/image";
import { EcocycleSpiral } from "@/modules/evaluaciones/views/ecocycle-spiral";

const evaluationIntroParagraphs = [
  "En Koru entendemos la evaluación como un proceso integral, a través de la observación, registro y el compartir de los procesos, de manera que la evaluación sea un acompañamiento continuo y visible.",
  "El seguimiento consiste en observar y acompañar el progreso del aprendiz en su día a día. Es un proceso continuo que se da en la interacción constante entre aprendices y maestro/as.",
  "La evaluación parte de la lista de las habilidades personales, éstas abarcan las áreas fundamentales del ser: el cuerpo, autoconocimiento, sociales, comunicación, aprendizaje y se desarrollan según las etapas evolutivas.",
  "Se celebran los logros y se trazan nuevas rutas de aprendizaje basadas en el registro del desarrollo. Responde a la pregunta “¿Qué podemos mejorar en el acompañamiento con este niño o niña?”, mostrando avances, identificando aspectos por mejorar y ofreciendo información valiosa para la toma de decisiones. Es el puente que conecta la evaluación con la acción, y convierte el aprendizaje en algo visible y significativo para todos.",
];

const evaluationActions = [
  "Reconocer avances y fortalezas",
  "Identificar áreas de oportunidad",
  "Ajustar el acompañamiento",
  "Trazar nuevas rutas de desarrollo",
];

const familyFollowUp = [
  "Espacios de seguimiento",
  "Comunicación continua",
  "Acuerdos compartidos",
];

const ecoCycleStages = [
  {
    title: "Semilla",
    text: "El potencial comienza a emerger. Está presente, aunque aún de forma incipiente.",
  },
  {
    title: "Brote",
    text: "El potencial se expresa de manera más constante y en distintos contextos.",
  },
  {
    title: "Árbol",
    text: "El potencial ha madurado y se manifiesta de forma integrada en diferentes áreas de la vida.",
  },
  {
    title: "Fuego",
    text: "El potencial entra en una fase de transformación, donde necesita renovarse para seguir evolucionando.",
  },
];

const ecoCycleIntroParagraphs = [
  "Utilizamos el Ecociclo como una herramienta para comprender y comunicar el desarrollo de cada niñ@ de forma integral.",
  "A diferencia de los sistemas tradicionales, el Ecociclo no mide desde la comparación, sino que reconoce el desarrollo como un proceso continuo, dinámico y en constante transformación.",
  "Este modelo permite ubicar los distintos potenciales del niñ@ dentro de un proceso evolutivo, entendiendo que cada aspecto del desarrollo tiene su propio ritmo.",
  "El Ecociclo cuenta también con una sección escrita en la que se escribe un breve párrafo justificando la posición de cada potencial personal o de carácter.",
];
const communityParagraphs = [
  "El acompañamiento que ofrecemos a las niñas y niños parte de un principio fundamental: quienes acompañamos también estamos en constante aprendizaje.",
  "Por ello, sostenemos prácticas de evaluación y reflexión continua que nos permiten revisar, ajustar y enriquecer nuestra labor pedagógica y comunitaria.",
  "Fomentamos una cultura de retroalimentación basada en los principios de la Comunicación NoViolenta.",
  "A través de espacios de observación entre pares y acompañamiento pedagógico, el equipo comparte miradas, se escucha y se nutre, fortaleciendo la coherencia y la calidad del acompañamiento.",
  "Entendemos la comunidad como un sistema vivo en constante evolución. Así como acompañamos el desarrollo de cada niñ@, también observamos y ajustamos el funcionamiento del equipo, la relación con las familias y la dinámica comunitaria en su conjunto.",
];

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="max-w-4xl space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6d7e96]">
        {eyebrow}
      </p>
      <h2
        className="text-[clamp(2.35rem,7vw,4.5rem)] leading-[0.95] tracking-tight text-black"
        style={{ fontFamily: "var(--font-roboto-condensed)" }}
      >
        {title}
      </h2>
    </header>
  );
}

function OrganicImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[22rem] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}

const organicPillStyles = [
  "border-[color-mix(in_srgb,var(--complement-800)_38%,white)] bg-[color-mix(in_srgb,var(--complement-700)_28%,white)] rounded-[48%_52%_45%_55%/58%_42%_58%_42%]",
  "border-[color-mix(in_srgb,var(--orange-500)_30%,white)] bg-[color-mix(in_srgb,var(--orange-500)_14%,white)] rounded-[54%_46%_58%_42%/44%_56%_44%_56%]",
  "border-[color-mix(in_srgb,var(--brand-700)_24%,white)] bg-[color-mix(in_srgb,var(--orange-500)_20%,white)] rounded-[52%_48%_43%_57%/47%_55%_45%_53%]",
  "border-[color-mix(in_srgb,var(--orange-500)_70%,white)] bg-[color-mix(in_srgb,var(--orange-500)_58%,white)] rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
];

function PillList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {items.map((item, index) => (
        <li
          key={item}
          className={`flex min-h-[3.5rem] items-center border px-6 py-3.5 text-center text-sm font-semibold text-[var(--complement-800)] shadow-sm ${organicPillStyles[index % organicPillStyles.length]}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function EvaluacionesView() {
  return (
    <main className="bg-[#f7f6f1]" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:px-14 lg:py-20">
        <div className="space-y-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6d7e96]">
            Conocer más
          </p>
          <h1
            className="text-[clamp(3rem,9vw,6rem)] leading-[0.9] tracking-tight text-black"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Evaluación como acompañamiento visible
          </h1>
          <div className="space-y-4 text-lg leading-relaxed text-black/80 md:text-xl">
            {evaluationIntroParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <OrganicImage
          src="/assets/images/DSC01386.png"
          alt="Acompañante registrando procesos de aprendizaje"
        />
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)] lg:px-14 lg:pb-10 lg:pt-20">
          <OrganicImage
            src="/assets/images/DSC01379.png"
            alt="Niñez trabajando con herramientas de seguimiento"
          />
          <div className="space-y-7">
            <SectionTitle eyebrow="Evaluación a aprendices" title="Comprender el proceso para acompañar mejor" />
            <div className="space-y-4 text-base leading-relaxed text-black/80 md:text-lg">
              <p>
                Entendemos la evaluación como un proceso continuo de crecimiento, y auto-observación, no como un momento aislado, ni como una definición.
              </p>
              <p>
                Observamos, registramos y compartimos el proceso de cada niñ@, haciendo visible su desarrollo en distintas dimensiones: corporal, emocional, social, cognitiva y de autogestión.
              </p>
              <p>
                Este seguimiento se construye en el día a día, a través de la interacción, la observación y el vínculo del acompañante con l@s niñ@s.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl space-y-7 px-6 pb-12 md:px-10 md:pb-16 lg:px-14 lg:pb-20">
          <div className="space-y-3 rounded-[2rem] bg-[#f7f6f1] p-6">
            <h3 className="text-xl font-semibold text-black">La evaluación nos permite</h3>
            <PillList items={evaluationActions} />
          </div>
          <div className="space-y-4 text-base leading-relaxed text-black/80 md:text-lg">
            <p>
              Más que emitir juicios, buscamos comprender el proceso y generar acciones que apoyen el crecimiento de cada niñ@.
            </p>
            <p>
              El proceso de cada niñ@ es acompañado de manera cercana también con su familia.
            </p>
          </div>
          <div className="space-y-3 rounded-[2rem] border border-complement-600 bg-white/80 p-6">
            <h3 className="text-xl font-semibold text-black">Generamos</h3>
            <PillList items={familyFollowUp} />
            <p className="text-base leading-relaxed text-black/75">
              Cada niñ@ cuenta con un registro donde se documentan avances, procesos y acuerdos, permitiendo que las familias estén informadas y puedan dar continuidad desde casa.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-10 px-6 py-12 md:px-10 md:py-16 lg:px-14 lg:py-20">
        <SectionTitle eyebrow="Nuestra herramienta de evaluación" title="El Ecociclo como mapa de desarrollo" />
        <div className="max-w-4xl space-y-4 text-base leading-relaxed text-black/80 md:text-lg">
          {ecoCycleIntroParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <EcocycleSpiral stages={ecoCycleStages} />
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:px-14 lg:py-20">
          <div className="space-y-7">
            <SectionTitle eyebrow="Evaluación entre colaboradores y familias" title="Una comunidad que también se observa" />
            <div className="space-y-4 text-base leading-relaxed text-black/80 md:text-lg">
              {communityParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <OrganicImage
            src="/assets/images/DSC01384.png"
            alt="Comunidad educativa compartiendo acompañamiento"
          />
        </div>
      </section>
    </main>
  );
}
