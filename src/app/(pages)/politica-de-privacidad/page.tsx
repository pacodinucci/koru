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
                Si conectás Google Calendar, tratamos los datos estrictamente necesarios para la sincronización: el permiso de autorización, los identificadores técnicos de sincronización y el título, descripción, ubicación, fecha y horario de los eventos de Koru que se sincronizan.
              </p>
            </>
          ),
        },
        {
          title: "Datos de Google Calendar",
          content: (
            <>
              <p>
                La conexión con Google Calendar es voluntaria. Con tu autorización, Koru únicamente crea, actualiza o elimina en tu calendario principal los eventos generados por Koru para los que confirmaste asistencia o inscripción.
              </p>
              <p>
                Koru no importa, lista, analiza ni modifica eventos preexistentes de tu Google Calendar. Tampoco utiliza datos de Google Calendar para publicidad, perfiles comerciales ni finalidades ajenas a la sincronización que solicitaste.
              </p>
            </>
          ),
        },
        {
          title: "Cómo usamos la información",
          content: (
            <>
              <p>
                Usamos la información para operar Koru, brindar las funciones que solicitás, mantener la seguridad de las cuentas y responder consultas de soporte.
              </p>
              <p>
                Los datos de Google Calendar se usan exclusivamente para crear, mantener actualizados o eliminar los eventos de Koru sincronizados con el calendario que autorizaste.
              </p>
            </>
          ),
        },
        {
          title: "Compartición y divulgación de datos",
          content: (
            <>
              <p>
                No vendemos, alquilamos ni transferimos datos de Google Calendar a terceros para publicidad, análisis comercial, elaboración de perfiles o reventa de información.
              </p>
              <p>
                Solo compartimos información con Google para ejecutar la integración que autorizaste, con proveedores indispensables para alojar, operar o proteger Koru bajo obligaciones de confidencialidad y seguridad, o cuando una obligación legal aplicable lo requiera. No permitimos que personas accedan al contenido de Google Calendar salvo que sea necesario para soporte solicitado por vos, seguridad o cumplimiento legal.
              </p>
            </>
          ),
        },
        {
          title: "Seguridad y conservación",
          content: (
            <>
              <p>
                Protegemos los tokens de autorización de Google mediante cifrado cuando se almacenan y limitamos su uso a los servicios de Koru necesarios para ejecutar la sincronización. Aplicamos controles de acceso y medidas técnicas y organizativas razonables para prevenir el acceso, alteración, pérdida o divulgación no autorizados.
              </p>
              <p>
                Conservamos los datos propios de Koru mientras sean necesarios para prestar el servicio o cumplir obligaciones aplicables. Conservamos los identificadores técnicos de sincronización mientras la conexión permanezca activa o sea necesaria para gestionar correctamente los eventos creados por Koru.
              </p>
            </>
          ),
        },
        {
          title: "Control del usuario y tus derechos",
          content: (
            <>
              <p>
                Podés desconectar Google Calendar desde Koru o revocar el acceso desde la configuración de seguridad de tu cuenta de Google. Al desconectar la integración, Koru detiene la sincronización y elimina del calendario conectado los eventos que hubiera creado mediante esta integración.
              </p>
              <p>
                Podés solicitar acceso, corrección, actualización o eliminación de tus datos personales mediante nuestro canal de contacto. Podemos actualizar esta política si cambia el servicio o la normativa aplicable; publicaremos la versión vigente en esta página.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
