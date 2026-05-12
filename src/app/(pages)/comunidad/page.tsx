import Image from "next/image";
import Link from "next/link";

export default function ComunidadPage() {
  return (
    <main className="space-y-12 bg-white pb-16" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section
        id="nuestra-comunidad"
        className="mx-auto w-full max-w-7xl scroll-mt-36 space-y-10 px-6 md:px-10 lg:px-14 pt-16 lg:space-y-12 lg:pt-24"
      >
        <div className="space-y-6">
          <p className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]">
            COMUNIDAD
          </p>

          <h1 className="space-y-1 text-5xl leading-[0.95] tracking-tight text-black md:text-6xl lg:text-7xl">
            <span
              className="block font-light"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              Creemos que la educación
            </span>
            <span
              className="block italic"
              style={{ fontFamily: "var(--font-indie-flower)" }}
            >
              es un proceso compartido
            </span>
          </h1>

        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-3xl space-y-6 text-xl leading-relaxed text-black/85">
            <p>
              Niñas, niños, familias y colaboradores formamos un mismo
              organismo, donde cada parte influye en el desarrollo individual y
              colectivo. Por eso, el acompañamiento no ocurre sólo dentro del
              espacio educativo, sino también en casa y en la relación
              cotidiana.
            </p>
            <p>
              Ser parte de esta comunidad implica una participación activa y
              comprometida.
            </p>
            <p>
              Ser parte de este espacio implica formar parte de una comunidad
              que aprende, se cuestiona y evoluciona.
            </p>
            <div className="space-y-3">
              <p>No buscamos familias perfectas, sino disponibles a:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>cuestionar</li>
                <li>aprender</li>
                <li>construir en conjunto</li>
                <li>participar</li>
              </ul>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[28rem] lg:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
              <Image
                src="/assets/img7.jpg"
                alt="Comunidad Koru compartiendo actividades"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-4 px-6 md:px-10 lg:px-14">
        <h2 className="text-3xl font-semibold tracking-tight">El dia a dia</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Placeholder: poner fotos del dia a dia y de eventos.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Placeholder: incluir ritmos (con enlace al ritmo de cada grupo) para
          que personas externas puedan darse una idea de como se vive la
          comunidad.
        </p>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-4 px-6 md:px-10 lg:px-14">
        <h2 className="text-3xl font-semibold tracking-tight">
          AcompaÃ±amiento conjunto
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          El proceso de cada niÃ±@ es acompaÃ±ado de manera cercana tambien con su
          familia.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Generamos espacios de seguimiento, comunicacion continua y acuerdos
          compartidos.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Cada niÃ±@ cuenta con un registro donde se documentan avances,
          procesos y acuerdos, permitiendo que las familias esten informadas y
          puedan dar continuidad desde casa.
        </p>
        <div className="pt-1">
          <Link
            href="/sign-in"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Log In (para entrar)
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-4 px-6 md:px-10 lg:px-14">
        <h2 className="text-3xl font-semibold tracking-tight">Corresponsabilidad</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Entendemos la corresponsabilidad como la base de nuestra comunidad.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Las familias no son observadoras externas, sino parte activa del
          proceso. Esto implica sostener acuerdos, dar continuidad en casa a lo
          que se acompaÃ±a en la comunidad, participar en espacios de formacion y
          dialogo, y mantener una comunicacion abierta y respetuosa.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Cuando existe coherencia entre casa y comunidad, las niÃ±as y niÃ±os
          encuentran mayor seguridad, claridad y contencion para su desarrollo.
        </p>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Â¿Como se ve en el organismo?</h3>
          <ul className="list-disc space-y-1 pl-6 text-base text-muted-foreground">
            <li>Asambleas comunitarias</li>
            <li>Escuela para Familias</li>
            <li>Talleres introductorios</li>
            <li>Tequios</li>
            <li>Citas de seguimiento</li>
            <li>Enlace de la carta compromiso que se firma al entrar</li>
          </ul>
        </div>
      </section>

      <section
        id="escuela-para-familias"
        className="mx-auto w-full max-w-7xl scroll-mt-36 space-y-4 px-6 md:px-10 lg:px-14"
      >
        <h2 className="text-3xl font-semibold tracking-tight">
          Escuela para familias
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          Contamos con un espacio de formacion y acompaÃ±amiento dirigido a
          madres y padres, con el objetivo de estar en sintonia en la forma de
          acompaÃ±ar a las infancias.
        </p>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Talleres introductorios obligatorios</h3>
          <ul className="list-disc space-y-1 pl-6 text-base text-muted-foreground">
            <li>Comunicacion No Violenta</li>
            <li>Etapas evolutivas</li>
            <li>Ambos incluidos en su cuota de inscripcion</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Talleres y charlas</h3>
          <p className="text-base leading-7 text-muted-foreground">
            Se realizan encuentros dos veces al mes con temas como gestion
            emocional, retos cotidianos en la crianza, construccion de acuerdos,
            educacion sexual y retos de cada etapa.
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            Estos talleres pueden tener costo extra.
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            Ademas de contenido, estos espacios permiten compartir experiencias,
            reflexionar y generar herramientas practicas para la vida diaria.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="#"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Calendario (temas, fechas y costos)
          </a>
          <Link
            href="/blog"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Blog (videos y articulos)
          </Link>
        </div>
      </section>

      <section
        id="unete-al-equipo"
        className="mx-auto w-full max-w-7xl scroll-mt-36 space-y-4 px-6 md:px-10 lg:px-14"
      >
        <h2 className="text-3xl font-semibold tracking-tight">Ãšnete al equipo</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Si querÃ©s sumarte a Koru, escribinos para conocer bÃºsquedas abiertas
          y prÃ³ximos procesos de selecciÃ³n.
        </p>
        <Link
          href="/admisiones"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Quiero sumarme
        </Link>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-4 px-6 md:px-10 lg:px-14">
        <h2 className="text-3xl font-semibold tracking-tight">
          Protocolos y cuidado
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          Para sostener un entorno seguro y coherente, contamos con protocolos
          claros que forman parte del funcionamiento de la comunidad.
        </p>
        <ul className="list-disc space-y-1 pl-6 text-base text-muted-foreground">
          <li>Resolucion de conflictos</li>
          <li>Prevencion y manejo de enfermedades</li>
          <li>Protocolos de higiene (como prevencion de piojos)</li>
          <li>Atencion a emergencias</li>
        </ul>
        <p className="text-base leading-7 text-muted-foreground">
          Estos lineamientos permiten cuidar el bienestar individual y
          colectivo, generando claridad y confianza para todas las familias.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="#"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Ver protocolo: conflictos
          </a>
          <a
            href="#"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Ver protocolo: enfermedades
          </a>
          <a
            href="#"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Ver protocolo: higiene
          </a>
          <a
            href="#"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Ver protocolo: emergencias
          </a>
        </div>
      </section>
    </main>
  );
}



