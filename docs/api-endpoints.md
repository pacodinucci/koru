# API y Endpoints (Vista Superficial)

Este documento resume el estado actual de la API del proyecto y propone los endpoints a desarrollar.
Objetivo: tener una guía clara de arquitectura sin entrar en detalle fino de cada feature.

## 1) Endpoints HTTP existentes hoy

### 1.1 `GET|POST /api/auth/[...all]`
- Tipo: endpoint dinámico manejado por Better Auth.
- Archivo: `src/app/api/(auth)/auth/[...all]/route.ts`
- Propósito: centralizar autenticación y sesión.
- Estado: implementado.
- Nota: las subrutas concretas las resuelve Better Auth internamente (sign-in, sign-up, sign-out, sesión, etc.).

### 1.2 `POST /api/uploads/blog`
- Tipo: endpoint propio.
- Archivo: `src/app/api/uploads/blog/route.ts`
- Propósito: subir imágenes del editor de blog a Cloudinary.
- Estado: implementado.
- Reglas actuales:
  - requiere sesión activa (`401` si no está autenticado),
  - acepta solo `image/*`,
  - límite de 5 MB,
  - devuelve `{ ok: true, url }` al subir correctamente.

### 1.3 `GET|POST /api/teacher/students/{id}/psychopedagogy`
- Pantalla: `/dashboard/psicopedagogia`, desde el menú **Psicopedagogía**, con tabla global de alumnos, filtro por nombre, enlaces a sus expedientes y cuatro íconos por fila: aprendizaje/temperamento, seguimientos, intervenciones e instrumentos. Cada ícono abre un modal del alumno seleccionado. Las bitácoras existentes se consultan y agregan dentro de **Seguimientos realizados**, sin desplegar bloques debajo de la tabla.
- Acceso especializado: `PSYCHOPEDAGOGY_TEACHER` (nombre visible **Docente psicopedagógico**), con acceso dinámico activo al dashboard. Puede consultar y crear reportes para cualquier alumno registrado, sin asignación de grupo y sin limitar por estado del alumno o grupo. Para crear necesita un perfil docente activo, que se provisiona al asignar el rol o aceptar su invitación; el perfil identifica al autor, no concede las demás funciones docentes.
- Acceso de supervisión: `SUPERADMIN` ve la misma tabla global sin necesitar perfil ni asignaciones docentes. Puede crear **bitácoras de observación**, **acompañamientos**, **intervenciones** e **instrumentos**, además de editar **Estilo de aprendizaje y temperamento**, desde los íconos de la tabla de Psicopedagogía. El expediente del alumno es siempre de solo lectura.
- Sección y API excluyen a `TEACHER`, `ADMIN_TEACHER`, `ADMIN`, `ADMIN_OPERATOR`, `PARENT` y solicitudes sin sesión. El nuevo rol recibe por defecto solo `dashboard.access` y `students.view`: no obtiene edición administrativa, pagos, calendario, caja, inventario, reportes docentes ni Kanban. El servidor de Kanban y su selección de responsables también lo excluyen.
- `GET`: devuelve `{ entries }` ordenadas por fecha descendente. Ambos roles autorizados consultan todos los reportes del alumno seleccionado, de cualquier autor, incluidos los históricos aunque el alumno, grupo o autor ya no estén activos. Se responde con `Cache-Control: private, no-store`.
- `POST`: para `PSYCHOPEDAGOGY_TEACHER` autorizado o `SUPERADMIN`; recibe JSON `{ date: "2026-02-28", title: "Seguimiento", body: "Texto libre" }`. El servidor obtiene el alumno de la URL y el autor de la sesión/perfil; ignora identificadores de autor o modos de edición enviados por el cliente. `SUPERADMIN` crea con `authorUserId` obtenido de su sesión y sin perfil docente; los especialistas conservan su `teacherId`.
- Campos obligatorios: fecha calendario válida `YYYY-MM-DD`, título de hasta 160 caracteres y texto de hasta 10.000 caracteres. Se recortan espacios al inicio/final; el texto conserva sus saltos de línea y no interpreta HTML.
- Respuestas: `201 { ok: true }` al crear; `400 { error }` para datos inválidos; `404 { error }` si el alumno no está disponible; `503 { error }` si falta aplicar la migración; `500 { error }` ante otros errores.
- Persistencia: modelo independiente `PsychopedagogyEntry`; estos reportes no crean `StudentReport` ni comparten contenido con familias. La fecha del reporte es independiente del momento de creación.
- Instalación: revisar las migraciones `20260919120000_add_psychopedagogy_teacher_role` y `20260930120000_add_psychopedagogy_entries` antes del despliegue. La primera incorpora el enum y un rol dinámico protegido con permisos mínimos; rellena únicamente referencias dinámicas faltantes de usuarios e invitaciones de ese rol. Confirma el enum antes de insertar el rol para respetar la seguridad de enums de PostgreSQL; un fallo posterior puede dejar el enum incorporado sin completar el seed. `npx prisma migrate deploy` aplica **todas** las migraciones pendientes; no ejecutarlo sin autorizar y confirmar la base destino. Generar el cliente local con `npm run prisma:generate` no aplica migraciones.
- Backfill opcional: `npm run roles:backfill` acepta `PSYCHOPEDAGOGY_TEACHER_EMAILS` además de `ADMIN_EMAILS` y `TEACHER_EMAILS`, sincroniza rol base y rol dinámico, y crea perfiles de autoría sin asignaciones de grupo. Si un email aparece en varias listas, prevalece psicopedagogía sobre docente y administrador. Los usuarios no enumerados conservan sus roles especializados y asignaciones dinámicas; solo los roles heredados ADMIN/TEACHER/PARENT sin asignación dinámica pasan a familia. **El backfill escribe en la base y requiere autorización independiente; no forma parte de la generación local.**
- Pruebas sin base de datos: `node --test tests/integration/psychopedagogy.test.mjs tests/integration/psychopedagogy-role.test.mjs tests/integration/psychopedagogy-ui.test.mjs`.

