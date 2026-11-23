# Citas desde Contactos

Admin y Superadmin pueden ofrecer entre uno y tres horarios a un contacto de **Cuestionario inicial**, desde **Agendar cita**, a la derecha de **Detalle del contacto**. Se conserva el permiso `contacts.manage`; otros roles y el formulario de contacto común no pueden enviar invitaciones.

## Flujo

1. Revisar el correo del contacto, elegir duración (30 minutos por defecto), modalidad, lugar/enlace y hasta tres fechas y horas.
2. Revisar el resumen y pulsar **Enviar invitación por mail**.
3. La familia abre un enlace personal, sin cuenta, y confirma una opción o indica que ninguna le sirve.
4. La familia y quien envió la invitación reciben la confirmación. Si ninguna opción sirve, se notifica al administrador.

Los horarios se capturan y muestran en **Ciudad de México (`America/Mexico_City`)**. El estado de la cita es independiente de Nuevo/Leído/Respondido del contacto.

## Reservas

- Las opciones bloquean la misma agenda de entrevistas de admisión durante **48 horas desde el envío inicial**. Se rechazan superposiciones, incluso entre contactos diferentes.
- Confirmar conserva solo el intervalo elegido; rechazar, cancelar o vencer libera todos los intervalos.
- Reenviar no extiende el vencimiento. Una confirmación repetida no genera otra cita.
- La expiración se evalúa al consultar/operar, sin depender de un cron. Un envío inicial fallido libera los horarios y permite reintentar.
- La entrega inicial tiene una reserva transitoria máxima de diez minutos para evitar bloqueos permanentes si se interrumpe el proceso. Un envío que exceda ese plazo no puede activar una reserva vencida.
- Una confirmación guardada no se revierte si falla su mail: se muestra una advertencia y el administrador puede reenviar la confirmación.
- Esta agenda es independiente de los eventos escolares de Calendario; no se crean ni bloquean eventos ajenos.

## Instalación

La migración aditiva es `20261123190000_contact_appointment_invitations`. No elimina contactos ni modifica sus respuestas, estados o eventos existentes.

1. Confirmar el destino y revisar **todas** las migraciones pendientes antes de `npx prisma migrate deploy`: ese comando no se limita a esta migración. No usar reset ni `migrate dev` sobre datos existentes.
2. Ejecutar `npm run prisma:generate` y reiniciar el servidor Next.
3. Usar la configuración de correo existente (`MAIL_FROM`, proveedor Resend) y la URL canónica `APP_URL`/`BETTER_AUTH_URL`. El enlace debe poder abrirse desde fuera del equipo.
4. El reenvío requiere la misma clave `INVITATION_TOKEN_ENCRYPTION_KEY` de 32 bytes Base64 usada por las invitaciones de usuarios. Nunca incluir claves ni tokens en logs.

Hasta aplicar la migración, las APIs responden `503` con una indicación de actualización pendiente, no un éxito ficticio. Generar Prisma no aplica migraciones ni envía correos.

## API y seguridad

| Ruta | Operación |
|---|---|
| `/api/dashboard/contacts/admission/{id}/appointments` | GET última invitación; POST crear |
| `/api/dashboard/contacts/admission/{id}/appointments/{invitationId}` | POST `resend` o `cancel` |
| `/api/public/appointments/{token}` | GET consultar; POST `confirm` con `slotId` o `reject` |
| `/citas/{token}` | Elección pública sin inicio de sesión |

Los POST requieren el origen canónico, cuerpos de hasta 8192 bytes y payloads válidos. GET nunca confirma ni rechaza. Token aleatorio de 256 bits, hash SHA-256 para consulta y copia cifrada AES-GCM para reenvío; la respuesta administrativa y el payload persistido de mailing no incluyen el token. El enlace personal sí lo incluye: no compartirlo. La vista pública no incluye correos, respuestas del cuestionario ni identidad del administrador; utiliza `noindex` y `no-referrer`.

Todas las transiciones de reservas usan el mismo advisory lock transaccional PostgreSQL con aislamiento READ COMMITTED. El envío de mail queda fuera de la transacción, mientras el estado transitorio mantiene el bloqueo lógico de los horarios.

## Checks sin correo real

```sh
node --test tests/integration/appointment-invitations.test.mjs tests/integration/appointment-invitations-http.test.mjs
```

Estas pruebas aíslan persistencia y entrega de correo; no prueban por sí solas el bloqueo en PostgreSQL ni la entrega por Resend.

### Pruebas funcionales aisladas

- `tests/integration/appointment-postgres-check.mjs` exige exactamente `TEST_DATABASE_URL=postgresql://appointments_test@127.0.0.1:55551/appointments_e2e` (o `appointments_e2e_recheck` junto a `--recheck`). Requiere una base **nueva y descartable**, no la base configurada. Crea fixtures mínimos y aplica únicamente la migración de citas. Prueba el repositorio y los handlers reales contra PostgreSQL: solicitudes concurrentes, confirmación idempotente, liberación de opciones, reenvío sin extensión y protección de invitaciones pendientes aunque sus horarios ya hayan pasado. Auth, cifrado y correo están aislados; no prueba entrega real.
- `tests/integration/appointment-browser-check.mjs` ejecuta componentes React y Tailwind reales en Chromium con APIs simuladas, comprobando alineación del botón, modal/revisión/envío, confirmación familiar y ausencia de overflow móvil. Reutiliza el Playwright de pruebas ubicado en `.tmp-admissions-e2e/browser` y su caché de navegadores; si no están instalados, este probe no está disponible y no deben confundirse sus resultados con un despliegue Next autenticado.
- Los datos, logs y capturas quedan bajo `.tmp-appointments-e2e/`, excluido de Git. Los procesos PostgreSQL de prueba deben detenerse al finalizar.

La entrega por Resend y la sesión autenticada de una instalación real deben distinguirse de estos checks. No enviar correos a contactos reales como parte de pruebas automáticas.
