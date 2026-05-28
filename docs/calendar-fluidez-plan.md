# Plan: Calendario más fluido (navegación Día/Semana/Mes/Fecha)

## Objetivo
Hacer que la navegación del calendario (cambio de fecha, día, semana y mes) se sienta instantánea y sin saltos visuales.

## Problema actual
- Cada cambio de vista/fecha depende de recarga server-driven.
- Se percibe latencia y “corte” entre estados.
- No hay transición visual suave ni prefetch del próximo rango.

## Resultado esperado
- Cambios de vista/fecha fluidos (UX “instantánea”).
- Menos bloqueos visuales.
- Conservación de estado de UI al navegar.

---

## Alcance técnico propuesto

### 1) Estado local del calendario (Client Component)
- Convertir la capa de interacción del calendario a componente cliente.
- Manejar `viewMode` y `dateCursor` con `useState`.
- Mantener render server para carga inicial de datos.

### 2) Navegación sin recarga dura
- Usar `router.replace(...)` para sincronizar URL (`date`, `view`) sin navegación completa.
- Envolver cambios en `useTransition` para no bloquear interacción.

### 3) Capa de datos por rango
- Traer eventos por rango (día/semana/mes) mediante endpoint/acción específica.
- Cachear por clave de rango (`view + start + end`).
- Evitar refetch de rangos ya visitados.

### 4) Prefetch inteligente
- Prefetch del rango siguiente y anterior al actual.
- Ejemplo:
  - Día: mañana y ayer
  - Semana: próxima y anterior
  - Mes: próximo y anterior

### 5) Transiciones visuales cortas
- Aplicar transición suave entre rangos (fade/slide de 120–180ms).
- Mostrar skeleton liviano solo cuando no haya datos cacheados.

### 6) Consistencia de selección de evento
- Mantener evento seleccionado al cambiar entre vistas cuando siga en rango.
- Limpiar selección si queda fuera del rango visible.

---

## Criterios de aceptación
1. Cambiar Día/Semana/Mes se percibe inmediato en UI.
2. Navegar fecha anterior/siguiente no produce “flash” duro.
3. URL se mantiene sincronizada (`date`, `view`).
4. Eventos ya visitados reutilizan cache (sin espera perceptible).
5. No se rompen textos con tildes (validar UTF-8).

---

## Riesgos
- Duplicar lógica entre server/client si no se separa bien el acceso a datos.
- Inconsistencias de timezone si el rango no se normaliza correctamente.

## Mitigaciones
- Definir util única para cálculo de rangos por vista.
- Normalizar fechas en zona horaria objetivo antes de consultar.

---

## Plan de implementación (pasos)
1. Extraer util de rangos (`day/week/month`) compartida.
2. Crear fetch por rango + cache en cliente.
3. Migrar controles de navegación a estado local + `router.replace`.
4. Agregar prefetch adyacente.
5. Agregar transiciones y skeleton condicional.
6. QA de navegación + selección + tildes/encoding.

---

## Notas para el próximo chat
- Prioridad: percepción de velocidad por encima de refactor grande.
- Mantener diseño actual; cambiar solo comportamiento.
- Evitar introducir librerías nuevas si no son necesarias.
