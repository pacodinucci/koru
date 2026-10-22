# Kanban interno

Organiza el trabajo del equipo en **Dashboard → Kanban** (`/dashboard/kanban`). Los tableros son compartidos entre todos los usuarios internos con `dashboard.access`. El seguimiento y los avisos son personales; no se envían correos.

## Ruta rápida

1. Selecciona **Nuevo tablero** y escribe un nombre; la descripción es opcional. Los botones de la lista permiten cambiar de tablero.
2. Usa **Nueva columna** para definir un nombre y un color. Para cambiar el orden, arrastra su encabezado: al cruzar el centro de otra columna, las columnas se reacomodan antes de soltar y la columna arrastrada muestra un borde rayado. El orden se guarda únicamente al soltar; cancelar el arrastre restaura el orden anterior. Con teclado, enfoca el nombre y presiona **Espacio** para tomar la columna, **← / →** para previsualizar su posición, **Enter** para confirmar o **Escape** para cancelar. No hay botones de flecha.
3. Abre el menú de tres puntos de una columna y elige **Agregar tarjeta**. El diálogo ya tiene seleccionada esa columna. El título es obligatorio; la descripción, el responsable interno y el vencimiento son opcionales.
4. Arrastra una tarjeta a otra columna o abre **⋯** en la tarjeta y usa su selector **Mover**, accesible por teclado y en dispositivos sin arrastre. Antes de soltarla, la columna de destino muestra un espacio con borde punteado y una previsualización elevada de la tarjeta, con sombra; la tarjeta original se atenúa. Esta previsualización no cambia tarjetas ni contadores y no guarda nada. Desaparece al salir de la columna o cancelar el arrastre. Al soltarla aparece inmediatamente al final del destino y cambian los contadores, sin esperar a la base de datos.

Las creaciones y las confirmaciones usan el diálogo responsive compartido: panel inferior en móvil y ventana centrada en escritorio, con Montserrat en todo su contenido. **Cancelar**, el cierre y Escape permiten salir sin guardar. Durante una operación, el cierre entra en la cola; no cancela una escritura ya enviada. Los errores se muestran dentro del editor sin perder el borrador.

## Las siete opciones de columna

| Opción | Qué hace |
| --- | --- |
| **Seguir esta columna / Dejar de seguir esta columna** | Cambia solo tu seguimiento. La columna muestra los nombres de sus seguidores. Recibes avisos por tarjetas agregadas, modificadas, puestas o quitadas de espera y movidas hacia o desde esa columna. Seguir no cambia las preferencias de otras personas. |
| **Color de la columna** | Abre una paleta compartida. El color elegido se marca como seleccionado y se usa en el borde superior y en un fondo suave. **Sin color** quita el color personalizado. Los colores anteriores que no estén en la paleta aparecen como **Color actual**. |
| **Agregar tarjeta** | Abre el diálogo de creación para esa columna. No crea una tarjeta hasta guardar. |
| **Habilitar tareas en espera / Deshabilitar tareas en espera** | Permite marcar cada tarjeta por separado con **Poner en espera**. No pausa todas las tarjetas ni cambia su responsable, vencimiento, contenido, columna o posición. Deshabilitar la opción conserva las marcas existentes; **Quitar espera** sigue disponible para retirarlas. |
| **Cambiar nombre** | Cambia únicamente el nombre. Conserva tarjetas, color, orden, seguimiento y configuración. |
| **Archivar columna** | Oculta la columna y sus tarjetas del tablero, sin borrarlas. Se recuperan desde **Archivados**. |
| **Mover a la papelera** | Pide confirmación y después oculta la columna y sus tarjetas, sin borrarlas. Se recuperan desde **Papelera**. No es una eliminación definitiva. |

Las tarjetas muestran el título, el responsable y el vencimiento en un formato compacto. Abre **⋯** en una tarjeta para consultar su descripción, moverla, editarla, eliminarla o cambiar su estado de espera. Las columnas se ajustan a su contenido y no tienen botón de creación al pie; usa **Agregar tarjeta** en el menú de la columna. Cuando están vacías, muestran un espacio con el mismo ancho, relleno y altura base de una tarjeta compacta (título de una línea y metadatos), con borde punteado y sin texto visible, que sigue aceptando tarjetas arrastradas. El borde se dibuja por dentro, sin agregar altura. El estado vacío se anuncia a los lectores de pantalla.

El nombre y la cantidad de tarjetas identifican cada columna; el color es complementario, no la única señal. Las fechas se muestran como día/mes/año y se editan como fechas de calendario, sin desplazamientos por zona horaria.

## Recuperar o eliminar

- **Archivados** muestra las columnas archivadas del tablero actual. **Restaurar** recupera la columna con sus tarjetas, color, seguimiento y marcas de espera.
- **Papelera** permite **Restaurar** o **Eliminar definitivamente**. La eliminación definitiva abre una segunda confirmación explícita y advierte que borrará la columna y todas sus tarjetas sin posibilidad de deshacer. No se ejecuta automáticamente ni al mover a la papelera.
- Las columnas archivadas deben restaurarse y pasar por la papelera antes de eliminarlas definitivamente.
- El servidor impide archivar o enviar a la papelera la última columna activa. Las columnas inactivas no aceptan ediciones normales ni movimientos de entrada o salida, y nunca aparecen en el selector **Mover**.
- **Editar tablero** conserva la gestión habitual de sus datos. **Eliminar tablero** es otra acción destructiva, con confirmación explícita: borra todas sus columnas y tarjetas, incluidas las archivadas o en la papelera.
- Las tarjetas mantienen **Editar** y **Eliminar** con confirmación. Selecciona **Sin responsable** o borra la fecha al editar para quitar esos datos.

