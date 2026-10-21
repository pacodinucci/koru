# Acuerdos de seguimiento para docentes

Superadmin gestiona acuerdos dirigidos a un docente. Cada docente lee y acepta únicamente sus propios acuerdos publicados. Este circuito es independiente de los acuerdos de alumnos y familias.

## Uso

1. Como superadmin, abrí **Docentes → ⋮ → Acuerdos de seguimiento**. La flecha permite volver al listado de docentes.
2. Elegí **Nuevo acuerdo**, completá título y texto y, si corresponde, adjuntá PDF, DOC, DOCX, JPG, PNG o WEBP de hasta 10 MB. Guardá el borrador; todavía no es visible para el docente.
3. Podés editar el borrador o reemplazar su adjunto. Si no seleccionás otro archivo, se conserva el actual. **Publicar** habilita la lectura del docente y bloquea la edición definitivamente.
4. Como docente, abrí **Mis acuerdos de seguimiento**, leé el texto y el adjunto y elegí **Dar conformidad**. La constancia muestra la persona y fecha originales registradas por el servidor; repetir la solicitud no las reemplaza.
5. Superadmin puede eliminar borradores o publicados después de confirmar. Se elimina también el adjunto y la conformidad, si existen.

## Permisos y rutas

| Acceso | Permiso |
| --- | --- |
| `/dashboard/teachers/[teacherId]/follow-up-agreements` | Solo SUPERADMIN; gestión por docente. |
| `/dashboard/mis-acuerdos-seguimiento` | Solo TEACHER y ADMIN_TEACHER; publicados propios. |
| Crear, editar, publicar y eliminar | Solo SUPERADMIN; editar únicamente borradores. |
| Dar conformidad | Solo el usuario docente destinatario de un acuerdo publicado. |
| Abrir adjunto | SUPERADMIN o destinatario de un publicado, mediante descarga autenticada. |

**Acuerdos de Seguimiento** (`/dashboard/acuerdos-seguimiento`) conserva su función anterior: acuerdos sobre alumnos que el docente redacta para las familias. **Reportes** y **Editar perfil** siguen disponibles en el menú docente con sus permisos previos.

## Contrato técnico

- El repositorio de acuerdos docentes devuelve filas serializadas con fechas ISO, nombre del adjunto y `hasAttachment`, nunca identificadores ni URLs de almacenamiento.
- `POST /api/teacher-follow-up-agreements` recibe multipart `teacherId`, `title`, `body` y `file` opcional. `PATCH /api/teacher-follow-up-agreements/[id]` recibe `title`, `body` y `file` opcional; omitirlo conserva el adjunto. No se envían datos de alumnos, familias, autor ni aceptante.
- Publicación y conformidad usan `POST /api/teacher-follow-up-agreements/[id]/publish` y `/consent`, sin cuerpo. Eliminación usa `DELETE /api/teacher-follow-up-agreements/[id]`.
- El enlace del archivo usa `/api/teacher-follow-up-agreements/[id]/attachment`, un proxy autenticado de bytes. Las validaciones de firma, tipo, tamaño y permisos pertenecen al servidor; las restricciones de la UI no sustituyen ese control.

## Verificación enfocada

`node --test tests/integration/teacher-follow-up-agreements-ui.test.mjs` cubre guardas de página, handlers públicos, multipart, borrador/publicación, confirmación de eliminación, enlace protegido y conformidad sin fechas inventadas. `node --test tests/integration/dashboard-agreements-navigation.test.mjs` protege ambas navegaciones de acuerdos y las entradas anteriores.
