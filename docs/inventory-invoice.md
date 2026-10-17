# Registrar un ingreso de inventario

El modal tiene tres pestañas con paneles separados: **Tomar foto**, **Subir archivo** y **Carga manual**. En Carga manual se muestra una planilla de cinco filas iniciales con exactamente dos columnas: selector de producto y cantidad. Cada fila tiene una papelera alineada a su derecha, fuera de la tabla y sin una tercera columna; el botón identifica la fila mediante su nombre accesible y su texto emergente. Los controles se integran sin borde ni aro de foco dentro de una cuadrícula de celdas; la celda activa se distingue por su fondo. «Agregar producto» está debajo de la tabla y añade otra fila; el total de compra está al pie de la carga manual. Proveedor, fecha y total conservan sus valores al cambiar de pestaña; en foto/archivo el total permanece junto a los datos comunes. Las filas manuales completamente vacías no se envían; una fila parcialmente completada debe corregirse o quitarse. No se muestran leyendas explicativas; se mantienen errores, advertencias y datos interpretados. Las flechas izquierda/derecha y las teclas Inicio/Fin permiten cambiar de pestaña; la captura y revisión de una foto permanecen dentro de Tomar foto.

Foto/cámara, archivo y carga manual comparten la misma confirmación revisada. **El proveedor, la fecha y el total de la compra se ingresan manualmente en todos los modos**: la lectura no los extrae ni los completa. El total se guarda una sola vez por compra, separado de los costos unitarios opcionales. Analizar una imagen, PDF o planilla prepara un borrador sin modificar el stock; se revisan productos, cantidades en unidad de catálogo y costos antes de confirmar. La carga manual no llama a OpenAI y funciona sin su clave. La acción de servidor manual anterior se conserva por compatibilidad.

## Configuración del servidor

- `OPENAI_API_KEY`: opcional. Sin esta clave, analizar devuelve 503 con «La lectura de facturas no está configurada. Podés usar el ingreso manual.» No exponerla con un prefijo `NEXT_PUBLIC_`.
- `OPENAI_INVOICE_MODEL`: opcional, predeterminado `gpt-4.1-mini`; el modelo elegido debe soportar imágenes, PDF y salidas estructuradas de Responses.
- Se usa `fetch` nativo hacia `https://api.openai.com/v1/responses`, sin SDK ni dependencias nuevas. Tiempo máximo de proveedor: 45 segundos; ruta de análisis: 60 segundos.
- El proveedor recibe la imagen/PDF completo o los valores estructurados de la planilla (no el archivo Excel/CSV), más el catálogo actual (ID, nombre y unidad). Evaluar la autorización institucional para enviar facturas a OpenAI. `store:false` evita almacenamiento de Responses, pero no constituye una garantía adicional sobre las políticas de retención del proveedor. No se registran documentos, claves ni errores internos en estas rutas.

### Persistencia: requisito previo al nuevo ingreso

Antes de habilitar la nueva confirmación, generar el cliente Prisma con el esquema actualizado y aplicar, mediante el procedimiento autorizado del despliegue, `prisma/migrations/20261016220000_add_inventory_purchases/migration.sql`. **Esta implementación solo agrega el archivo SQL; no aplicó la migración a ninguna base real.** La generación del cliente y la comprobación de tipos corresponden a la integración posterior de backend y UI.

La migración PostgreSQL es aditiva: crea `InventoryPurchase`, agrega `InventoryMovement.purchaseId` nullable y sus índices/FK con borrado restringido. No modifica datos ni inventa totales históricos. Las compras nuevas requieren esta migración y el cliente generado; los movimientos anteriores conservan `purchaseId = null`.

## Analizar

`POST /api/operations/inventory/invoice`, multipart con exactamente un campo `file`.

Requiere `inventory.operate` **antes** de leer el cuerpo, parsear planillas o consultar el proveedor. Admite JPEG, PNG, WebP, PDF, XLSX, XLS y CSV. Imágenes/PDF comprueban MIME y firma; las planillas exigen extensión y validación de contenido, nunca solo MIME. Límite de archivo: **4 MiB (4.194.304 bytes), inclusive**. El cuerpo multipart se limita durante la lectura a ese tamaño más 16 KiB de cabeceras/separadores, antes de parsearlo; un despliegue puede imponer un límite menor. Una firma válida no equivale a una validación completa del documento: el proveedor puede rechazar archivos corruptos.

