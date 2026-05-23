# Image Performance Playbook

## Objetivo

Cerrar performance de imágenes con guardrails automáticos y comparación before/after.

## Guardrails automáticos

- `npm run perf:images:check`
  - Valida presupuesto de peso en imágenes referenciadas en `src`.
  - Config: `config/image-budget.json`.

## Métricas de inventario local

- `npm run perf:images:report`
  - Genera `perf/image-metrics.latest.json` con:
    - cantidad de imágenes
    - peso total
    - top 10 más pesadas

## Métricas web before/after (manual, producción)

Para Home y Blog List:

1. Lighthouse Mobile (3 corridas por URL).
2. Registrar:
   - LCP
   - Total Byte Weight (imágenes)
   - Image requests
3. Promediar y comparar contra baseline anterior.

## Criterio de éxito

- Reducción de bytes de imágenes transferidas.
- Mejora de LCP en mobile.
- Sin violaciones nuevas de presupuesto (`perf:images:check` en verde).
