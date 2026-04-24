---
name: responsive-measurement-rules
description: Define layout and measurement rules for responsive editors, previews, and dashboard shells. Use when designing or refactoring admin/dashboard UI, CMS preview surfaces, responsive layout systems, spacing scales, sizing tokens, or persistence rules for editable positioning and dimensions. Prefer this skill whenever Codex must choose between px/rem, percent/fr, clamp(), or viewport units.
---

# Responsive Measurement Rules

Use these rules for dashboard, admin, editor, and preview work in this repo.

## Core Rule

Do not normalize all measurements to `vh` or `vw`.

Treat viewport units as special-purpose tools, not default units.

## Preferred Units

- Use `px` or `rem` for controls, paddings, internal spacing, borders, radii, panel chrome, and interaction targets.
- Use `%`, `fr`, `minmax()`, and flex/grid sizing for layout distribution.
- Use `clamp()` for sizes that should scale smoothly across breakpoints.
- Use `svh` or `dvh` instead of raw `vh` when viewport height must track the visible browser area.

## Avoid By Default

- Avoid `vw` for general padding and spacing.
- Avoid `vh` for persistent editor geometry, especially on mobile.
- Avoid tying editable content spacing directly to viewport size unless the effect is intentionally screen-relative.
- Avoid one global unit strategy for every property.

## Editor-Specific Rules

- Keep editor shell dimensions predictable and easy to reason about.
- Store control sizing, paddings, border widths, and radii in `px` or `rem`.
- Allow responsive overrides per breakpoint for content that genuinely needs different behavior.
- Favor explicit breakpoint overrides over automatic viewport-driven scaling for editable values.
- Preserve user expectations: a saved value should behave consistently when revisited.

## Recommended Mapping

- Shell spacing: `px` or `rem`
- Panel width: `px`, `rem`, `clamp()`, or layout constraints
- Section/content width: `%`, `max-width`, `minmax()`, `fr`
- Element position inside a section: `%` when relative placement matters
- Typography: `px` or `rem`, optionally wrapped in `clamp()`
- Viewport-height sections: `svh` or `dvh` only when intentional
- Gaps between layout regions: `px` or `rem`

## Decision Heuristic

Choose units based on the job:

- If the value should feel fixed and editable, use `px` or `rem`.
- If the value should relate to container size, use `%`.
- If the value belongs to layout distribution, use grid/flex with `fr`, `minmax()`, and constraints.
- If the value should scale across breakpoints without per-breakpoint overrides, consider `clamp()`.
- If the value should explicitly follow the visible screen height, use `svh` or `dvh`.

## For Admin And Dashboard Work

When implementing new editor or preview features:

- Keep shell/layout tokens separate from content tokens.
- Avoid storing viewport-coupled values unless the feature explicitly depends on viewport size.
- Make responsive behavior explicit by breakpoint when editing UX matters.
- Prefer predictable rendering over mathematically uniform scaling.

