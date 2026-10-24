# Kanban interno: contrato de persistencia

## Acceso e integración

`kanban.actions.ts` conserva las acciones de L5 de `odd/tasks/internal-kanban.md`
y agrega las opciones de columna de L7 de `odd/tasks/kanban-column-options.md`.
Cada acción llama a `requireDashboardUser(undefined, "kanban")` antes de acceder a
datos, mediante un wrapper local compartido por todas las acciones. La página usa
el mismo scope. Este scope excluye a `PSYCHOPEDAGOGY_TEACHER`: su acceso al dashboard
no habilita Kanban, ni siquiera mediante llamadas directas a acciones.
Los demás roles conservan sus reglas anteriores. Los tableros son compartidos:
no hay filtros por creador.
Los DTO públicos están en `../types.ts`; las acciones lanzan errores legibles en español.
La interfaz debe volver a cargar los datos después de una mutación exitosa.

La creación de tableros incluye tres estados editables: **Pendiente**, **En curso** y
**Hecho**. Los nombres de tablero admiten 1–120 caracteres; los estados, 1–80;
los títulos, 1–200; las descripciones opcionales, hasta 5000. Se recortan los espacios.
Los colores son hexadecimales `#RRGGBB` o `""` para **Sin color**. Los identificadores no pueden estar vacíos.
Las personas responsables deben tener `dashboard.access` y no pueden tener el rol
`PSYCHOPEDAGOGY_TEACHER`, con la misma precedencia de roles activos/asignados y
permisos heredados que el guard de Kanban.
No se usan emails como etiquetas ni se devuelven datos de permisos al cliente.

## Orden, movimientos y eliminación

Todas las mutaciones de un tablero existente bloquean su fila con `SELECT ... FOR UPDATE`
dentro de una transacción PostgreSQL `ReadCommitted`, antes de leer tarjetas o estados.
Esto serializa también procesos/instancias distintos, no sólo solicitudes en un proceso.
Los cambios a distintos tableros no comparten un mutex global.

Las posiciones son índices consecutivos desde cero. `reorderStatusesAction` exige la
permutación completa de las columnas activas, sin duplicados ni identificadores de otros
tableros. Conserva las posiciones de las columnas archivadas o en la papelera.
En `moveCardAction`, `position` es el índice final después de quitar la tarjeta de su
posición anterior; admite desde cero hasta la cantidad de tarjetas restantes del destino.
No se aceptan posiciones negativas, fraccionarias ni mayores que ese límite.

`deleteStatusAction` sigue siendo una eliminación irreversible de columna, **no** una
operación de papelera; el cliente debe confirmar antes de invocarla. Solo acepta columnas
activas y conserva al menos una columna activa. Si hay tarjetas, exige otro estado activo
del mismo tablero como destino; conserva el orden de las tarjetas y las agrega al final
del destino, dentro de la misma transacción que elimina el estado y renumera columnas.
Un error revierte todos los cambios. La FK compuesta `(statusId, boardId)` impide
referenciar un estado de otro tablero y restringe la eliminación accidental de tarjetas.

`deleteBoardAction` es destructiva y explícita: la UI **debe pedir confirmación antes de
invocarla**. El contrato L5 no incluye un parámetro de confirmación; la acción no puede
probar que la persona vio el diálogo. Elimina tarjetas, estados y tablero atómicamente.

## Opciones de columna y recuperación

`getBoardAction` devuelve **todas** las columnas, incluidas las archivadas y las que están
en la papelera. La UI filtra por `archivedAt`/`trashedAt`. Los nuevos campos tienen valores
iniciales seguros: fechas `null`, `holdEnabled` y `onHold` en `false`, sin seguidores.
`updateStatusAction` cambia únicamente nombre y color, sin sobrescribir tarjetas,
seguimiento, posición ni opciones.

- `setStatusWatchingAction({boardId,id,watching})` sigue/deja de seguir una **columna**,
  no sus tarjetas. Es personal e idempotente: usa exclusivamente `actor.id` del guard.
  `watching` refleja a la persona autenticada y `watchers` contiene solo `id` y `name`.
- `setStatusHoldEnabledAction({boardId,id,enabled})` habilita la opción por columna, sin
  pausar tarjetas automáticamente. Deshabilitarla conserva las marcas existentes.
- `setCardOnHoldAction({boardId,id,onHold})` cambia una sola marca. Poner en espera exige
  la opción habilitada; quitar la marca está permitido aunque la opción esté deshabilitada.
  No cambia responsable, vencimiento, contenido ni posición. Mover una tarjeta conserva
  su marca incluso si el destino no permite agregar marcas nuevas.
