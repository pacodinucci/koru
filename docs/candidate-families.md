# Familias candidatas

Una familia candidata está por realizar una semana de prueba. Usa las mismas invitaciones y el mismo formulario familiar que una familia inscrita; no se crea un rol ni un cuestionario diferente.

## Desde el cuestionario inicial

1. Abrí el detalle de la solicitud en **Contactos**.
2. Seleccioná **Crear familia candidata**. Se muestra el correo ya registrado; no hace falta volver a ingresarlo.
3. Podés agregar un segundo email. Confirmá el alta para preparar las invitaciones.

El nombre y el correo de la solicitud original aparecen precargados. Podés corregirlos antes de crear la familia: se guardará el nombre elegido y se enviará la invitación al email confirmado, sin modificar la solicitud inicial ni sus respuestas. Se conserva su vínculo con la familia. Una solicitud no puede originar dos familias. Se requieren permisos para administrar contactos y familias.

## Alta desde Familias

- **Nueva familia → Familia** conserva el alta manual: ingresá el nombre y uno o dos emails distintos.
- **Nueva familia → Familia candidata** abre el diálogo adaptable existente y carga las solicitudes del cuestionario inicial que todavía no tienen una familia vinculada. Cada opción muestra el nombre del niño/a, los responsables y el email.
- Elegí una solicitud para confirmar el alta con el nombre y el email precargados y editables. Podés agregar un segundo email o volver a la lista para elegir otra solicitud. No se crean familias ni se envían invitaciones por el solo hecho de abrir el diálogo o seleccionar una opción.
- Después de crear correctamente la candidata, la solicitud deja de estar disponible para seleccionar. También se excluye si la familia ya se convirtió en regular. La solicitud y sus respuestas se conservan vinculadas; no se borran.
- Si falla la creación, la solicitud sigue disponible. Si la familia se creó pero el envío quedó pendiente, la solicitud ya no es seleccionable: los reintentos del correo se gestionan en Mailing, sin crear otra familia.

La lista se consulta nuevamente al abrir la opción y al volver desde la confirmación. Se muestran estados de carga, lista vacía y error con reintento. Para consultar y crear desde estas solicitudes se requieren permisos de administración de Familias y de consulta y administración de Contactos. El servidor vuelve a comprobar el vínculo y valida el nombre y los emails confirmados, incluso si la lista del navegador quedó desactualizada. Los emails deben ser válidos y distintos; los campos obligatorios vacíos se rechazan sin crear la familia ni enviar invitaciones.

## Datos ya informados en admisión

Cuando la familia está vinculada a una solicitud inicial, el primer registro de alumno precarga el nombre completo (separado provisionalmente en nombres y apellido, editable), la fecha de nacimiento y el contacto de los responsables. La ciudad de la solicitud se usa como valor inicial del perfil si todavía no hay una ciudad guardada. No se crean alumnos automáticamente ni se cambia la información original de admisión.

El cuestionario de ingreso recupera las respuestas equivalentes sobre relaciones, necesidades de acompañamiento, ritmo cotidiano, descripción del niño/a y motivación por Koru. Las demás respuestas iniciales quedan visibles en **Datos del formulario inicial**, sin pedir que se vuelvan a cargar. Las respuestas guardadas en el cuestionario tienen prioridad, incluso cuando la familia dejó un campo vacío deliberadamente. Si la familia borra y guarda la ciudad desde su perfil, también se respeta esa decisión: al recargar no se restaura la ciudad de admisión.

La precarga del cuestionario requiere que el nombre completo y la fecha de nacimiento del alumno coincidan con la solicitud vinculada. No se copian los datos de un hijo/a a sus hermanos ni se buscan solicitudes por email. Las familias sin solicitud vinculada conservan el circuito habitual. No se deducen alergias, medicación ni diagnósticos a partir de respuestas generales.

## Inscripción

Las candidatas aparecen con la etiqueta **Candidata**. Seleccioná **Convertir en familia** cuando se confirme la inscripción. La conversión conserva el mismo registro, sus integrantes, invitaciones, respuestas y movimientos; no vuelve a enviar invitaciones.

La condición de candidata es independiente de los estados activa, suspendida e inactiva. No hay conversión automática al cumplirse una semana. El alta y la conversión no generan cobros, registran pagos ni aplican créditos automáticamente.

## Preparación técnica

La migración aditiva `20261124120000_family_kind_and_admission_origin` agrega el tipo de familia y el vínculo único con la solicitud. Las familias existentes mantienen el tipo **Familia**. La migración debe aplicarse en el entorno de destino antes de ejecutar el código nuevo; no implica autorización para modificar una base de producción.

## Prueba SQL aislada

Se necesita PostgreSQL local (`initdb` y `pg_ctl` en PATH, o `PG_BINDIR` apuntando a su carpeta de binarios). El puerto `55553` debe estar libre. Desde un entorno de fixtures nuevo:

```sh
node scripts/prepare-candidate-family-e2e.mjs
TEST_DATABASE_URL=postgresql://candidate_test@127.0.0.1:55553/candidate_sql node tests/integration/candidate-family-sql-e2e.mjs
node scripts/prepare-candidate-family-e2e.mjs --stop
```

En PowerShell, asigná `$env:TEST_DATABASE_URL` antes de ejecutar la prueba. La preparación crea únicamente un clúster descartable dentro de `.tmp-admissions-e2e/candidates/infra`; rechaza reutilizar o resetear una carpeta de datos existente. El cierre detiene ese clúster y conserva sus archivos para inspección. No usa `DATABASE_URL` del entorno configurado para las conexiones de prueba.

La prueba SQL ejecuta la migración sobre el esquema anterior, las acciones y los servicios reales con Prisma. Comprueba invitaciones, correcciones del nombre y destinatario sin alterar el origen, rechazo sin cambios, concurrencia, rollback y conservación de relaciones al convertir. Autenticación y transporte de correo están simulados; esta prueba no sustituye el recorrido de navegador con sesión real.

## Evidencia del recorrido en navegador

El probe `tests/integration/candidate-family-browser-e2e.mjs` usa una aplicación local descartable en `127.0.0.1:3113`, la base `candidate_browser` y un transporte que captura las invitaciones sin salir a internet. El fixture local se preparó sin `.env` ni credenciales reales. Los archivos temporales de preparación, el guard de red, las capturas y los resultados se conservan en `.tmp-admissions-e2e/candidates/browser/` (ignorados por Git; no son una dependencia de producción).

Se comprobaron menú por teclado, alta regular y candidata, uno o dos destinatarios, aceptación simulada del correo, registro con el token recibido, acceso al cuestionario familiar existente, etiqueta y conversión, y alta desde Contactos con nombre/email precargados. Esa ejecución histórica comprobó el contrato anterior de sólo lectura; el probe actualizado permite editar esos campos y requiere una nueva ejecución para acreditar esa interacción. Se auditaron cinco invitaciones simuladas contra sus identificadores persistidos.

La prueba requiere un fixture recién preparado. Las opciones `CANDIDATE_BROWSER_RESUME=admission` y `CANDIDATE_BROWSER_RESUME=audit` son continuaciones acotadas sobre el mismo estado sintético: no repiten altas, registro ni conversión ya comprobados. Los resultados de una continuación no deben presentarse como una ejecución completa desde cero.

Las capturas solo contienen datos sintéticos. Después de verificar, se detuvieron tanto Next como PostgreSQL locales. La base real no recibió la migración y no se enviaron correos reales.
