import Link from "next/link";

export default function ComunidadPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-12 px-6 py-16">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Seccion
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Comunidad</h1>
        <p className="text-lg text-muted-foreground">
          Creemos que la educacion es un proceso compartido.
        </p>
        <p className="text-lg text-muted-foreground">
          Niñas, niños, familias y colaboradores formamos un mismo organismo,
          donde cada parte influye en el desarrollo individual y colectivo. Por
          eso, el acompañamiento no ocurre solo dentro del espacio educativo,
          sino tambien en casa y en la relacion cotidiana.
        </p>
        <p className="text-lg text-muted-foreground">
          Ser parte de esta comunidad implica una participacion activa,
          consciente y comprometida.
        </p>
        <p className="text-lg text-muted-foreground">
          Ser parte de este espacio implica formar parte de una comunidad que
          aprende, se cuestiona y evoluciona.
        </p>
        <p className="text-lg text-muted-foreground">
          No buscamos familias perfectas, sino disponibles: a observar, a
          cuestionar, a aprender, a construir en conjunto y a participar.
        </p>
        <p className="text-lg text-muted-foreground">
          La coherencia no se exige, se construye.
        </p>
      </header>

      <section className="space-y-4">
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

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">
          Acompañamiento conjunto
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          El proceso de cada niñ@ es acompañado de manera cercana tambien con su
          familia.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Generamos espacios de seguimiento, comunicacion continua y acuerdos
          compartidos.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Cada niñ@ cuenta con un registro donde se documentan avances,
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

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">Corresponsabilidad</h2>
        <p className="text-base leading-7 text-muted-foreground">
          Entendemos la corresponsabilidad como la base de nuestra comunidad.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Las familias no son observadoras externas, sino parte activa del
          proceso. Esto implica sostener acuerdos, dar continuidad en casa a lo
          que se acompaña en la comunidad, participar en espacios de formacion y
          dialogo, y mantener una comunicacion abierta y respetuosa.
        </p>
        <p className="text-base leading-7 text-muted-foreground">
          Cuando existe coherencia entre casa y comunidad, las niñas y niños
          encuentran mayor seguridad, claridad y contencion para su desarrollo.
        </p>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">¿Como se ve en el organismo?</h3>
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

      <section className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">
          Escuela para familias
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          Contamos con un espacio de formacion y acompañamiento dirigido a
          madres y padres, con el objetivo de estar en sintonia en la forma de
          acompañar a las infancias.
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

      <section className="space-y-4">
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