### 1.4 `GET|POST /api/teacher/students/{id}/psychopedagogy/profile`
- Perfil psicopedagógico independiente de los **reportes docentes**. Se muestra en el expediente debajo de **Reportes**, siempre en modo de solo lectura y sin controles de edición. La edición se realiza exclusivamente desde la sección **Psicopedagogía**, según los permisos existentes. Es visible únicamente para `PSYCHOPEDAGOGY_TEACHER` con acceso activo al dashboard y `SUPERADMIN`. No se comparte con familias ni con otros roles.
- `GET`: devuelve `{ profile }`, con `learningStyleAndTemperament`, `observations`, `accompaniments`, `interventions` e `instruments`. Las observaciones son las entradas `PsychopedagogyEntry` ya existentes: no se copian ni se convierten en `StudentReport`. Un perfil todavía sin contenido devuelve texto y listas vacías sin insertar registros. Respuesta privada, sin caché.
- `POST`: el docente psicopedagógico autorizado necesita perfil de autoría activo. `SUPERADMIN` puede escribir `section: "learning"`, `section: "accompaniment"`, `section: "intervention"` y `section: "instrument"`, sin necesitar perfil docente. El alumno se obtiene de la URL y el autor de la sesión, nunca del payload. La edición del aprendizaje por Superadmin registra `updatedByUserId`; la del especialista conserva `updatedById`. Los acompañamientos, intervenciones e instrumentos de Superadmin registran `authorUserId` con el ID real del usuario autenticado y `teacherId: null`; los del especialista conservan `teacherId`. No se aceptan campos de autoría ni de alumno enviados por el cliente. El campo `section` determina la operación:
  - `learning`: `{ section: "learning", description }`, actualiza la descripción de estilo de aprendizaje y temperamento del alumno.
  - `accompaniment`: `{ section: "accompaniment", date, kind, title, body }`; `kind` admite `INDIVIDUAL` o `FAMILY`.
  - `intervention`: `{ section: "intervention", date, title, observationAnalysis, strategyFeedback, workPlan, implementation, evaluationResults }`, los cinco apartados del informe psicopedagógico.
  - `instrument`: `{ section: "instrument", date, kind?, name, body }`, con clasificación separada del nombre y del texto de aplicación. `kind` admite únicamente `QUESTIONNAIRE` (Cuestionario), `ASSESSMENT` (Prueba), `INTERVIEW` (Entrevista), `TEST` (Test) u `OTHER` (Otro). Es opcional para clientes anteriores: omitirlo guarda `null`; enviarlo como `null`, vacío o desconocido devuelve `400 { error }` sin guardar. Ejemplo: `{ section: "instrument", date: "2026-02-28", kind: "QUESTIONNAIRE", name: "Cuestionario inicial", body: "Detalle de aplicación" }`. La UI requiere elegir un tipo y siempre lo envía. `GET` incluye `kind: null` en registros históricos sin clasificación y en altas compatibles que lo omitan; se muestran como **Sin clasificar**, nunca como Otro ni por inferencia del nombre. El contrato compartido exporta `InstrumentKind` e `instrumentKindLabels`; `InstrumentDTO.kind` es opcional nullable para fixtures anteriores.