Respuesta 200: `{ok:true,draft:{supplier,invoiceNumber,lines,warnings}}`. Cada línea contiene `description`, `invoiceQuantity`, `invoiceUnit`, `productId`, `stockQuantity`, `unitsPerInvoiceUnit`, `unitCost`, `confidence` y `note`. `supplier` siempre es `null` (se conserva por compatibilidad de tipos), incluso si el modelo intenta devolverlo. No se solicita proveedor ni fecha en el esquema de OpenAI; el número de factura es opcional. Los demás campos desconocidos son `null`; las advertencias se presentan en español. `unitCost` siempre significa costo por **unidad de stock**, nunca total de factura/línea.

El proveedor devuelve JSON de esquema estricto. Se validan estructura, límites numéricos y pertenencia de IDs al catálogo. El documento se trata como datos, no instrucciones. El prompt exige dejar sin resolver las coincidencias ambiguas y no crear productos. Rechazos, salidas incompletas, JSON inválido y errores/timeout de proveedor producen un mensaje seguro, sin propagar detalles internos.

### Planillas: interpretación local y límites

Se usa la dependencia `xlsx` ya instalada, sin ejecutar fórmulas, macros ni enlaces ni descargar URLs. Los valores se envían como `input_text` estructurado a OpenAI para interpretar envases y buscar coincidencias con el catálogo; nunca como `file_data`. Las celdas numéricas de Excel mantienen su valor sin formato; las cadenas (por ejemplo `1,50`) no se convierten arbitrariamente. Las filas son arrays densos, no objetos construidos desde encabezados: `__proto__`, `constructor` y `prototype` pueden ser texto, nunca claves derivadas de encabezados.

| Formato | Validación previa al proveedor |
| --- | --- |
| CSV | UTF-8 estricto, BOM opcional; separador coma, punto y coma o tabulación; comillas dobles escapadas y saltos dentro de comillas. Al menos dos columnas, ancho uniforme; se omiten solo registros físicos totalmente vacíos. MIME vacío/genérico, CSV común, texto plano o Excel; requiere `.csv`. |
| XLSX | Requiere `.xlsx`, ZIP con directorio central/local coherentes y CRC válido, contenido OOXML de hoja de cálculo y workbook. Antes de `xlsx.read`: hasta 128 entradas y 8 MiB expandidos totales, descompresión nativa acotada, tamaños locales verificados, sin cifrado/ZIP64/multidisco/comentarios ZIP, rutas duplicadas o peligrosas, DTD ni entidades. Se inspeccionan rangos y direcciones de celdas. No admite ZIP arbitrario renombrado. |
| XLS | Requiere `.xls`, firma y cabecera CFB coherentes y stream Workbook/Book BIFF8. Antes del parser se validan los grafos FAT/miniFAT y el árbol de directorio (sin ciclos, hasta 128 entradas y streams acotados); no se admiten storages anidados ni DIFAT extendido. Se verifican rangos y hojas; se rechazan formatos antiguos/no compatibles con mensaje seguro. |

**Hasta 5 hojas, 1000 filas por hoja, 30 columnas, 10000 celdas en total y 100000 caracteres de texto JSON estructurado**, inclusive. Las filas/columnas vacías dentro del rango también cuentan; las hojas ocultas no se omiten. Si cualquier parte excede el límite se rechaza el documento completo: no hay truncamiento silencioso. No se aceptan planillas vacías, celdas de error, fórmulas Excel (aunque tengan resultado almacenado), macros, objetos incrustados ni vínculos externos. Hay que exportar como valores antes de subirlas. En CSV, texto como `=1+1` permanece una cadena inerte, no se evalúa.

Mensajes específicos (400, antes de llamadas pagas):
- «La planilla está vacía, dañada o tiene un formato no compatible.»
- «La planilla supera los límites: 5 hojas, 1000 filas por hoja, 30 columnas, 10000 celdas o 100000 caracteres.»
- «El XLSX está dañado, no es una planilla compatible o supera los límites de descompresión (8 MiB y 128 archivos).»
- «La planilla contiene fórmulas o vínculos externos. Exportala como valores y volvé a subirla.»

Las defensas acotan la exposición a la versión instalada de `xlsx`; no equivalen a un sandbox ni corrigen todos sus posibles defectos. No se agregaron dependencias ni se actualizó el paquete.

