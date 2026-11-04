# Koru

Base inicial del proyecto CMS full-stack, construida siguiendo `docs/roadmap.md`.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma + Neon PostgreSQL
- Zod
- React Hook Form

## Requisitos

- Node.js 20+
- npm 10+

## Primer arranque

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Completar al menos estas variables en `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require&uselibpqcompat=true"
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```
3. Generar cliente Prisma:

```bash
npm run prisma:generate
```

4. Crear primera migración:

```bash
npm run prisma:migrate -- --name init
```

5. Levantar entorno local:

```bash
npm run dev
```

## Scripts útiles

- `npm run dev`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`

## Vista previa al compartir

La página principal publica un collage estático de cuatro fotos de espacios y naturaleza, sin fotos del equipo. Los posts publicados, tanto públicos como restringidos, exponen una vista previa pública con su título, descripción y primera imagen en el orden del artículo, aunque esté después del texto o dentro de una galería. Open Graph y Twitter usan esa misma imagen; si el post no tiene una imagen utilizable, su vista previa no anuncia ninguna imagen. El collage pertenece exclusivamente a la página principal: no se hereda desde el layout global ni se usa como respaldo del blog. Cada post declara su propia URL canónica y `og:url`, distintas de la portada.

Los posts restringidos mantienen protegido el contenido completo, los comentarios y las interacciones. Sin sesión, su URL muestra solo la vista previa y un enlace para iniciar sesión y volver al artículo, sin redirigir automáticamente a la página de acceso. Los borradores y los posts inexistentes no exponen vista previa. No se otorgan excepciones de acceso por el identificador del rastreador.

- `npm run share:generate`: sortea cuatro fotos distintas de la lista revisada en `scripts/generate-share-preview.mjs`, genera un JPEG de 1200 × 630 y actualiza `src/lib/share-preview.json`.
- `npm run test:share`: verifica selección, composición, metadatos y acceso a las vistas previas de los posts.

La imagen generada y el JSON deben incluirse juntos en el despliegue. No se regenera en cada visita ni automáticamente en cada build: así los rastreadores reciben siempre una imagen completa y estable. El generador usa Sharp, incluido por Next.js. Si falla la lectura o composición, se conserva la imagen publicada anteriormente.

Para renovar las fotos, ejecutar el generador y desplegar los cambios. Cada imagen tiene una URL basada en su contenido; las anteriores se conservan para enlaces que ya estén en caché. WhatsApp decide el formato final de la tarjeta y puede conservar vistas previas antiguas, por lo que no se garantiza una actualización inmediata de enlaces ya compartidos. `APP_URL` (o, en su defecto, `BETTER_AUTH_URL`) debe apuntar al dominio público HTTPS en producción, accesible sin autenticación.

## Documentación

- [Roadmap](docs/roadmap.md)
- [Documentación general del proyecto](docs/project-overview.md)
- [API y Endpoints (superficial)](docs/api-endpoints.md)

## Estado actual

- Fase 1 (setup): completada.
- Fase 2 (auth admin): pendiente.
- Fase 3 (schema Prisma): base creada y lista para evolucionar.

## Próximo hito recomendado

Integrar Better Auth para proteger `/admin` y habilitar el CRUD inicial de páginas y bloques.
