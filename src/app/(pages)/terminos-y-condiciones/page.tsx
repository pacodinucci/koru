import { LegalPage } from "@/modules/legal/views/legal-page";

export default function TerminosYCondicionesPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      intro="Estos términos regulan el acceso y uso de la plataforma Koru. Al usarla, aceptás estas condiciones."
      sections={[
        {
          title: "Uso de Koru",
          content: (
            <>
              <p>Koru ofrece herramientas para organizar y gestionar actividades de su comunidad. Debés usar la plataforma de manera lícita, responsable y conforme a estos términos.</p>
              <p>Sos responsable de mantener la confidencialidad de tus credenciales y de la información que cargás desde tu cuenta.</p>
            </>
          ),
        },
        {
          title: "Google Calendar",
          content: (
            <>
              <p>La integración con Google Calendar es opcional. Al conectarla, autorizás a Koru a sincronizar los eventos confirmados de Koru con el calendario de Google que elijas.</p>
              <p>Podés desactivar la integración en cualquier momento. También podés revocar el permiso desde tu cuenta de Google.</p>
            </>
          ),
        },
        {
          title: "Disponibilidad y cambios",
          content: (
            <>
              <p>Trabajamos para que Koru esté disponible y funcione correctamente, pero no garantizamos que el servicio sea ininterrumpido o esté libre de errores en todo momento.</p>
              <p>Podemos modificar, mejorar o discontinuar funciones cuando sea necesario. Si un cambio relevante afecta el uso del servicio, lo comunicaremos por los medios disponibles.</p>
            </>
          ),
        },
        {
          title: "Contenido y propiedad intelectual",
          content: <p>La marca, el diseño, el software y los contenidos de Koru están protegidos por la normativa aplicable. No podés copiarlos, modificarlos o usarlos fuera de los fines permitidos sin autorización.</p>,
        },
        {
          title: "Suspensión y actualizaciones",
          content: (
            <>
              <p>Podemos suspender o limitar el acceso cuando detectemos un uso indebido, un riesgo de seguridad o un incumplimiento de estos términos.</p>
              <p>Estos términos pueden actualizarse. La versión vigente siempre estará publicada en esta página.</p>
            </>
          ),
        },
      ]}
    />
  );
}