- En la tabla de **Psicopedagogía**, el ícono **Seguimientos realizados** abre un modal con el alumno y grupo, y dos pestañas: **Bitácoras de observación** (situaciones reportadas y comunicación familiar) y **Acompañamientos**. Las pestañas usan un subrayado para indicar la selección, sin tarjetas ni fondos de relleno. No se muestra una leyenda adicional sobre situaciones reportadas. Cada pestaña muestra una tabla alineada con el margen lateral del título del modal (1,5 rem), sin padding adicional en el panel, con fecha y título; acompañamientos agrega el tipo **Individual** o **Familiar**. El texto completo no se incluye en las filas: al pulsar el título se abre el detalle del registro dentro del modal, con fecha, tipo cuando corresponda y texto completo. **Volver a la tabla** regresa al listado; cambiar de pestaña reinicia el detalle. Cada alumno puede tener múltiples registros de ambos tipos. La pestaña de bitácoras ofrece **Nueva bitácora** y la de acompañamientos **Nuevo acompañamiento**, para el especialista autorizado y Superadmin; la creación de instrumentos usa su sección independiente. El botón de creación correspondiente a la pestaña activa comparte la misma fila del pie del modal con **Cerrar**, sin ubicarse debajo de la tabla en otra fila. Cada botón abre un segundo **ResponsiveDialog**, independiente del listado, con alumno, grupo, fecha, título y texto. El formulario de acompañamientos incluye un selector obligatorio **Individual / Familiar**. **Guardar bitácora** o **Guardar acompañamiento** agrega el registro, cierra el diálogo de creación y recarga la tabla sin reemplazar los anteriores. El éxito se notifica mediante el toast global: **Bitácora guardada correctamente.** o **Acompañamiento guardado correctamente.**, sin mensaje fijo dentro del modal. No se muestra un toast de éxito ante errores o al cancelar. Los errores mantienen abierto el formulario. **Cancelar**, la X o cerrar el diálogo descartan el formulario sin iniciar un guardado. Cambiar de pestaña descarta el formulario sin guardar; cerrar reinicia la selección. El expediente del alumno mantiene su presentación de solo lectura. En **Seguimientos realizados**, las bitácoras se muestran en una tabla con fecha y título, y los acompañamientos en otra con fecha, tipo (Individual / Familiar) y título, usando el mismo formato de tablas que las demás secciones del perfil. Pulsar un título muestra el texto completo y **Volver a la tabla** regresa al listado, sin controles de creación o edición.
- Las observaciones conservan el `POST` de la sección 1.3: `{ date, title, body }`. La API nueva no modifica los reportes docentes ni crea un segundo historial de observaciones.
- Fechas calendario válidas `YYYY-MM-DD`; títulos/nombres de hasta 160 caracteres; descripciones y apartados de hasta 10.000 caracteres. El contenido se trata como texto, no como HTML. Los errores de validación y autorización no guardan registros.
- La entrada `src/app/api/teacher/students/[id]/psychopedagogy/profile/route.ts` declara `GET` y `POST` explícitamente y delega en el mismo controlador con sus parámetros originales. Para comprobar el registro real de la ruta, una petición sin sesión debe devolver `404` con `Content-Type: application/json` y `{ "error": "Alumno no disponible." }`; una página HTML de error no prueba que las guardas ni el controlador se ejecutaron. En desarrollo, si esta ruta devuelve HTML mientras la ruta vecina `/psychopedagogy` devuelve JSON, verificar que se está consultando el servidor de Koru y reiniciarlo con `npm run dev:webpack` para reconstruir el registro de rutas sin Turbopack. No aplicar migraciones por un `404` HTML: los errores de tablas o columnas faltantes del controlador devuelven `503` JSON; comprobar primero `npx prisma migrate status`.
- Los estados de carga y error del modal de seguimientos conservan el margen lateral del título (`px-6`) y separación vertical (`py-3`), sin agregar padding al panel de la tabla. Si el servidor devuelve HTML en vez de JSON, el modal no muestra excepciones del parser: para un `404` indica «La API del perfil psicopedagógico no está disponible. Actualizá la página y volvé a intentar.»; para otras respuestas no JSON indica «El servidor devolvió una respuesta inesperada. Intentá nuevamente.». Al fallar un guardado conserva abierto el formulario; los errores JSON de la API mantienen su mensaje original.
- La UI de **Estilo de aprendizaje y temperamento** usa `readLearningReportAction(studentId)` y `saveLearningReportAction(studentId, description)` en `server/learning-report.actions.ts`, en el modal de Psicopedagogía; el perfil del alumno utiliza únicamente la acción de lectura. Estas acciones de Next ejecutan directamente los mismos controladores protegidos: la sección no depende de un `fetch` del navegador a `/profile`. La acción de escritura fija `section: "learning"`, conserva validación y autoría de sesión y no permite agregar registros de otras secciones. Al abrir se muestran título, alumno y grupo encima de un panel amplio con el reporte guardado. El ícono de lápiz **Editar descripción**, dentro de la esquina superior derecha del panel, transforma ese mismo recuadro en un textarea precargado, sin contenedores anidados, títulos ni etiquetas visibles adicionales. En el modal, el único botón del pie cambia de **Cerrar** a **Guardar descripción**, asociado al formulario mediante `form`; la X sigue cerrando el modal. En el perfil del alumno no se muestran lápiz, formulario ni controles de guardado o cancelación. **Guardar descripción** actualiza el único registro y vuelve a leerlo; se confirma el guardado y se conserva el formulario ante errores. Las otras tres secciones mantienen su transporte; Superadmin puede crear acompañamientos, intervenciones e instrumentos con autoría de sesión.
- La descripción es única por alumno; los acompañamientos, intervenciones e instrumentos son registros fechados con autoría e historial. No se incluyen borrado, adjuntos, diagnósticos ni estados de seguimiento en este alcance.
- Persistencia aditiva: `20261024120000_add_psychopedagogy_profile` y `20261024130000_allow_superadmin_learning_profile`. La segunda conserva las autorías docentes existentes y agrega autoría de usuario para Superadmin sin crear perfiles docentes ficticios; requiere al menos un autor mediante restricción de base de datos. La migración `20261024140000_allow_superadmin_followups` agrega autoría de usuario a bitácoras y acompañamientos, permite `teacherId` nulo solo con otro autor presente y conserva registros y autorías anteriores, sin backfill ni perfiles docentes ficticios. `20261024150000_allow_superadmin_interventions` extiende ese mismo patrón a intervenciones: agrega `authorUserId` nullable con índice y FK a `user` (`ON DELETE RESTRICT`), vuelve opcional `teacherId` y exige al menos uno de los dos autores mediante `CHECK`. No modifica ni rellena registros existentes; conserva sus autores docentes. `20261024160000_classify_psychopedagogy_instruments` agrega el enum nullable `PsychopedagogyInstrumentKind` sin valor predeterminado y extiende el mismo patrón de autoría a instrumentos (`authorUserId`, FK restrictiva, índice y `CHECK` que exige autor docente o usuario). Conserva intactos los registros y autores anteriores; no reclasifica, rellena ni reinicia datos. Generar Prisma con `npm run prisma:generate` antes de compilar y reiniciar el servidor Next si ya estaba ejecutándose: el singleton de Prisma en desarrollo puede conservar el modelo anterior aunque el cliente en disco esté actualizado. Un `PrismaClientValidationError` al guardar con `teacherId: null` después de esta migración requiere revisar ese cliente cargado, no volver a aplicar la migración. Aplicar migraciones al destino configurado con `npx prisma migrate deploy`, sin reset ni backfill de registros anteriores.
- Pruebas sin base de datos: `node --test tests/integration/psychopedagogy*.test.mjs`.

