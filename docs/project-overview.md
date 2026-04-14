# Documentación General del Proyecto Koru

Este documento describe el proyecto de forma integral y **a nivel superficial**:
- alcance funcional actual,
- arquitectura general,
- rutas web y de dashboard,
- endpoints API,
- modelo de datos y próximos pasos.

No entra en detalle fino de cada feature para permitir cambios futuros sin fricción.

## 1) Resumen del proyecto

Koru es una aplicación full-stack en Next.js con tres piezas principales:
1. Sitio web público (landing + blog).
2. Dashboard admin con CMS de landing.
3. Gestión de blog desde admin.

El proyecto está preparado para crecer hacia:
- páginas dinámicas (`Page` + `PageBlock`),
- módulo de donaciones (`Donation`),
- y más secciones admin.

## 2) Stack tecnológico

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma + PostgreSQL (Neon)
- Better Auth
- Zod
- React Hook Form
- Cloudinary (uploads de imágenes para blog)

## 3) Arquitectura (vista rápida)

### Frontend y server
- `src/app/*`: rutas App Router.
- `src/modules/*/views`: vistas por dominio (home, blog, auth, admin).
- `src/modules/*/components`: componentes de UI por dominio.

### Lógica de negocio
- `src/modules/*/server/*.actions.ts`: Server Actions usadas por formularios.
- `src/modules/*/server/*.repository.ts`: acceso a datos con Prisma.

### API HTTP
- Route Handlers en `src/app/api/*`.
- Auth centralizado en Better Auth.
- Upload de imágenes del blog vía Cloudinary.

## 4) Mapa de rutas web (actual)

## 4.1 Rutas públicas

1. `/`
- Landing pública renderizada con contenido publicado del CMS.
- Vista: `HomeView -> LandingView`.

2. `/blog`
- Listado de posts publicados.
- Vista: `BlogListView`.

3. `/blog/[slug]`
- Detalle de post publicado + comentarios + formulario de comentario.
- Vista: `BlogPostView`.

4. `/sign-in`
- Login para área admin.
- Vista: `SignInView`.

5. `/sign-up`
- Alta de usuario admin inicial.
- Vista: `SignUpView`.

## 4.2 Rutas de dashboard (requieren sesión)

1. `/admin`
- Editor CMS de landing (borrador/publicación).
- Vista: `AdminHomeView -> CmsLandingEditor`.

2. `/admin/blog`
- Alta y listado de posts del blog.
- Vista: `AdminBlogPageView + AdminBlogView`.

## 4.3 Rutas visibles en navegación admin pero aún no implementadas

En el sidebar existen entradas de navegación con `href: "#"` (placeholders):
1. `Pages`
2. `Donations`
3. `Security`
4. `Settings`

## 4.4 Rutas web sugeridas a desarrollar (no implementadas)

Para no limitar la web pública solo a landing/blog, se recomienda crear:
1. `/about` (quiénes somos / enfoque pedagógico)
2. `/programs` (programas y propuestas)
3. `/community` (comunidad y actividades)
4. `/donate` (página pública de donación)
5. `/contact` (contacto institucional)

Estas rutas pueden apoyarse en el modelo `Page`/`PageBlock` ya existente en Prisma.

## 5) Mapa de API (actual)

1. `GET|POST /api/auth/[...all]`
- Endpoint de Better Auth para sesión y autenticación.

2. `POST /api/uploads/blog`
- Upload autenticado de imágenes para el editor de blog.

Documentación extendida de endpoints actuales + propuestos:
- `docs/api-endpoints.md`

## 6) Operaciones actuales por Server Actions

Actualmente varias operaciones de negocio no exponen endpoint HTTP dedicado:

### Auth
1. `signInAction`
2. `signUpAction`
3. `signOutAction`

### CMS landing
1. `saveCmsDraftAction`
2. `publishCmsAction`

### Blog
1. `createBlogPostAction`
2. `createBlogCommentAction`

## 7) Modelo de datos (superficial)

Entidades principales en Prisma:

### Autenticación
1. `User`
2. `Session`
3. `Account`
4. `Verification`

### CMS y web
1. `CmsTextEntry`
2. `Page` (estructura para páginas dinámicas)
3. `PageBlock` (bloques por página)

### Blog
1. `BlogPost`
2. `BlogComment`

### Donaciones
1. `Donation`

## 8) Flujos funcionales actuales

### 8.1 CMS de landing
1. Admin autenticado entra en `/admin`.
2. Edita texto/estructura visual de secciones en modo borrador.
3. Publica cambios y la landing pública (`/`) consume la versión publicada.

### 8.2 Blog
1. Admin crea posts desde `/admin/blog`.
2. Si el estado es publicado, se refleja en `/blog` y `/blog/[slug]`.
3. Visitantes pueden comentar en cada post.

### 8.3 Auth
1. Acceso admin vía `/sign-in`.
2. Sesión resuelta por Better Auth.
3. Rutas admin redirigen a `/sign-in` cuando no hay sesión.

## 9) Variables de entorno

Obligatorias para correr:
1. `DATABASE_URL`
2. `BETTER_AUTH_SECRET`
3. `BETTER_AUTH_URL`

Necesarias para features activas:
1. `CLOUDINARY_CLOUD_NAME`
2. `CLOUDINARY_API_KEY`
3. `CLOUDINARY_API_SECRET`

Preparadas para features futuras:
1. `MERCADO_PAGO_ACCESS_TOKEN`
2. `STRIPE_SECRET_KEY`
3. `PAYPAL_CLIENT_ID`
4. `PAYPAL_CLIENT_SECRET`

## 10) Estado actual y próximos pasos

## 10.1 Estado actual (implementado)
1. Landing pública editable desde admin.
2. Auth admin base.
3. Blog público + alta de posts + comentarios.
4. Upload de imágenes para blog.

## 10.2 Próximos pasos recomendados
1. Completar rutas web públicas adicionales (about/programs/community/donate/contact).
2. Implementar módulo `Pages` en dashboard + render público por slug.
3. Implementar módulo `Donations` (checkout + webhooks + panel admin).
4. Migrar gradualmente operaciones críticas a endpoints HTTP dedicados.

## 11) Estructura de carpetas (referencia)

```txt
src/
  app/
    (auth)/
    admin/
    api/
    blog/
  modules/
    admin/
    auth/
    blog/
    cms/
    home/
    landing/
  lib/
prisma/
docs/
```