- `setStatusLifecycleAction({boardId,id,state})` acepta `active`, `archived` o `trashed`.
  Archivar y mover a la papelera son reversibles y no borran nada; nunca pueden ocultar
  la última columna activa. Restaurar limpia ambas fechas y conserva tarjetas y opciones.
  La UI debe confirmar antes de mover a la papelera. Las transiciones repetidas conservan
  su fecha original. No hay vencimiento ni purga automática.
- Una columna inactiva y sus tarjetas rechazan edición normal, seguimiento, opciones de
  espera, eliminación heredada y movimientos de entrada/salida. Sus opciones solo se
  pueden editar después de restaurarla.
- `permanentlyDeleteStatusAction({boardId,id})` solo acepta columnas **en la papelera**;
  elimina tarjetas, seguidores y columna en una sola transacción. La UI **debe pedir una
  confirmación separada y explícita**: el contrato no acepta ni puede verificar un diálogo.
  Las columnas archivadas deben pasar primero por la papelera para borrarse definitivamente.

Todas estas mutaciones, incluido el seguimiento personal, usan el mismo bloqueo de tablero.
La migración es aditiva: no reescribe los datos guardados; además impide tener ambas fechas
de inactividad al mismo tiempo. Debe aplicarse por separado en una base autorizada.

## Avisos personales dentro de Koru

`listKanbanNotificationsAction()` devuelve únicamente los avisos de `actor.id`, ordenados
por fecha descendente e identificador como desempate. La cantidad sin leer se obtiene
contando `readAt === null` en ese resultado. No acepta destinatarios del cliente.
`markKanbanNotificationReadAction({id})` también usa `actor.id`, verifica el destinatario
antes de bloquear el tablero y vuelve a verificarlo dentro de la transacción. Es idempotente
(conserva la primera fecha de lectura) y rechaza un identificador ajeno o inexistente con
`El aviso no existe.` sin cambiar datos.

Crear o editar una tarjeta, cambiar su marca de espera y moverla generan avisos persistentes
para quienes siguen la columna, incluida la persona que realiza el cambio si la sigue.
Un movimiento entre columnas notifica salida a los seguidores del origen y llegada a los
del destino; seguir ambas columnas produce ambos avisos. Cambiar de posición dentro de la
misma columna genera un aviso; repetir la misma posición/marca no genera duplicados.
La reubicación de tarjetas de `deleteStatusAction` también genera avisos. No se envían
correos ni se crean avisos por archivar/restaurar, renombrar, cambiar color, habilitar espera
o eliminar una tarjeta.

Los avisos se insertan **dentro de la misma transacción** que la tarjeta: cualquier error
revierte tarjeta, orden y avisos. Dejar de seguir una columna no borra el historial ni hace
que se sigan sus tarjetas en otros destinos. Los identificadores de columna/tarjeta del
aviso son referencias históricas y pueden dejar de existir después de un borrado explícito;
la UI debe tolerar esos destinos ausentes. Eliminar un tablero elimina sus avisos junto con
sus tarjetas/columnas. Eliminar una cuenta elimina sus seguimientos y avisos por FK.

## Fechas

Se aceptan `YYYY-MM-DD` (medianoche UTC) o timestamps ISO con segundos y zona horaria
explícita, por ejemplo `2026-10-20T12:30:00.000Z`. Fechas imposibles o ambiguas se rechazan
con `Indicá una fecha de vencimiento válida.`. Omitir la fecha o enviar `null`/`""` elimina
el vencimiento; las fechas guardadas se devuelven como ISO. Omitir una descripción o una
persona responsable en creación/edición las deja en `null`.

## Verificación sin base de producción

`node --test tests/integration/kanban-actions.test.mjs` ejecuta las acciones públicas con
un adaptador Prisma transaccional aislado. Prueba autorización, DTO, validación, CRUD,
orden, rollback y solicitudes concurrentes; sólo se serializa el adaptador cuando las
acciones ejecutan la consulta de bloqueo. Las pruebas de fechas también están en
`tests/domain/kanban.test.ts`, incluidas por `npm run test:domain`.

**Límite:** el adaptador no demuestra ejecución del SQL de migración, enforcement real de
FK ni planificación de bloqueos PostgreSQL. Antes de desplegar, aplicar la migración en
una base desechable autorizada y comprobar las FK, rollback y carreras entre conexiones
independientes (creación concurrente, movimiento contra eliminación de estado/tablero).
Esta unidad no ejecuta migraciones ni conecta con una base compartida o de producción.
