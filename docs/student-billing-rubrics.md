# Armar los cargos de cada alumno con rubros

Los rubros reemplazan la selección de un único plan. El catálogo guarda el nombre y el importe **total**; cada alumno puede tener varias asignaciones independientes con sus propias cuotas y mes de inicio.

## Uso

1. Entrá a **Rubros** (`/dashboard/families/rubrics`). El catálogo se muestra en una tabla con nombre, importe total y estado. Usá el buscador para filtrar por nombre. Con permiso `families.manage`, elegí **Nuevo rubro** para abrir el diálogo adaptable y cargar nombre e importe; el botón **Editar** de cada fila abre el mismo tipo de diálogo para modificarlo.
2. Abrí una familia. En **Hij@s · Rubros por alumno**, el nombre de cada alumno enlaza a su ficha (`/dashboard/students/[id]`). Elegí **Agregar rubro** para abrir el diálogo adaptable del alumno correspondiente. Seleccioná rubro, cuotas, mes de inicio y **Descuento (%)** (de 0 a 100, con hasta dos decimales; inicialmente 0).
3. Revisá el bruto, el descuento, el neto y la vista previa de cuotas, y elegí **Guardar rubro**. Para agregar otro concepto, repetí la operación: no reemplaza los anteriores.
4. Consultá las asignaciones debajo de cada alumno: nombre, bruto, porcentaje e importe descontado, neto, cuotas y mes/año de inicio guardados en la asignación.
5. Usá el botón con ícono de lápiz **Editar rubro [nombre]** para abrir el diálogo con los valores actuales. **Guardar cambios** recalcula y reemplaza únicamente los cargos asociados impagos. El mes puede cambiar, pero se conserva el año original que indica el formulario.
6. Dentro del mismo diálogo, **Eliminar rubro** muestra una confirmación explícita. **Confirmar eliminación** quita esa asignación, su programación y sus cargos asociados impagos; **Cancelar eliminación** vuelve a la edición. No elimina el rubro del catálogo ni afecta otras asignaciones. Si algún cargo tiene pagos imputados, incluso parciales, el servidor bloquea tanto la edición como la eliminación y muestra el motivo sin cambiar los datos.

Durante el guardado o la eliminación se deshabilitan ambas operaciones y el cierre del diálogo para evitar envíos superpuestos. Al agregar un rubro correctamente, el diálogo se cierra y la próxima apertura muestra un formulario limpio para agregar otro. Si el alta falla, el diálogo permanece abierto con el error y los valores del formulario. El cierre depende de una confirmación explícita de éxito del servidor, no del texto del mensaje. Los diálogos de edición y eliminación conservan su respuesta visible.

Quienes solo tienen acceso de consulta pueden ver el catálogo y las asignaciones, pero no sus formularios de modificación. Solo los rubros activos aparecen como opciones nuevas.

## Cómo se distribuye el importe

| Asignación | Resultado |
| --- | --- |
| Materiales por $120.000 en 3 cuotas desde marzo | $40.000 en marzo, $40.000 en abril y $40.000 en mayo. |
| Materiales por $120.000 con 10% de descuento y 3 cuotas | Descuento de $12.000 sobre el total; neto $108.000, dividido en 3 cuotas de $36.000. |
| Rubro con 100% de descuento | Neto $0 y cuotas de $0, sin error de división. |
| Rubro de $100 en 3 cuotas, sin descuento | $33,33, $33,33 y $33,34; el ajuste de centavos conserva el total. |
| Matrícula por $25.000 en 1 cuota desde abril | El total se imputa en abril. |
| Rubro en varias cuotas desde diciembre | Los meses siguen consecutivamente, también al pasar al año siguiente. |

Al agregar, el selector indica el primer mes de cobro **del año actual**. Al editar, indica el **año original de la asignación**, que no cambia. Las cuotas admiten de 1 a 120; el descuento se calcula sobre el total y recién después se divide el neto, distribuyendo centavos sin alterar su suma. La vista previa reutiliza los cálculos monetarios del proyecto, pero no reemplaza la validación del servidor. Los pagos se registran por separado.

Editar el catálogo no recalcula asignaciones existentes: el nombre, bruto, descuento y neto de cada asignación son una copia tomada al guardarla. Al editar la asignación manteniendo el mismo rubro se conservan el nombre y bruto originales, aunque el catálogo haya cambiado. Un rubro vinculado inactivo sigue siendo seleccionable en esa edición; no se puede usar para una asignación nueva. Al elegir otro rubro se usa su nombre e importe activos actuales. Las asignaciones anteriores sin campos de descuento se muestran con bruto igual al total y descuento 0%.

## Consultar cargos pendientes y futuros

