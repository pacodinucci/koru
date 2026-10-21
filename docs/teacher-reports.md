# Reportes de docentes

## Acceso

Solo **superadmin** puede crear, consultar, descargar, eliminar o cambiar la marca de visibilidad de los reportes de docentes. Esta sección es independiente de los reportes de alumnos.

**La marca «Visible para el docente» es para una habilitación futura.** Por ahora, el docente no puede consultar ningún reporte sobre su perfil, aunque la marca esté activada. Tampoco habilita acceso a familias ni a otros roles administrativos.

## Abrir los reportes

1. Entrá a **Docentes** con una cuenta superadmin.
2. En la columna **Acciones**, abrí el botón de tres puntos verticales del docente.
3. Elegí **Reportes**. Se abre una página con su nombre y su tabla de reportes.

El mismo menú conserva **Editar perfil**, con los campos y la asignación de grupos habituales. Desde los reportes, **Volver a docentes** regresa a la tabla principal.

## Cargar y consultar

- Elegí **Nuevo reporte**, ingresá un título de 2 a 160 caracteres y usá **una** de estas alternativas:
  - Escribí el reporte con el editor enriquecido (negrita, cursiva, listas y otros formatos). El contenido serializado admite hasta 10.000 caracteres, incluido el formato.
  - Adjuntá un archivo **PDF, DOC o DOCX** con contenido y de hasta **10 MB**.
- No combines un archivo y texto en la misma carga. Elegí **Guardar reporte**. El nuevo reporte se guarda privado.
- La tabla muestra fecha, autor, título, tipo y marca de visibilidad. **Ver reporte** permite leer el contenido o **Descargar** el adjunto.
- La descarga usa una ruta autenticada; no se publican enlaces privados de almacenamiento.

## Visibilidad y eliminación

El control **Visible para el docente** guarda la marca para uso futuro, sin dar acceso al docente en esta versión. Si falla el guardado, la marca conserva su valor anterior y se muestra el error.

El botón **Eliminar reporte** abre una confirmación. **Cancelar** conserva el reporte; **Eliminar definitivamente** lo borra sin posibilidad de deshacer. Si falla, el reporte permanece y podés volver a intentarlo.

Cuando no hay reportes, la pantalla lo indica y permite crear el primero. Si falla la carga de la lista, muestra **Reintentar**, sin revelar detalles internos del servidor.

## Contrato de integración

La página `/dashboard/teachers/[teacherId]/reports` verifica `SUPERADMIN` antes de consultar datos y devuelve una página no encontrada si el perfil no existe. La UI consume `listTeacherReports(teacherId)` y envía al cliente solo campos seleccionados y una fecha ISO; nunca la URL privada del archivo.

| Operación | Ruta y datos |
| --- | --- |
| Crear | `POST /api/teachers/[teacherId]/reports`, multipart: `title` y `content` **o** `reportFile` |
| Marcar visibilidad | `PATCH /api/teacher-reports/[id]/visibility`, JSON `{ "visibleToTeacher": true }` (o `false`) |
| Eliminar | `DELETE /api/teacher-reports/[id]` |
| Descargar | `GET /api/teacher-reports/[id]/download` |

Las mutaciones esperan la respuesta `{ "ok": true }`; los errores pueden incluir `error`. El servidor mantiene la validación y la autorización de cada operación, incluida la descarga. Cambiar una marca no debe relajar ninguna de esas comprobaciones.
