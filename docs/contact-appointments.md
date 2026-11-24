# Citas desde Contactos

Admin y Superadmin pueden enviar **una invitación de Google Calendar** a un contacto de **Cuestionario inicial** desde **Agendar cita**, a la derecha de **Detalle del contacto**. Se conserva el permiso `contacts.manage`; otros roles y el formulario de contacto común no pueden enviar invitaciones.

## Flujo nativo

1. Revisar el correo del contacto, elegir duración (30 minutos por defecto), modalidad, lugar/enlace y **un solo** día y hora. No hay varias opciones ni página de elección de horarios para las invitaciones nuevas.
2. Revisar el resumen y pulsar **Enviar invitación de Google Calendar**. La familia recibe dos correos: la invitación nativa de Google Calendar desde la cuenta conectada del administrador que agenda, y un correo informativo de Koru mediante Resend, con el remitente configurado en `MAIL_FROM`. El correo de Koru explica el propósito de la visita, incluye fecha, duración, modalidad, lugar/enlace y mensaje del organizador; indica que la asistencia se confirma aceptando la invitación separada de Google. No envía otro correo al administrador ni cambia el organizador del evento.
   El correo de Koru se intenta después de verificar que existe el evento en Google, incluso al recuperar un envío incierto. Si Resend falla, la reserva y la invitación nativa se conservan y se muestra una advertencia; **Actualizar respuesta** reintenta el correo informativo sin recrear el evento. Una actualización normal de RSVP no vuelve a enviarlo. Los reintentos usan la misma clave de idempotencia de Resend (sujeta a la ventana de retención del proveedor).
3. El estado se consulta con **Actualizar respuesta**. Se muestra la última respuesta observada: `needsAction` sigue pendiente, `tentative` queda reservado y se muestra como tentativo, `accepted` confirma y `declined` retira la invitación de Google y luego libera el horario. Si Google no confirma la cancelación, la reserva se conserva hasta reintentar con **Actualizar respuesta**.
4. El administrador que envió la invitación puede **Actualizar respuesta** y **Cancelar cita**, incluso si la cita ya está confirmada. Otros administradores con permiso solo ven el estado.

Las invitaciones nuevas no vencen a las 48 horas: la reserva termina al terminar la cita, al cancelarla o cuando la familia la rechaza. La UI no muestra etiquetas de zona horaria; los horarios se capturan y se guardan con la conversión interna de **Ciudad de México (`America/Mexico_City`)**.

Google decide cuándo la invitación aparece en el calendario del invitado, según la configuración de su cuenta y su cliente de correo/calendario. Koru no escribe en el calendario de la familia por su cuenta ni puede garantizarlo. La vista tampoco promete notificaciones en tiempo real: el estado solo refleja la última consulta explícita, y si todavía no hay respuesta se advierte en lugar de afirmar que la invitación se entregó.

## Conexión de Google Calendar

Enviar requiere que el organizador tenga su cuenta de Google Calendar conectada. Si el estado de la conexión falta, expiró o fue revocado, el envío queda bloqueado sin estado ficticio de "enviada" y la vista ofrece el acceso a la configuración existente del proyecto en `/calendario`.

## Invitaciones anteriores

Las invitaciones creadas antes de este cambio (correo electrónico con enlace personal y hasta tres horarios) siguen funcionando como hasta ahora: reserva de 48 horas, **Reenviar invitación/confirmación**, **Cancelar invitación** y la página pública `/citas/{token}` sin inicio de sesión. No se convierten ni se reinterpretan; sin el campo `provider` se asumen por correo.

## Reservas

- Las invitaciones por correo bloquean la misma agenda de entrevistas de admisión durante **48 horas desde el envío inicial**. Se rechazan superposiciones, incluso entre contactos diferentes.
- Las invitaciones nativas reservan un único intervalo hasta la cita, su cancelación o el rechazo de la familia.
- Confirmar conserva solo el intervalo elegido; rechazar, cancelar o vencer libera todos los intervalos.
- Reenviar (solo invitaciones por correo) no extiende el vencimiento. Una confirmación repetida no genera otra cita.
- La expiración de las invitaciones por correo se evalúa al consultar/operar, sin depender de un cron. Un envío inicial fallido libera los horarios y permite reintentar.
- Solo para las invitaciones anteriores por correo: la entrega inicial tiene una reserva transitoria máxima de diez minutos para evitar bloqueos permanentes si se interrumpe el proceso. Un envío que exceda ese plazo no puede activar una reserva vencida.
- Una confirmación guardada no se revierte si falla su mail: se muestra una advertencia y el administrador puede reenviar la confirmación (invitaciones por correo).
- Esta agenda es independiente de los eventos escolares de Calendario; no se crean ni bloquean eventos ajenos.

## Instalación

La migración original de citas es `20261123190000_contact_appointment_invitations`. La integración nativa requiere además `20261123210000_appointment_google_calendar`: agrega el vínculo del evento/cuenta, RSVP, intención de cancelación y versión de operación para rechazar respuestas concurrentes obsoletas. Esta segunda migración requiere autorización propia antes de aplicarse a una base configurada. Ninguna elimina contactos ni modifica sus respuestas, estados o eventos existentes.

