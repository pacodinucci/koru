# Permisos del calendario por área

## Estado de esta entrega

Esta entrega incorpora áreas, permisos por área, eventos multiárea, filtros y controles de acceso en el servidor. Administrá las asignaciones en **Sistema → Permisos del calendario**, en [/dashboard/calendar-permissions](/dashboard/calendar-permissions). El acceso requiere `calendar.permissions.manage`, asignable desde **Roles → Permisos del calendario → Administrar accesos por área**. El enlace ya no aparece dentro del calendario; la dirección anterior `/dashboard/calendar/areas` redirige a la nueva sección y exige el mismo permiso. La migración fue aplicada con autorización explícita a la base configurada; `prisma migrate deploy` finalizó correctamente y `prisma migrate status` confirmó que el esquema está actualizado.

La política se aplica en los listados, detalle, guardado, cancelación, inscripciones y respuestas de asistencia. Antes de enviar invitaciones o sincronizar con Google, se verifica que la persona conserve acceso. Los eventos institucionales no admiten invitaciones externas por enlace.

## Áreas institucionales

Un acontecimiento puede tener una sola área responsable y varias áreas involucradas, sin duplicarse. La participación de un área y la audiencia autorizada se guardan en relaciones separadas: involucrar un área no equivale a seleccionarla como audiencia.

| Área | Identificador inicial | Color inicial |
| --- | --- | --- |
| Dirección | `calendar-area-direction` | `#7c3aed` |
| Académico | `calendar-area-academic` | `#2563eb` |
| Coordinación Psicopedagógica y Acompañamiento a Familias | `calendar-area-psychopedagogy` | `#059669` |
| Operaciones y Mantenimiento | `calendar-area-operations` | `#d97706` |

La pantalla administra accesos de estas áreas fijas; no crea áreas ni introduce un sistema nuevo de roles.

## Administración de accesos

La página, la vista y cada llamada a `setCalendarAreaGrantAction` exigen autenticación y `calendar.permissions.manage`. Este permiso es independiente de `calendar.manage`: gestionar eventos no permite administrar accesos, y administrar accesos no permite editar o consultar eventos por sí solo. El usuario también debe conservar el permiso general de ingreso al panel. Solo se ofrecen usuarios internos con uno de estos roles base: `ADMIN`, `ADMIN_OPERATOR`, `ADMIN_TEACHER`, `SUPERADMIN`, `TEACHER`, `PSYCHOPEDAGOGY_TEACHER`. `PARENT` nunca puede recibir un acceso de área, aunque tenga un rol personalizado con permisos del panel. El servidor vuelve a comprobar la existencia del área y la existencia y rol del usuario al guardar o quitar un acceso.

Cada combinación área/persona tiene un único acceso:

- **Sin acceso de área:** elimina la asignación. No revoca otros permisos generales ni la visibilidad que pudiera corresponder por otra regla.
- **Consulta:** guarda `canEdit = false`; habilita lectura por área cuando la política de audiencia del evento lo permite, pero no autoriza editarlo.
- **Consulta y edición:** guarda `canEdit = true`; además de lectura permitida, habilita gestionar acontecimientos cuya área responsable sea esa área. Ser lector o editor de un área solamente involucrada no concede edición del evento.

Una asignación de área habilita `calendar.view` para usuarios internos, pero no concede acceso general al panel ni `calendar.manage`. El acceso al panel conserva sus reglas existentes. `calendar.permissions.manage` permite administrar las asignaciones, pero no revela automáticamente eventos institucionales restringidos. Las asignaciones se aplican a eventos actuales y futuros según su audiencia y área responsable, no como invitaciones individuales a cada evento.

Al modificar accesos se programa una reconciliación de eventos futuros confirmados con Google: se vuelve a comprobar la autorización y se solicita eliminar las copias que ya no corresponden. Esto depende de la disponibilidad y autorización de Google; no permite retirar emails ya enviados.

## Privacidad y edición

La clasificación, la audiencia y la autoridad de edición son decisiones distintas. Los alcances son:

- `LEGACY`: conserva las reglas existentes de `PUBLIC`/`MEMBERS` y `ALL`/`TEACHERS`/`PARENTS`/`PRIVATE` hasta clasificar el evento.
- `INTERNAL`: solo equipo interno autorizado; no equivale a familias ni a público.
- `AREAS`: audiencia de áreas seleccionadas, independiente de las áreas involucradas.
- `PEOPLE`: únicamente las cuentas seleccionadas, reutilizando `CalendarEventAudience`. Se puede autorizar una familia individual sin darle acceso al área. Quien guarda debe estar incluido; solo el equipo interno autorizado puede editar.