## 2) Operaciones existentes sin endpoint HTTP dedicado

Hoy varias operaciones viven como **Server Actions** (acopladas al frontend), no como API pública:

- Auth:
  - `signInAction`
  - `signUpAction`
  - `signOutAction`
- Blog:
  - `createBlogPostAction`
  - `createBlogCommentAction`
- CMS:
  - `saveCmsDraftAction`
  - `publishCmsAction`

Archivos:
- `src/modules/auth/server/auth-actions.ts`
- `src/modules/blog/server/blog.actions.ts`
- `src/modules/cms/server/cms-text.actions.ts`

## 3) Endpoints recomendados a desarrollar

La propuesta está pensada para desacoplar UI de backend y facilitar integraciones futuras.

## 3.1 Prioridad Alta (núcleo CMS + Blog)

### Blog público
1. `GET /api/blog/posts`
- Listar posts publicados.

2. `GET /api/blog/posts/{slug}`
- Obtener detalle de un post publicado.

3. `POST /api/blog/posts/{slug}/comments`
- Crear comentario público.

### Blog admin
1. `GET /api/admin/blog/posts`
- Listar posts (draft + published) con filtros básicos.

2. `POST /api/admin/blog/posts`
- Crear post.

3. `PATCH /api/admin/blog/posts/{id}`
- Editar post.

