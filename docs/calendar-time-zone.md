# Calendario: todos los horarios son de Ciudad de México

Koru usa únicamente `America/Mexico_City`, definida en `DEFAULT_CALENDAR_TIME_ZONE`. No depende de la zona del navegador, del servidor ni de la zona guardada en un evento antiguo. El formulario no ofrece otras zonas horarias.

## Captura y almacenamiento

- La fecha y hora capturadas son la hora local de Ciudad de México. Por ejemplo, el 1 de noviembre de 2026 de 16:00 a 18:30 corresponde a `2026-11-01T22:00:00.000Z`–`2026-11-02T00:30:00.000Z`.
- `startsAt` y `endsAt` representan instantes UTC; no son texto de hora local. La duración conserva los minutos transcurridos entre ambos instantes.
- Tanto la acción de servidor como el endpoint de guardado ignoran cualquier `timeZone` enviado, aunque sea antiguo, inválido o manipulado. Guardan la constante de México.
- Las fechas imposibles y los horarios malformados siguen rechazándose antes de guardar o programar notificaciones.

## Visualización y exportación

| Superficie | Política |
|------------|----------|
| Helpers de fecha, hora y etiqueta | Siempre México; los argumentos de zona antiguos se aceptan por compatibilidad, pero no tienen efecto. |
| Edición de eventos antiguos | Los instantes existentes se muestran como fecha y hora de México. |
| Invitaciones por correo | Fecha, hora y etiqueta de Ciudad de México, incluso con una zona antigua guardada. |
| Google Calendar | Conserva los instantes de eventos con horario y declara `America/Mexico_City`. Los eventos de día completo usan fechas de México y fin exclusivo. |

La zona IANA aplica las reglas históricas de Ciudad de México; no se reemplaza por un desplazamiento UTC fijo para todas las fechas históricas.

## Datos existentes: no migrar a ciegas

Este cambio de política **no desplaza ni reescribe en bloque los instantes existentes**. Una zona antigua no demuestra que un instante sea incorrecto. Si un evento fue capturado con una hora equivocada, confirmar primero su fecha y hora local de México y corregir solo ese evento autorizado. No sumar ni restar horas indiscriminadamente a todos los registros.

La corrección puntual autorizada de **Festejo Día de Muertos** a **16:00–18:30 de Ciudad de México** es una operación de datos independiente: no la ejecutan estos helpers ni estas pruebas.

## Verificación sin base de datos ni red

- `node --test tests/integration/calendar-mexico-policy.test.mjs`: acción y API públicas con persistencia simulada, rechazo sin escrituras, formulario real y pruebas de dominio de helpers y Google ejecutadas en memoria.
- `node --test tests/integration/email-locale.test.mjs`: plantillas reales y equivalencia de las invitaciones con zonas antiguas.
- `npm run test:domain`: compilación y suite de dominio del repositorio; genera y limpia `.tmp-domain-tests`.
