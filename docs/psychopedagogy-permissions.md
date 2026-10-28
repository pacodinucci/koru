# Permisos de Psicopedagogía

En **Roles → Psicopedagogía** se configuran dos permisos independientes:

- **Ver** (`psychopedagogy.view`): permite abrir la sección y consultar los perfiles, seguimientos, intervenciones e instrumentos de todos los alumnos.
- **Gestionar** (`psychopedagogy.manage`): junto con **Ver**, permite editar la descripción de aprendizaje y registrar observaciones, acompañamientos, intervenciones e instrumentos. No habilita escritura sin **Ver**.

El menú, la página y las API usan estos permisos, no el nombre del rol. El acceso al dashboard y a los expedientes de alumnos se configura por separado con sus permisos existentes. El perfil dentro del expediente sigue siendo de consulta; la edición se realiza desde Psicopedagogía.

Los roles personalizados con base ADMIN no reciben acceso automáticamente. Para un gestor sin perfil docente, la autoría se registra con el usuario autenticado. Los docentes psicopedagógicos mantienen el requisito de tener un perfil docente activo para escribir.

## Administración de roles

SUPERADMIN siempre puede acceder a Roles y administrar los permisos de todos los roles, aunque esos permisos no estén asignados a su propio rol. Esto incluye **Ver** y **Gestionar** de Psicopedagogía, tanto al crear como al editar un rol. La autoridad se determina por el rol base del usuario autenticado, no por el nombre o la clave de un rol personalizado.

Los demás gestores solo pueden otorgar permisos que poseen; los permisos existentes que no pueden editar se conservan. Se mantienen las protecciones de los roles del sistema y la validación de que cada permiso exista en el catálogo y en la base de datos. El rol SUPERADMIN conserva todos los permisos al guardarse.

## Actualización de la base de datos

La migración `20261024180000_psychopedagogy_permissions` registra ambos permisos y conserva el acceso de los roles con base SUPERADMIN y de los roles con base PSYCHOPEDAGOGY_TEACHER que ya tenían acceso al dashboard. No activa roles inactivos ni modifica las otras asignaciones.

Aplicá las migraciones mediante el procedimiento habitual del entorno antes de usar los nuevos permisos. No alcanza con actualizar el frontend: el guardado de roles valida que los permisos existan en la base de datos.
