# Calendario fluido: SSR inicial y navegación por API

Los calendarios de dashboard y familias conservan los datos iniciales del servidor. Cambiar fecha o vista consulta sólo la API del rango cuando falta en la caché cliente: ya no combina `router.replace` con un segundo fetch. No se precargan rangos adyacentes, para evitar trabajo no solicitado.

## Comportamiento implementado

| Interacción | Datos y URL |
|---|---|
| Abrir un enlace directo | SSR autorizado; `date` y `view` inicializan el calendario y su caché. `edit` abre la edición del dashboard y `event` el modal familiar. |
| Cambiar Día/Semana/Mes/fecha | Estado local inmediato y `history.pushState(null, "", url)`. Un GET de API si el rango no está cacheado; ninguna navegación RSC solicitada por el proveedor. |
| Volver a un rango visitado | Se reutiliza la caché de esa instancia del calendario, incluida la carga SSR inicial. |
| Atrás/adelante | `popstate` restaura fecha, vista y evento seleccionado; usa la misma caché/API. Se conservan los demás parámetros y el fragmento de la URL. |
| Seleccionar/cerrar un evento | Se mantiene `edit` o `event` en la URL. El modal familiar sigue siendo `FamilyEventDetailDialog`, con su `returnTo` civil para las acciones. Cerrar limpia el parámetro de selección. |
| Fallar una consulta | Se muestra «No se pudieron cargar los eventos.» y el botón «Reintentar». No se cachea el error como un rango vacío. |
| Recibir nuevos datos SSR tras una mutación/refresh | Se reemplazan eventos y próximos eventos, se reinicializa la caché y se invalidan las solicitudes anteriores. |

Los formularios y sus redirecciones existentes no cambian. La edición del dashboard conserva su hoja y su ruta de cierre existentes; no se pretende eliminar todas las navegaciones de formularios/modales, sino la duplicación al cambiar de rango.

## Límites de datos y fechas

- La caché vive en el proveedor cliente, nunca en un almacenamiento global entre usuarios.
- La clave es `view + start + end`; los límites vienen de `getRangeForView` y representan medianoches de Ciudad de México.
- Los cursores viajan como `YYYY-MM-DD`, no como instantes ISO. Se reconstruyen al mediodía local para aritmética civil estable, también en UTC, Argentina y Tokio.
- Fechas ausentes, malformadas o imposibles como `2026-02-30` usan el día actual de México; una vista desconocida usa `week`.
- Ambos endpoints mantienen sus verificaciones de acceso y sus repositorios autorizados. Las respuestas exitosas llevan `Cache-Control: private, no-store`; el fetch cliente también usa `cache: "no-store"`.
- Las solicitudes en vuelo del mismo rango se deduplican. Sólo la última selección puede actualizar los eventos visibles; una generación nueva de datos SSR impide que una respuesta anterior vuelva a contaminar la caché.
- Mientras se carga un rango nuevo, se retiran los eventos del rango anterior y se muestra «Cargando eventos…», en lugar de presentarlos bajo una fecha incorrecta.

### Integración con Next

Se pasa `null` como estado a la API de historial. Next copia su árbol interno y actualiza la URL canónica sin solicitar otra página. Reutilizar `window.history.state` copiaría la marca interna `__NA`, que hace que Next omita esa actualización y puede dirigir un refresh posterior al rango anterior.

## Dónde revisar

1. `src/modules/calendar/lib/calendar-navigation.ts`: parseo civil y preservación de URL.
2. `src/modules/calendar/lib/calendar-range-loader.ts`: caché inicial, concurrencia, errores y renovación SSR.
3. Proveedores de dashboard/familias y sus páginas/endpoints: integración, permisos y selección.
4. `tests/integration/fluid-calendar-navigation.test.mjs`: proveedores reales ejecutados con hooks, red e historial aislados; no requiere DB.

## Verificación reproducible

```sh
node --test tests/integration/fluid-calendar-navigation.test.mjs tests/integration/calendar-mexico-cursors.test.mjs tests/integration/calendar-mexico-policy.test.mjs
```

Cubre peticiones únicas sin navegación del router, carga SSR y caché, historial/query, carreras, errores HTTP/red/payload reintentables, renovación tras mutaciones, modal familiar y fechas civiles en UTC/Argentina/Tokio. Las pruebas de políticas ejercitan guardados y efectos secundarios con persistencia simulada, sin acceder a producción.

## Fuera de esta unidad

- Prefetch adyacente y animaciones fade/slide: quedan como opciones futuras, no requisitos de esta optimización de CPU.
- Caché compartida entre sesiones, actualización en tiempo real y cambios de autorización.
- Despliegues, cambios de almacenamiento o mediciones de ahorro real. La reducción de peticiones redundantes se verifica en pruebas; el ahorro de CPU en producción requiere métricas comparables.
