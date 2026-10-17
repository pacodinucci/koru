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
- Pantalla: `/dashboard/psicopedagogia`, desde el menú **Psicopedagogía**.
- Acceso: `TEACHER` y `ADMIN_TEACHER`, con perfil docente activo y alumno activo asignado a un grupo activo del docente.
- `GET`: devuelve `{ entries }` con las bitácoras propias del alumno seleccionado, ordenadas por fecha descendente. No se cachea.
- `POST`: recibe JSON `{ date: "2026-02-28", title: "Seguimiento", body: "Texto libre" }`.
- Campos obligatorios: fecha calendario válida `YYYY-MM-DD`, título de hasta 160 caracteres y texto de hasta 10.000 caracteres. Se recortan espacios al inicio/final; el texto conserva sus saltos de línea y no interpreta HTML.
- Respuestas: `201 { ok: true }` al crear; `400 { error }` para datos inválidos; `404 { error }` si el alumno no está disponible; `503 { error }` si falta aplicar la migración; `500 { error }` ante otros errores.
- Persistencia: modelo independiente `PsychopedagogyEntry`; no crea reportes ni comparte contenido con familias. La fecha de la entrada es independiente del momento de creación.
- Instalación: revisar y aplicar la migración `20260930120000_add_psychopedagogy_entries` con el procedimiento de despliegue de la base (`npx prisma migrate deploy` aplica **todas** las migraciones pendientes); luego generar el cliente con `npm run prisma:generate`. No se debe ejecutar contra una base sin confirmar primero el destino.
- Pruebas sin base de datos: `node --test tests/integration/psychopedagogy.test.mjs tests/integration/psychopedagogy-ui.test.mjs`.

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
