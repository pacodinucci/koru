# Kanban interno: contrato de persistencia

## Acceso e integración

`kanban.actions.ts` implementa las 14 acciones de L5 de `odd/tasks/internal-kanban.md`.
Cada acción llama a `requireDashboardUser` antes de acceder a datos. Los tableros son
compartidos: no hay filtros por creador ni cambios a los permisos del dashboard.
Los DTO públicos están en `../types.ts`; las acciones lanzan errores legibles en español.
La interfaz debe volver a cargar los datos después de una mutación exitosa.

La creación de tableros incluye tres estados editables: **Pendiente**, **En curso** y
**Hecho**. Los nombres de tablero admiten 1–120 caracteres; los estados, 1–80;
los títulos, 1–200; las descripciones opcionales, hasta 5000. Se recortan los espacios.
Los colores son hexadecimales `#RRGGBB`. Los identificadores no pueden estar vacíos.
Las personas responsables deben tener `dashboard.access`, calculado con la misma
precedencia de roles activos/asignados y permisos heredados que el guard existente.
No se usan emails como etiquetas ni se devuelven datos de permisos al cliente.

## Orden, movimientos y eliminación

Todas las mutaciones de un tablero existente bloquean su fila con `SELECT ... FOR UPDATE`
dentro de una transacción PostgreSQL `ReadCommitted`, antes de leer tarjetas o estados.
Esto serializa también procesos/instancias distintos, no sólo solicitudes en un proceso.
Los cambios a distintos tableros no comparten un mutex global.

Las posiciones son índices consecutivos desde cero. `reorderStatusesAction` exige la
permutación completa, sin duplicados ni identificadores de otros tableros.
En `moveCardAction`, `position` es el índice final después de quitar la tarjeta de su
posición anterior; admite desde cero hasta la cantidad de tarjetas restantes del destino.
No se aceptan posiciones negativas, fraccionarias ni mayores que ese límite.

`deleteStatusAction` conserva al menos un estado. Si hay tarjetas, exige otro estado
del mismo tablero como destino; conserva el orden de las tarjetas y las agrega al final
del destino, dentro de la misma transacción que elimina el estado y renumera columnas.
Un error revierte todos los cambios. La FK compuesta `(statusId, boardId)` impide
referenciar un estado de otro tablero y restringe la eliminación accidental de tarjetas.

`deleteBoardAction` es destructiva y explícita: la UI **debe pedir confirmación antes de
invocarla**. El contrato L5 no incluye un parámetro de confirmación; la acción no puede
probar que la persona vio el diálogo. Elimina tarjetas, estados y tablero atómicamente.

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
