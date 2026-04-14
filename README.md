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
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
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