### Conversión y costos

- Factura: 2 cajas x12; catálogo: unidad → 24 unidades y factor 12.
- La misma factura; catálogo: caja → 2 cajas y factor 1.
- Factura: 2 cajas sin tamaño declarado; catálogo: unidad → cantidad, factor y costo quedan `null`, confianza baja y revisión humana.
- Un producto no identificado queda sin cantidad/costo resueltos. La extracción no crea productos automáticamente.
- El servidor verifica multiplicación y factor: si difieren las unidades exige tamaño de paquete explícito extraído de la factura. No infiere tamaños por costumbre o nombre del catálogo. Si el resultado no cabe en Decimal(12,3), queda sin resolver.
- El esquema interno de extracción incluye `packageSize`, `sourceUnitCost` y `costBasis`, que no forman parte del contrato de UI. Se calcula costo de stock solo desde precio unitario explícito: precio por caja / factor, o precio por unidad de stock. Un total de línea, un origen desconocido o un resultado no representable en Decimal(12,2) dejan el costo `null`.
- La precisión de la lectura del documento y de la evidencia de envase depende del modelo: la revisión humana sigue siendo obligatoria.

Errores de análisis: 403 sin permiso; 400 archivo/formato inválido; 413 límite excedido; 503 sin clave; 502 error de extracción/proveedor. Todas las respuestas tienen `{ok:false,message:string}` y caché `private, no-store`.

## Confirmar el ingreso revisado

`POST /api/operations/inventory/invoice/confirm`, JSON:

```json
{
  "batchId": "ac5b3bb1-8eef-44c8-a16e-0ba8bffca111",
  "reviewed": true,
  "supplier": "Proveedor",
  "date": "2024-02-29",
  "totalAmount": 240,
  "invoiceNumber": "F-1",
  "lines": [{"productId":"ID_DEL_CATALOGO","quantity":24,"unitCost":10,"description":"Leche caja x12"}]
}
```

Requiere `inventory.operate`. `supplier` es obligatorio, se recorta y debe tener 1–200 caracteres; `date` es obligatorio y debe ser una fecha gregoriana real con formato exacto `YYYY-MM-DD` (años 0001–9999), sin espacios ni hora. Se validan bisiestos, incluido el siglo. Datos faltantes/inválidos devuelven 400: «Ingresá el proveedor (hasta 200 caracteres) y una fecha válida en formato AAAA-MM-DD.» `invoiceNumber` puede ser `null`; `unitCost` se puede omitir o enviar `null`. Entre 1 y 100 líneas, descripción no vacía de hasta 500 caracteres. Cantidad positiva con máximo tres decimales y menor que 1.000.000.000; costo no negativo con máximo dos decimales y menor que 10.000.000.000. `totalAmount` es obligatorio y debe ser un número JSON finito, no negativo, con máximo dos decimales y hasta **9.999.999.999,99** (Decimal(12,2)); **0 explícito es válido**, no equivale a un dato faltante. No se aceptan omisión, `null`, texto, negativos, infinitos ni precisión extra. Un total inválido devuelve 400: «Revisá los productos, las cantidades y los costos antes de confirmar.» No acepta números como texto ni campos adicionales. El cuerpo JSON está limitado a 128 KiB.

Se valida todo antes de escribir. Los productos se vuelven a consultar **dentro de una transacción serializable**. Se crea una única `InventoryPurchase` con ID igual al UUID del lote, proveedor, fecha, `totalAmount`, número de factura, huella SHA-256 y actor. Luego se insertan todos los movimientos `STOCK_IN` vinculados mediante `purchaseId`, con cantidad, costo, actor y motivo (proveedor, número y descripción), en la misma transacción. Se permiten varias filas del mismo producto. El total tipado de la compra es la fuente de verdad: no se duplica en productos/movimientos, no se infiere de las líneas y **no se distribuye ni altera `unitCost`**. Compra y movimientos se confirman juntos o se revierten juntos.

`occurredAt` guarda la fecha del ingreso a las **12:00:00.000 UTC** (`new Date(date + 'T12:00:00.000Z')`) tanto en compra como en movimientos; `createdAt` queda automático como auditoría. Cualquier error revierte el lote entero.

