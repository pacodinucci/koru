---

# 4. Stack tecnológico definido

## 4.1 Stack principal obligatorio

Este proyecto debe desarrollarse utilizando **exactamente** el siguiente stack base:

- **Next.js** con **App Router**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Prisma**
- **Neon Tech PostgreSQL**
- **Zod**
- **React Hook Form**

## 4.2 Backend y render

La aplicación debe usar las capacidades nativas de Next.js para resolver tanto el sitio público como el dashboard admin.

Usar:

- **Server Components** por defecto cuando tenga sentido
- **Client Components** solo cuando sean necesarios
- **Server Actions** para operaciones del dashboard cuando convenga
- **Route Handlers** para endpoints externos, uploads, webhooks y flujos de donación

## 4.3 Base de datos

La base de datos elegida para el proyecto es:

- **Neon PostgreSQL**

El acceso y modelado de datos debe realizarse con:

- **Prisma**

## 4.4 UI y estilos

La interfaz debe construirse con:

- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes reutilizables base

No usar:
- CSS frameworks alternativos
- Bootstrap
- Material UI
- Chakra UI
- styled-components como base del proyecto

## 4.5 Validación y formularios

Los formularios y validaciones deben implementarse con:

- **React Hook Form**
- **Zod**

## 4.6 Autenticación admin

La autenticación del dashboard admin debe resolverse con una sola librería, a definir al inicio del desarrollo.

Opciones permitidas:

- **Better Auth**
- **Auth.js**
- **Clerk**

Preferencia inicial:
- **Better Auth**, salvo que Codex detecte una razón técnica fuerte para usar otra de las opciones permitidas.

## 4.7 Storage de imágenes

Las imágenes y assets subidos desde el dashboard deben almacenarse en un servicio externo.

Opciones permitidas:

- **Cloudinary**
- **UploadThing**
- **AWS S3**

Preferencia inicial:
- **Cloudinary**

No almacenar imágenes en el repositorio.

## 4.8 Donaciones

El módulo de donaciones debe implementarse con una arquitectura desacoplada del proveedor.

Proveedores permitidos para una primera integración:

- **Mercado Pago**
- **Stripe**
- **PayPal**

La implementación inicial debe dejar una capa abstracta para poder reemplazar el proveedor sin reescribir todo el sistema.

## 4.9 Deploy esperado

Entorno sugerido:

- **Frontend / app en Vercel**
- **Base de datos en Neon**
- **Storage en Cloudinary**
- Variables sensibles manejadas por **environment variables**

---

# 4.10 Dependencias y criterios de selección

Codex debe priorizar librerías maduras, simples y compatibles con el stack elegido.

Evitar agregar dependencias innecesarias.

No introducir:

- CMS externos
- constructores visuales de terceros
- editores complejos no solicitados
- librerías pesadas sin justificación clara

---

# 5. Decisiones técnicas cerradas

## 5.1 Arquitectura general

Este proyecto debe implementarse como una **aplicación web full-stack en Next.js**, donde conviven:

- el sitio público institucional
- el dashboard admin
- la capa de acceso a datos
- las rutas necesarias para uploads, preview y donaciones

No usar:

- WordPress
- Strapi
- Sanity
- Contentful
- ningún CMS externo como núcleo del proyecto

La administración del contenido debe resolverse con un **dashboard propio**.

## 5.2 Router

Usar exclusivamente:

- **Next.js App Router**

No usar Pages Router.

## 5.3 Modelo de edición

La edición del contenido debe hacerse mediante:

- bloques estructurados
- formularios controlados
- campos definidos
- configuración administrable

No implementar:

- editor HTML libre
- constructor drag-and-drop complejo en la primera versión
- libertad total de layout

## 5.4 Tipado y calidad

El proyecto debe mantenerse con:

- TypeScript estricto
- tipos claros para entidades y DTOs
- validación con Zod en entradas críticas
- separación razonable entre UI, lógica y acceso a datos

## 5.5 Prioridad de desarrollo

Codex no debe empezar por detalles estéticos finos ni animaciones avanzadas.

El orden correcto es:

1. setup del proyecto
2. autenticación admin
3. schema Prisma
4. CRUD base de páginas y bloques
5. render público de páginas
6. dashboard de edición
7. módulos dinámicos
8. donaciones
9. polish visual final

## 5.6 Restricciones de alcance para la primera versión

En la primera versión, no priorizar:

- multi-idioma
- editor visual drag-and-drop avanzado
- analytics complejos
- CRM
- newsletter
- donaciones recurrentes complejas
- sistema de permisos granular avanzado

Primero debe quedar sólido el núcleo del CMS interno y el flujo de donación simple.

---
