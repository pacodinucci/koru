# Kanban interno

## Acceso y alcance

Entrá en **Dashboard → Kanban** (`/dashboard/kanban`). El espacio es compartido: todas las personas autorizadas por `requireDashboardUser` (`dashboard.access`) pueden gestionar todos los tableros. No hay tableros privados ni se otorga acceso al dashboard a otros usuarios.

## Organizar el trabajo

Las creaciones de tableros, columnas y tarjetas se abren en un diálogo responsive: panel inferior en móvil y ventana centrada en escritorio. Todo el contenido del diálogo usa Montserrat, incluidos títulos y controles. **Cancelar**, el botón de cierre o Escape permiten salir sin guardar; durante el guardado no se permite cerrar. Los errores de creación se muestran dentro del diálogo para corregir los datos sin perder el borrador.

1. Seleccioná **Nuevo tablero**, completá el nombre y, si querés, una descripción. Guardá para crearlo. Los botones de la lista permiten cambiar entre tableros.
2. Usá **Editar tablero** para cambiar sus datos. **Eliminar tablero** abre una confirmación que advierte que también elimina todas sus columnas y tarjetas. **Cancelar** no guarda cambios.
3. En un tablero, seleccioná **Nueva columna**. Definí su nombre y color. Cada columna permite **Editar**, **Eliminar** y cambiar su orden con los botones de flecha, también accesibles por teclado.
4. Si una columna tiene tarjetas, su eliminación exige elegir explícitamente otra columna de destino. La confirmación solicita al servidor moverlas y eliminar la columna en una sola operación. Si no existe otra columna, creá una primero. Una columna vacía no necesita destino.
5. Seleccioná **Nueva tarjeta** dentro de una columna. El título es obligatorio; descripción, responsable interno y vencimiento son opcionales. Las tarjetas ofrecen **Editar** y **Eliminar** con confirmación. Elegí **Sin responsable** o borrá la fecha al editar para quitar esos datos.
6. Mové una tarjeta arrastrándola a otra columna o con su selector **Mover**, disponible por teclado y en dispositivos sin arrastre. La tarjeta se agrega al final de la columna de destino.

El nombre y la cantidad de tarjetas identifican cada columna; el color es complementario, no la única señal. Las fechas se presentan como día/mes/año y se editan como fechas de calendario sin desplazamiento por zona horaria.

## Guardado y errores

- Durante la carga o el guardado, los controles quedan bloqueados y se anuncia el estado. No se muestran movimientos ni datos nuevos como guardados antes de que termine la acción del servidor.
- Después de guardar se vuelven a consultar los tableros, sus tarjetas y las personas responsables. **Actualizar** permite consultar cambios de otros usuarios; no hay actualización en tiempo real.
- Un rechazo muestra el mensaje del servidor sin cambiar las tarjetas mostradas. El formulario permanece abierto con los valores ingresados para corregirlos y volver a guardar.
- Si la escritura terminó pero falla la consulta posterior, el mensaje aclara que los cambios se guardaron. Usá **Reintentar** para consultar el estado actual en lugar de repetir la escritura.
- **Reintentar** y **Actualizar** vuelven a consultar el servidor y cierran el editor después de una carga exitosa; guardá o copiá antes cualquier borrador que quieras conservar.

## Integración y verificación local

`KanbanWorkspace` se exporta desde `src/modules/kanban/components/kanban-workspace.tsx`, no requiere props y consulta las acciones de `src/modules/kanban/server/kanban.actions.ts`. La página del dashboard debe renderizarlo después de autorizar con `requireDashboardUser`; el cliente no reemplaza esa protección. Las acciones también deben autorizar cada operación.

Los tipos compartidos se importan de `src/modules/kanban/types.ts`. El cliente usa el contrato L5 de `odd/tasks/internal-kanban.md`: fechas ISO en lectura, `YYYY-MM-DD` en formularios, `null` para quitar responsable o vencimiento, identificador del tablero en operaciones de columnas/tarjetas y orden explícito al reordenar columnas. La reubicación de tarjetas al eliminar columnas es responsabilidad atómica del servidor.

Pruebas renderizadas, sin base de datos ni dependencias nuevas:

```sh
node --test tests/integration/kanban-ui.test.mjs
node node_modules/eslint/bin/eslint.js src/modules/kanban/components/kanban-workspace.tsx src/modules/kanban/components/kanban-editor.tsx src/modules/dashboard/components/dashboard-shell.tsx
```

Las pruebas transpilan TSX y sustituyen acciones y hooks siguiendo el patrón de integración existente. Cubren navegación, carga, formularios y payloads, confirmaciones, colores, orden, destino obligatorio, selector accesible, arrastre, bloqueo durante escrituras, ausencia de actualización optimista y errores. No sustituyen una comprobación en navegador de foco, contraste, desplazamiento horizontal y arrastre nativo.

Fuera del alcance: archivos adjuntos, comentarios, integraciones externas y archivado.