La **Ficha financiera** agrupa saldo, menú de opciones, registro de pagos, filtros y tabla **Cargos y movimientos** en un único contenedor de fondo blanco. La tabla abre con el filtro **Todos**. También está disponible al abrir la ficha desde el diálogo de administración de familias. El bloque de revisión **Cargos por alumno** ya no se muestra; las asignaciones se mantienen en **Hij@s · Rubros por alumno**.

- **Todos** conserva los cargos registrados (incluidos los saldados), los pagos, las condonaciones y las anulaciones del historial, y agrega las cuotas futuras proyectadas.
- **Pendientes** muestra únicamente cargos generados con importe todavía sin cubrir, incluidos los pagos parciales. Cada fila indica el importe original y su saldo **Pendiente**.
- **Futuros** muestra las cuotas de cronogramas ya guardados para meses posteriores al actual en Argentina que todavía no se generaron. Respeta el inicio efectivo, las cancelaciones y los números de cuota ya emitidos; utiliza los importes netos guardados, sin recalcular desde el catálogo actual.

Las filas **Futuro** son solo una proyección: no se guardan como movimientos, no se suman al saldo actual ni se ofrecen como conceptos para imputar pagos. Los cargos generados sin saldo pendiente figuran como **Saldado**. Los filtros no modifican los datos y muestran un mensaje específico cuando no hay cargos pendientes o futuros.

## Compatibilidad y preservación

- Las rutas anteriores de planes redirigen al catálogo de rubros y las acciones heredadas de creación/asignación están retiradas. El listado de familias muestra la cantidad de rubros asignados, no una cuota mensual derivada de planes.
- La ficha familiar conserva usuarios, responsables, alumnos, movimientos, pagos y permisos de condonación.
- En la ficha financiera, el menú con ícono de **tres puntos verticales (⋮)**, a la derecha de **Saldo actual** y con etiqueta accesible «Opciones de la ficha financiera», reúne **Agregar cargo** y **Condonar saldo**. Cada opción abre un diálogo adaptable; la condonación ya no muestra un formulario permanente. Las opciones respetan los permisos actuales y **Condonar saldo** solo aparece si hay saldo positivo. El diálogo solicita motivo e importe (hasta el saldo actual), conserva el formulario ante errores y permite cancelar sin registrar movimientos.
- **Agregar cargo** conserva los conceptos libres. Los identificadores de `BillingRubric` nunca se envían como `eventualChargeItemId`, que pertenece al catálogo heredado de otro modelo.
- La migración `20261021120000_student_billing_rubrics` elimina únicamente el catálogo anterior de planes y conceptos. Exige que no haya movimientos, pagos, recibos, programaciones ni planes asignados; si encuentra alguno, aborta sin completar cambios. No convierte los planes en rubros: el catálogo nuevo comienza vacío.
- La generación automática usa las programaciones explícitas; no vuelve a crear cargos a partir de planes heredados. No se reinicia la numeración global de recibos ni se eliminan archivos externos.
- Al asignar o editar, la programación y sus cargos vencidos se guardan en una sola transacción con bloqueo de la cuenta familiar: si falla un cargo, se revierte toda esa operación. El generador usa `createDueEventualInstallmentChargesInTransaction` cuando el llamador ya posee la transacción y el bloqueo; no vuelve a abrir transacciones por detectar una propiedad `$transaction` en el cliente. La generación periódica adquiere su propia transacción y bloqueo antes de llamar al mismo generador.

## Verificación

`node --test tests/integration/billing-rubrics-ui.test.mjs` ejecuta los componentes y sus callbacks con repositorios, acciones y hooks controlados, sin base de datos. Cubre la tabla/búsqueda/diálogos del catálogo, permisos de consulta y administración, diálogos de alta/edición, confirmación de eliminación, cargas útiles de las acciones, descuento sobre el total (incluido 100%), cuotas y centavos, copias históricas por alumno, año original, mensajes de bloqueo, controles pendientes, reapertura limpia, propiedades financieras y enlace de navegación. No prueba rutas, autorización real del servidor, persistencia ni interacción de navegador; la autorización y la lógica de persistencia se comprueban adicionalmente con dependencias simuladas en las pruebas de servicios; esto no sustituye una prueba completa contra base de datos ni una comprobación manual en navegador.

Pruebas focalizadas:

```bash
node --test tests/integration/billing-rubrics-core.test.mjs tests/integration/billing-rubrics-ui.test.mjs tests/integration/billing-rubric-routes.test.mjs tests/integration/billing-rubrics-family-list.test.mjs
```

Prueba SQL optativa (requiere `DATABASE_URL` y permiso de crear un esquema):

```bash
RUN_ISOLATED_RUBRIC_MIGRATION=1 node --env-file=.env --test tests/integration/billing-rubrics-migration.test.mjs
```

Esta última crea sus propias tablas en un esquema de nombre aleatorio dentro de una transacción que siempre revierte. No usa familias reales, no confirma cambios y no aplica la migración al esquema de la aplicación.