4. `POST /api/admin/blog/posts/{id}/publish`
- Publicar post.

5. `POST /api/admin/blog/posts/{id}/unpublish`
- Pasar post a draft.

6. `DELETE /api/admin/blog/posts/{id}`
- Eliminar post.

### CMS landing
1. `GET /api/cms/landing`
- Obtener contenido publicado.

2. `GET /api/admin/cms/landing/draft`
- Obtener borrador actual.

3. `PUT /api/admin/cms/landing/draft`
- Guardar borrador.

4. `POST /api/admin/cms/landing/publish`
- Publicar borrador.

## 3.2 Prioridad Media (Páginas y bloques)

El schema Prisma ya define `Page` y `PageBlock`; faltan endpoints:

1. `GET /api/pages/{slug}`
- Render público por slug.

2. `GET /api/admin/pages`
- Listado admin de páginas.

3. `POST /api/admin/pages`
- Crear página.

4. `PATCH /api/admin/pages/{id}`
- Editar metadata/estado.

5. `DELETE /api/admin/pages/{id}`
- Eliminar página.

6. `GET /api/admin/pages/{id}/blocks`
- Listar bloques de una página.

7. `PUT /api/admin/pages/{id}/blocks`
- Reemplazar/reordenar bloques.

8. `PATCH /api/admin/pages/{id}/blocks/{blockId}`
- Actualizar bloque puntual.

9. `DELETE /api/admin/pages/{id}/blocks/{blockId}`
- Eliminar bloque puntual.

## 3.3 Prioridad Media-Alta (Donaciones)

El schema Prisma ya contempla `Donation` y proveedores; faltan rutas operativas:

1. `POST /api/donations/checkout`
- Crear intención/checkout en proveedor.

2. `POST /api/webhooks/donations/{provider}`
- Recibir confirmaciones de pago.

3. `GET /api/donations/{id}/status`
- Consultar estado de una donación.

4. `GET /api/admin/donations`
- Listado admin de donaciones.

## 3.4 Prioridad Baja (operación y observabilidad)

1. `GET /api/health`
- Estado básico del servicio.

2. `GET /api/ready`
- Verificación de dependencias críticas (DB, auth, storage).

## 4) Criterios simples para implementación

Para mantener esta capa superficial y consistente:

1. Prefijo `/api/admin/*` para todo lo que requiera rol admin.
2. Convención REST simple (`GET`, `POST`, `PATCH`, `DELETE`).
3. Respuestas homogéneas:
- éxito: `{ ok: true, data }`
- error: `{ ok: false, error, code }`
4. Validación de entrada con Zod en todos los endpoints nuevos.
5. Mantener Server Actions durante transición, pero migrar gradualmente a endpoints.

## 5) Estado resumido

1. Endpoints HTTP ya implementados: **2** (`/api/auth/[...all]`, `/api/uploads/blog`).
2. Operaciones de negocio ya implementadas pero sin endpoint dedicado: **7** (auth/blog/cms vía Server Actions).
3. Endpoints recomendados para completar la base: **~25** (según prioridad).