El cliente debe generar un UUID nuevo por lote y **reusar el mismo UUID y datos al reintentar**, incluso después de timeout. Los IDs de movimiento son deterministas por UUID e índice de línea. La compra guarda una huella SHA-256 de todos los datos normalizados y el actor, incluyendo proveedor recortado, fecha y `totalAmount`; se conserva además la huella en el motivo por compatibilidad, pero el total nunca se lee desde ese texto. En un reintento se comprueban la huella, metadatos y total de la compra, además del conjunto completo de movimientos y sus vínculos. Cambiar total, proveedor, fecha, líneas o actor con el mismo UUID da 409 sin escrituras; reintentar con solo espacios externos diferentes en proveedor conserva la identidad del lote. El mismo lote confirmado devuelve éxito sin nuevas escrituras; otro contenido/actor con el mismo UUID devuelve 409: «Este lote ya fue confirmado con otros datos.» Si existen movimientos deterministas de una versión anterior sin compra asociada, también se devuelve 409: no se adivina el total ni se vuelve a agregar stock. Los conflictos de clave/serialización se reintentan en nuevas transacciones hasta tres intentos; un resultado de commit incierto devuelve un error seguro, no un éxito supuesto. No se usa `skipDuplicates` ni se eliminan huellas al revertir movimientos. Cambiar orden de líneas también cambia el lote. Un UUID diferente no detecta una factura duplicada comercialmente: la persona debe evitar confirmar dos veces con UUID distintos.

Éxito: `{ok:true,message:"Ingreso de stock registrado."}`. Errores: 400 datos/productos inválidos; 403 sin permiso; 409 lote incompatible; 500 fallo de registro con instrucción de reintentar el mismo lote. El cliente solo permite corregir un primer rechazo verificado 400/403: ante un 500, conflicto de lote u otra respuesta incierta conserva bloqueados el total, los datos y el UUID, y reintenta el cuerpo serializado idéntico. Un borrador ya incierto no se desbloquea por un rechazo posterior; solo un éxito verificado lo consume. Un fallo de invalidación de caché posterior al commit no convierte el ingreso confirmado en un error aparente.

## Crear un producto faltante

Con permiso de configuración, la última opción de cada selector es **Crear producto**. Abre un segundo diálogo responsive con nombre, unidad y stock mínimo; no hay formularios de creación desplegables por fila. Al guardar, el producto se incorpora al catálogo del borrador y queda seleccionado en la fila de origen, con cantidad y costo pendientes de revisión. Cancelar conserva la selección y los datos previos. Mientras el diálogo está abierto no se puede cambiar de modo, editar filas ni confirmar el ingreso; durante el guardado tampoco se puede cerrar ni volver a enviar. Los errores se muestran dentro del diálogo sin perder el formulario. Sin permiso, la opción no se ofrece y la acción de servidor mantiene su propia autorización.

La UI puede llamar explícitamente a `createInvoiceProductAction(FormData)` con `name`, `unit` y `minimumStock`. Requiere `requireOperationsSuperAdmin('inventory.configure')`. Nombre: 2–120 caracteres; unidad: 1–30; ambos recortados. Stock mínimo no negativo y representable en Decimal(12,3). Devuelve `{ok:true,product:{id,name,unit},message:"Producto creado."}` o un error seguro. La duplicación de nombre/unidad tiene mensaje propio. Crear un producto no registra stock.

## Verificación sin proveedor ni base reales

```text
node --test tests/integration/inventory-invoice.test.mjs tests/integration/inventory-invoice-spreadsheets.test.mjs tests/integration/inventory-purchase-total.test.mjs
npx tsc --noEmit --incremental false --pretty false
```

Las pruebas transpilan módulos en memoria con el patrón existente de integración, simulan permisos, transporte OpenAI y transacciones. Generan fixtures XLS/XLSX con `xlsx` en memoria y cubren CSV/UTF-8, límites de ZIP/planilla, fórmulas, proveedor ignorado, fechas y reintentos, atomicidad y regresión del ingreso manual. Las pruebas S6 cubren total obligatorio y límites, almacenamiento único, vínculos, costos independientes, rollback, reintentos concurrentes, conflictos históricos y estructura aditiva de esquema/migración. No leen `.env` ni necesitan claves. Las pruebas no sustituyen una prueba de concurrencia contra PostgreSQL, lectura real con OpenAI o una revisión autenticada del flujo móvil/escritorio.
