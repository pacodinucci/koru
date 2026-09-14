import { LegalPage } from "@/modules/legal/views/legal-page";

export default function PoliticaDePrivacidadPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro="Esta política explica cómo Koru trata la información personal cuando usás nuestra plataforma y, de forma opcional, conectás tu cuenta de Google Calendar."
      sections={[
        {
          title: "Información que tratamos",
          content: (
            <>
              <p>
                Tratamos los datos necesarios para crear y administrar tu cuenta en Koru, como tu nombre, correo electrónico y la información que ingresás en la plataforma.
              </p>
              <p>
                Si conectás Google Calendar, Koru solicita permiso para crear, actualizar y eliminar en tu calendario los eventos confirmados desde Koru. Para esa sincronización podemos tratar el título, descripción, ubicación, fecha y horario de esos eventos, junto con los identificadores técnicos necesarios para mantenerlos actualizados.
              </p>
            </>
          ),
        },
        {
          title: "Cómo usamos la información",
          content: (
            <>
              <p>Usamos la información para operar Koru, brindar las funciones que solicitás, mantener la seguridad de las cuentas y responder consultas de soporte.</p>
              <p>
                La conexión con Google Calendar se usa únicamente para sincronizar eventos confirmados de Koru con el calendario que autorizaste. Koru no utiliza los datos de Google Calendar para publicidad ni los vende a terceros.
              </p>
            </>
          ),
        },
        {
          title: "Acceso a Google Calendar",
          content: (
            <>
              <p>
                La conexión es voluntaria y se habilita solo después de que otorgás tu consentimiento en la pantalla de autorización de Google. Podés revocar el acceso desde Koru o desde la configuración de seguridad de tu cuenta de Google.
              </p>
              <p>
                Al desconectar Google Calendar, Koru desactiva la sincronización y elimina del calendario conectado los eventos que hubiera creado mediante esta integración. Los datos propios de Koru se conservan mientras sean necesarios para prestar el servicio o cumplir obligaciones aplicables.
              </p>
            </>
          ),
        },
        {
          title: "Compartición y seguridad",
          content: (
            <>
              <p>
                Solo compartimos información con Google cuando autorizás la integración, con proveedores que nos ayudan a operar la plataforma bajo obligaciones de confidencialidad, o cuando una obligación legal lo exige.
              </p>
              <p>Aplicamos medidas técnicas y organizativas razonables para proteger la información. Ningún sistema puede garantizar seguridad absoluta.</p>
            </>
          ),
        },
        {
          title: "Tus derechos y cambios",
          content: (
            <>
              <p>Podés solicitar acceso, corrección, actualización o eliminación de tus datos personales mediante nuestro canal de contacto.</p>
              <p>Podemos actualizar esta política si cambia el servicio o la normativa aplicable. Publicaremos la versión vigente en esta página.</p>
            </>
          ),
        },
      ]}
    />
  );
}