No hay vencimiento ni limpieza automática de la papelera.

## Mis avisos

**Mis avisos** muestra la cantidad pendiente de lectura. Abre la lista para consultar tus avisos persistentes y usa **Marcar aviso como leído** para actualizar su marca. Cada aviso muestra su fecha y **Sin leer** o **Leído**. El texto histórico sigue disponible aunque la tarjeta o la columna ya no exista; no hace falta abrir el elemento para leerlo.

Los avisos se consultan y se marcan para la persona autenticada. El cliente no elige destinatarios ni acepta una identidad arbitraria. No hay correos ni notificaciones externas. **Actualizar** consulta los cambios de otras personas; no hay actualización en tiempo real.

## Guardado y errores

- Solo la carga inicial bloquea los controles. Durante el guardado siguen habilitados: los clics se registran en una cola FIFO y se ejecutan después de la operación anterior y su actualización de datos. Esto incluye el reordenamiento de columnas, menús, paleta, seguimiento, espera, recuperación, avisos y diálogos. Mientras se guarda el orden de columnas se conserva su previsualización; si se rechaza, vuelve al orden confirmado y se muestra el error. La cola valida que sigan existiendo las mismas columnas activas antes de guardar el orden. Si mueves una tarjeta y seleccionas **Nueva columna**, el diálogo se abre al terminar el movimiento, sin perder el clic.
- El guardado usa el proveedor de toasts compartido: **Guardando…** y después **Cambios guardados.** No hay texto de guardado dentro del tablero ni del formulario.
- Puedes seguir arrastrando: cada movimiento aparece de inmediato y se guarda por turno. Las consultas anteriores no deshacen los movimientos posteriores pendientes. Las demás operaciones esperan confirmación para mostrar sus cambios.
- El formulario captura sus valores al seleccionar **Guardar**. Repetir el envío mientras está pendiente no duplica escrituras; un evento de un formulario anterior no puede enviar ni cerrar uno nuevo.
- Antes de ejecutar una intención pendiente se vuelven a buscar el tablero, la columna y la tarjeta actuales. El seguimiento, las opciones de espera, las marcas por tarjeta y los cambios de color usan los datos más recientes al salir de la cola. Si el elemento ya no existe, cambió el tablero o quedó inactivo, se rechaza la acción en lugar de escribir sobre otro elemento.
- Si se rechaza un movimiento, se quita solo ese movimiento de la proyección y se recalculan tarjetas y contadores conservando los movimientos posteriores. Sin otros movimientos, vuelve exactamente a la columna y posición anteriores. Los demás rechazos mantienen el estado y el editor con su borrador. El error permanece visible y la cola continúa.
- Si la escritura terminó pero falla la consulta posterior, el mensaje aclara que los cambios se guardaron. Usa **Reintentar** para consultar el estado actual, no para repetir la escritura. Un movimiento confirmado no vuelve atrás por un error de consulta.
- **Reintentar** y **Actualizar** cierran el editor después de una carga exitosa. Guarda o copia antes el borrador que quieras conservar.
- La cola es local a esta pantalla. Al salir, se descartan las intenciones que no empezaron; una escritura ya enviada puede completarse.

## Integración y verificación local

`KanbanWorkspace` se exporta desde `src/modules/kanban/components/kanban-workspace.tsx`, no requiere props y usa las acciones de `src/modules/kanban/server/kanban.actions.ts`. La página y cada acción mantienen `requireDashboardUser` / `dashboard.access`; el cliente no reemplaza esa protección.

Los tipos compartidos vienen de `src/modules/kanban/types.ts`. Se conservan los contratos anteriores de CRUD: fechas ISO en lectura, `YYYY-MM-DD` en formularios, `null` para quitar responsable o vencimiento y tablero explícito en operaciones de columna/tarjeta. El contrato L7 de `odd/tasks/kanban-column-options.md` agrega seguimiento, espera, ciclos de vida y avisos personales. `getBoardAction` devuelve todas las columnas; el cliente separa activas, archivadas y papelera. El reordenamiento envía únicamente los identificadores activos. Los DTO anteriores sin campos nuevos se interpretan como activos, sin seguimiento ni espera.

La UI nunca llama al borrado destructivo anterior para simular papelera. Usa `setStatusLifecycleAction` para archivar, mover a la papelera o restaurar, y `permanentlyDeleteStatusAction` únicamente después de su confirmación separada. Consulta avisos sin destinatario y envía únicamente `{id}` al marcarlos como leídos.

Pruebas renderizadas, sin base de datos ni dependencias nuevas:

```sh
node --test tests/integration/kanban-ui.test.mjs
node node_modules/eslint/bin/eslint.js src/modules/kanban/components/kanban-workspace.tsx src/modules/kanban/components/kanban-editor.tsx src/modules/kanban/components/kanban-column-menu.tsx src/modules/kanban/components/kanban-panels.tsx
```

Las pruebas transpilan TSX y sustituyen acciones, hooks y primitivas de diálogo/menú. Cubren navegación y CRUD, siete opciones, selección de color, seguidores, espera individual y metadatos, recuperación y borrado confirmado por separado, avisos y marcas personales, DTO anteriores, destinos activos, eventos tardíos, capturas del formulario, cola FIFO, toasts, movimientos consecutivos inmediatos y errores/reversión.

No sustituyen la prueba en navegador de foco, teclado y submenús reales, contraste del fondo suave, vista móvil, desplazamiento horizontal o arrastre nativo. La persistencia, el aislamiento por usuario y las transacciones requieren las pruebas de acciones y una base de datos aislada autorizada. La generación de Prisma y la comprobación integrada de tipos corresponden a la integración de ambos cambios.

Fuera del alcance: archivos adjuntos, comentarios e integraciones externas.
