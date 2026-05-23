# Landing render mode

## Default (current)

- `code-first` (default if env var is missing).
- Prioritizes hardcoded design/layout decisions while the landing is being finalized.
- Reduces CMS style interference in critical sections.

## Enable CMS mode later

Set:

```env
NEXT_PUBLIC_LANDING_MODE=cms
```

Behavior:

- `cms`: components read and apply CMS style inputs normally.
- `code-first`: components keep the design locked from code for safer iteration.

