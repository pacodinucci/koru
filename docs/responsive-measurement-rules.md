# Responsive Measurement Rules

This repo should not normalize all layout measurements to `vh` or `vw`.

For admin, dashboard, editor, and preview work, use a mixed unit strategy that preserves predictability while still allowing responsive layouts.

## Default Strategy

- Use `px` or `rem` for controls, panel padding, borders, radii, shell spacing, and interaction targets.
- Use `%`, `fr`, `minmax()`, and flex/grid sizing for layout distribution.
- Use `clamp()` where sizes should scale smoothly across breakpoints.
- Use `svh` or `dvh` instead of raw `vh` when a viewport-height effect is intentional.

## Avoid By Default

- Do not use `vw` for general paddings and spacing.
- Do not use `vh` for persistent editor geometry or saved editable values.
- Do not apply one global unit rule to every property.

## Editor Guidance

- Keep shell tokens and content tokens separate.
- Save stable editor values in `px` or `rem`.
- Use breakpoint overrides when editable content needs different behavior across sizes.
- Use `%` for relative placement inside containers when that relationship matters.
- Treat viewport units as explicit exceptions, not the default system.

## Practical Mapping

- Controls and chrome: `px` or `rem`
- Panel widths: `px`, `rem`, `clamp()`, or constrained layout sizing
- Layout columns and zones: `%`, `fr`, `minmax()`
- Relative element positions: `%`
- Typography: `px` or `rem`, optionally with `clamp()`
- Full-screen or hero-height effects: `svh` or `dvh` when intentional

## Why

This keeps the editing experience easier to reason about, avoids fragile viewport coupling, and makes responsive behavior more intentional across admin and dashboard surfaces.
