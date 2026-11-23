# Published CMS caching and public navigation

Published CMS reads use Next's explicit data cache and React request memoization. No `cacheComponents` setting or dependency change is required. Global text, per-slug text overrides and per-slug images have distinct keys, one shared `cms-published` tag and a five-minute safety revalidation interval. Home and layout share the same readers. Reader failures propagate; defaults returned by layout error handling are not stored as successful CMS data.

## Publication and drafts

`invalidatePublishedCms(): void` immediately expires that tag with `revalidateTag("cms-published", { expire: 0 })`. Call it **after a successful owning write or transaction commit**, not from transaction helpers. Subsequent requests reload published content; React memoization remains request-scoped.

| Write path | Invalidation boundary |
| --- | --- |
| Global text publication | Successful SQL statement |
| Per-page text publication | Successful page/block transaction |
| Image-map publication | Successful image transaction |
| Combined page text and images | Successful outer transaction, once |
| Publish all draft images | Successful SQL statement |
| Global multi-page publication | Each successfully committed publication; later failure does not hide earlier committed changes |
| Editable page save (dashboard repository) | Owning repository calls the shared invalidator after success |
| Draft text/image saves | None |

Published text no longer falls back to draft values or draft page overrides. Unpublished values use public defaults/base content; page overrides require `PUBLISHED` status and explicit published overrides. Images already require published URL/public ID. This intentionally removes the legacy draft fallback: keeping it would both expose unpublished edits and require public invalidation on draft-only saves. Legacy draft-only content must be explicitly published to appear publicly. Publication computes overrides relative to **published** base text, so an unpublished global edit cannot silently remove a page's intended published override.

Preview/draft readers remain uncached and separate. Transaction-client helpers neither cache reads nor invalidate tags. A failed statement/rolled-back transaction never invalidates public content.

## Public shell identity

Public-pages and blog layouts do not authenticate for navigation. Blog content authentication and listing behavior are unchanged by this unit. The client navigation wrapper requests `/api/public/navigation` once on mount, with same-origin credentials and `cache: "no-store"`. There is no polling, global identity variable, local-storage cache or CMS scan. The endpoint authenticates the current request and returns only display name, email and dashboard-access capability, with `Cache-Control: private, no-store, max-age=0` and `Vary: Cookie` on success and failure.

The existing navigation renders signed-in controls and uses the existing sign-out server action once identity arrives. Failed identity loads leave anonymous navigation; a fresh mount retries. Unmounted requests are aborted and ignored. Explicit identity props and editor preview mode bypass the fetch. Hidden preview chrome mounts no navigation consumer.

`LandingPageLayout` contains a Suspense boundary around its search-parameter consumer. Its fallback retains page children without chrome; static HTML therefore retains content while navigation/footer resolve on hydration, and `cmsPreview=1` continues to suppress chrome. Browser-level visual checks and the production build remain useful seam checks, especially for hydration and editor selection controls.

## Verification

Run the database-free behavioral tests:

```sh
node --test tests/integration/fluid-cms-cache.test.mjs tests/integration/fluid-public-shell.test.mjs
```

They transpile the actual modules into VM fixtures, model request and persistent caches separately, and exercise publication failures, tag expiry, draft isolation, private navigation responses, mount cancellation and preview bypass. They do not measure production CPU savings or replace a production-build/browser check.
