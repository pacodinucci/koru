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

La web publica un collage estático de cuatro fotos de espacios y naturaleza, sin fotos del equipo. Open Graph y Twitter usan la misma imagen; los artículos del blog conservan su foto propia y usan el collage solo como respaldo.

- `npm run share:generate`: sortea cuatro fotos distintas de la lista revisada en `scripts/generate-share-preview.mjs`, genera un JPEG de 1200 × 630 y actualiza `src/lib/share-preview.json`.
- `npm run test:share`: verifica selección, composición y metadatos.

La imagen generada y el JSON deben incluirse juntos en el despliegue. No se regenera en cada visita ni automáticamente en cada build: así los rastreadores reciben siempre una imagen completa y estable. El generador usa Sharp, incluido por Next.js. Si falla la lectura o composición, se conserva la imagen publicada anteriormente.

Para renovar las fotos, ejecutar el generador y desplegar los cambios. Cada imagen tiene una URL basada en su contenido; las anteriores se conservan para enlaces que ya estén en caché. WhatsApp decide el formato final de la tarjeta y puede conservar vistas previas antiguas, por lo que no se garantiza una actualización inmediata de enlaces ya compartidos. `APP_URL` (o, en su defecto, `BETTER_AUTH_URL`) debe apuntar al dominio público HTTPS en producción, accesible sin autenticación.

## Avatar de usuario

Al registrarse con Google, Better Auth guarda la foto del perfil en `User.image`. La navegación pública y los dashboards muestran esa imagen; si no existe o no carga, conservan las iniciales como respaldo. No se descargan copias de la foto ni se agregan permisos de Google.

La foto se importa al crear la cuenta: este cambio no completa imágenes faltantes de cuentas existentes ni agrega sincronización en cada inicio de sesión. La identidad de la navegación pública se obtiene mediante una respuesta privada sin caché, nunca desde el contenido público compartido.

Pruebas: `node --test tests/integration/google-avatar.test.mjs`.

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