1. Confirmar el destino y revisar **todas** las migraciones pendientes antes de `npx prisma migrate deploy`: ese comando no se limita a esta migración. No usar reset ni `migrate dev` sobre datos existentes.
2. Ejecutar `npm run prisma:generate` y reiniciar el servidor Next.
3. Usar la configuración de correo existente (`MAIL_FROM`, proveedor Resend) y la URL canónica `APP_URL`/`BETTER_AUTH_URL`. El enlace de las invitaciones por correo debe poder abrirse desde fuera del equipo.
4. El reenvío requiere la misma clave `INVITATION_TOKEN_ENCRYPTION_KEY` de 32 bytes Base64 usada por las invitaciones de usuarios. Nunca incluir claves ni tokens en logs.
5. La integración nativa reutiliza las credenciales OAuth de Google Calendar del proyecto (`calendar.events.owned`). Sin conexión activa no se envía nada.

Hasta aplicar la migración, las APIs responden `503` con una indicación de actualización pendiente, no un éxito ficticio. Generar Prisma no aplica migraciones ni envía correos.

## API y seguridad

| Ruta | Operación |
|---|---|
| `/api/dashboard/contacts/admission/{id}/appointments` | GET última invitación + `googleCalendar: { connected }`; POST crear con exactamente un `startsAt` |
| `/api/dashboard/contacts/admission/{id}/appointments/{invitationId}` | POST `resend`/`cancel` (correo anterior) o `sync`/`cancel` (Google; solo organizador) |
| `/api/public/appointments/{token}` | GET consultar; POST `confirm` con `slotId` o `reject` |
| `/citas/{token}` | Elección pública de las invitaciones por correo, sin inicio de sesión |

El GET administrativo devuelve `{ invitation, googleCalendar }` y cada invitación puede incluir `provider`, `googleEventUrl`, `googleRsvpStatus`, `googleSyncPending` y `canManageGoogle`. Para citas de Google, `confirmationEmailFailed` indica un fallo del correo informativo de Koru, no un fallo del evento nativo. Nunca se exponen IDs de cuenta, tokens ni errores del proveedor. El enlace al evento de Google solo se renderiza si es `https` de `calendar.google.com` o `www.google.com/calendar`, con `target="_blank"` y `rel="noopener noreferrer"`.

Los POST requieren el origen canónico, cuerpos de hasta 8192 bytes y payloads válidos. GET nunca confirma ni rechaza, y el RSVP nativo no se puede modificar desde el endpoint público con token. Token aleatorio de 256 bits, hash SHA-256 para consulta y copia cifrada AES-GCM para reenvío; la respuesta administrativa y el payload persistido de mailing no incluyen el token. El enlace personal sí lo incluye: no compartirlo. La vista pública no incluye correos, respuestas del cuestionario ni identidad del administrador; utiliza `noindex` y `no-referrer`.

Todas las transiciones de reservas usan el mismo advisory lock transaccional PostgreSQL con aislamiento READ COMMITTED. El envío de correo queda fuera de la transacción, mientras el estado transitorio mantiene el bloqueo lógico de los horarios.

## Checks sin correo real

```sh
node --test tests/integration/appointment-invitations.test.mjs tests/integration/appointment-invitations-http.test.mjs tests/integration/appointment-google-domain.test.mjs tests/integration/appointment-google-calendar.test.mjs
node --test tests/integration/appointment-scheduling-ui.test.mjs tests/integration/appointment-family-ui.test.mjs tests/integration/appointment-pages.test.mjs
```

Estas pruebas aíslan persistencia, entrega de correo y UI; no prueban por sí solas el bloqueo en PostgreSQL, la entrega por Resend ni el envío real por Google Calendar.

### Pruebas funcionales aisladas

- `tests/integration/appointment-postgres-check.mjs` exige exactamente `TEST_DATABASE_URL=postgresql://appointments_test@127.0.0.1:55551/appointments_e2e` (o `appointments_e2e_recheck` junto a `--recheck`). Requiere una base **nueva y descartable**, no la base configurada. Crea fixtures mínimos y aplica las dos migraciones de citas. Prueba el repositorio y los handlers reales contra PostgreSQL: solicitudes concurrentes, confirmación idempotente, liberación de opciones, reenvío sin extensión y protección de invitaciones pendientes aunque sus horarios ya hayan pasado. Auth, cifrado, correo y Google Calendar están aislados; no prueba entrega real.
- `tests/integration/appointment-google-postgres-check.mjs` exige exactamente `TEST_DATABASE_URL=postgresql://appointments_test@127.0.0.1:55551/appointments_google_e2e` y una base nueva/descartable. Aplica ambas migraciones y prueba repositorio+HTTP reales: una sola fecha, ganador único ante concurrencia, permisos del organizador, RSVP confirmado y reserva conservada ante error de cancelación. Google, sesión y cifrado son fixtures; ningún correo ni evento externo se envía.
- `tests/integration/appointment-browser-check.mjs` ejecuta componentes React y Tailwind reales en Chromium con APIs simuladas, comprobando alineación del botón, revisión y envío de una sola invitación nativa, refresco de RSVP y cancelación del organizador, enlace seguro al evento, confirmación familiar heredada y ausencia de overflow móvil. Reutiliza el Playwright de pruebas ubicado en `.tmp-admissions-e2e/browser` y su caché de navegadores; si no están instalados, este probe no está disponible y no deben confundirse sus resultados con un despliegue Next autenticado. Las APIs son fixtures locales: no se envía correo ni se escribe en Google Calendar.
- Los datos, logs y capturas quedan bajo `.tmp-appointments-e2e/`, excluido de Git. Los procesos PostgreSQL de prueba deben detenerse al finalizar.

La entrega por Resend, el envío por Google Calendar y la sesión autenticada de una instalación real deben distinguirse de estos checks. No enviar correos ni invitaciones a contactos reales como parte de pruebas automáticas.
