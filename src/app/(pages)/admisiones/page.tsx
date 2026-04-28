export default function AdmisionesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-6 py-16">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Seccion
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Admisiones</h1>
        <p className="text-lg text-muted-foreground">
          Gracias por su interes en unirse a KORU OSA. Antes de programar su
          visita, por favor revise detenidamente nuestro proceso de admision.
        </p>
      </header>

      <section className="space-y-6">
        <article className="space-y-3 rounded-md border p-5">
          <h2 className="text-2xl font-semibold">1. Visita nuestro espacio</h2>
          <p className="text-base leading-7 text-muted-foreground">
            El primer paso en el proceso de inscripcion de su hijo o hija
            comienza con una visita a KORU con su familia.
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            Esta es su oportunidad de conocer el espacio y a los acompañantes,
            informarse sobre nuestra comunidad y resolver dudas.
          </p>
        </article>

        <article className="space-y-3 rounded-md border p-5">
          <h2 className="text-2xl font-semibold">2. Dias de prueba</h2>
          <p className="text-base leading-7 text-muted-foreground">
            En ese primer contacto, el docente se encarga de transmitir al
            infante un ambiente de confianza, paz y seguridad.
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            En esta semana no se les permite a los padres, madres o tutores
            compartir espacio con el infante.
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            Se necesita que 4 o 5 dias antes se le estimule al infante,
            brindandole palabras de tranquilidad para esa primera separacion
            del niño/a con el adulto.
          </p>
        </article>

        <article className="space-y-3 rounded-md border p-5">
          <h2 className="text-2xl font-semibold">
            3. Formularios y protocolos de admision
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Se le solicitara el pago de inscripcion, colegiatura y cuota de
            materiales.
          </p>
          <p className="text-base leading-7 text-muted-foreground">
            A su vez, debera completar los formularios de Biografia del Niño,
            Historia Medica, Autorizacion, protocolos, contrato y Compromiso de
            Colaboracion.
          </p>
        </article>
      </section>
    </main>
  );
}