**La restricción a personas tiene precedencia sobre los accesos de área y la administración general.** Un acceso de lectura o edición de área no revela un evento restringido a personas que no incluyeron al usuario. La autoridad de editar tampoco sustituye la autorización para consultar ese evento. Las validaciones de creación y modificación deben rechazar audiencias o áreas inválidas, sin ampliar la visibilidad como alternativa.

Al crear o modificar un evento, elegí el área responsable, las áreas involucradas y «Quién puede verlo». Para acceso por áreas, elegí también las áreas autorizadas para consultar; para acceso por personas, seleccioná las cuentas. El servidor rechaza áreas inexistentes y audiencias inválidas sin guardar cambios.

Los filtros por área del calendario operan únicamente sobre eventos ya autorizados. Sin filtros se muestran todos los eventos que la persona puede consultar; no todos los registros institucionales. Los eventos de consulta abren un detalle sin acciones de edición ni listas de invitados/asistencia. Las etiquetas usan el color de cada área y un evento compartido aparece una sola vez.

Las notificaciones avanzadas, reservas logísticas vinculadas, recurrencia y detección de conflictos no forman parte de esta entrega.

## Persistencia y migración

La migración `prisma/migrations/20260901090000_calendar_institutional_areas/migration.sql` utiliza PostgreSQL y solo agrega un enum, dos columnas del evento, cuatro tablas, índices, relaciones y las cuatro áreas iniciales. No asigna accesos ni actualiza eventos existentes. `accessScope` tiene valor predeterminado `LEGACY` y `responsibleAreaId` admite nulos, por lo que los datos previos mantienen su clasificación. La relación responsable usa `ON DELETE RESTRICT`; las tablas de enlaces usan claves compuestas para evitar duplicados.

La validación del esquema y la generación local del cliente no aplican migraciones. Con autorización explícita se ejecutó `npx prisma migrate deploy`: la única migración pendiente era la de áreas institucionales y se aplicó correctamente en PostgreSQL. La comprobación posterior con `npx prisma migrate status` confirmó `Database schema is up to date!`. Esto comprueba la aplicación del SQL, no sustituye las pruebas funcionales de permisos ni prueba concurrencia o todas las restricciones con datos reales.

## Interfaz del servidor

`calendar-areas.repository.ts` expone:

- `listCalendarAreas()`: áreas y accesos, incluyendo de cada usuario solo `id`, `name`, `email`, `role`; no carga acontecimientos.
- `listCalendarAreaOptions()`: solo `id`, `name`, `color`.
- `getCalendarAreaGrants(userId: string)`: solo `areaId`, `canEdit`.
- `setCalendarAreaGrant({ areaId, userId, canEdit, enabled })`: valida destinos y realiza `upsert` si está habilitado, o `deleteMany` si está deshabilitado. Su llamador debe autorizar `calendar.permissions.manage`.

La acción recibe `FormData` con `areaId`, `userId` y `accessLevel` (`none`, `read`, `edit`); rechaza campos vacíos o niveles desconocidos con `invalid_calendar_area_grant`. El repositorio usa `calendar_area_not_found` y `calendar_area_user_not_internal` para destinos inválidos. Las solicitudes rechazadas no escriben asignaciones ni revalidan páginas. Al guardar, la acción revalida `/dashboard/calendar-permissions` y `/dashboard/calendar`.

## Activación del permiso administrativo

La migración aditiva `20261024170000_calendar_area_permissions` registra `calendar.permissions.manage` en la base y lo asigna inicialmente a los roles de sistema `SUPERADMIN` y `ADMIN`, en consonancia con el catálogo predeterminado. No lo asigna a roles personalizados, no modifica accesos por área ni eventos, y no agrega un permiso garantizado por rol base. Desde Roles se puede otorgar o quitar este permiso; para delegarlo, quien administra Roles debe poseerlo, según las reglas de delegación existentes.

Esta migración debe aplicarse mediante el procedimiento de despliegue autorizado antes de asignar el nuevo permiso desde Roles. Crear el archivo SQL no aplica cambios en la base. Este traslado no modifica las reglas de audiencia ni resuelve la separación pendiente de eventos internos por personas específicas y eventos para familias.
