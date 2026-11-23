# Contacts table, live search and segmented filters

Status: Zustand migration implemented; automated checks and independent deterministic verification passed. Browser acceptance remains unverified.
Scope: `/dashboard/contactos`. Preserve existing contact permissions, data sources, API contracts and server-side pagination.

## 1. Goal

Make the Contacts list visually consistent with Families and make searching and filtering fluid, without replacing the table with a loading message after each interaction.

## 2. User requirements

- S1. “la tabla debe verse como la de familia (en la imagen)” and “me refiero a la seccion contactos”. Match the Families table reference: compact rows, rounded border, shared table components, status badges and pagination below the table.
- S2. “para los filtros tenemos que tener un selector como el de esta imagen que tambien lo encontramos en shadcn”. Use segmented selectors for source and status, with a visually distinct active option, following the supplied reference.
- S3. “no quiero que cargue la tabla cada vez que cambio el filtro. como podemos hacer eso mas fluido?” Keep the existing table visible while updated results are requested. Do not show the initial full-table loading state again for subsequent filter, search or page changes.
- S4. “tambien tenemos que implementar el buscador” and “quiero que el buscador funcione sin la necesidad de tocar en el boton buscar”. Search by name or email automatically while typing, without requiring submission or a search button.
- S5. “los filtros deben estar en la misma linea que el buscador” and “los filtros deben estar alineados a la derecha”. Place the search field on the left and both segmented filter groups together on the right in one toolbar row when the viewport provides sufficient space. On narrow screens, allow orderly wrapping without horizontal page overflow or clipped controls.

- S6. “quiero utilizar zustand”. Selected architecture: “Zustand + paginación del servidor (recomendado)”. Centralize search, filters, results, loading/errors and query cache in a Zustand store shared across the authenticated dashboard. Continue querying the server over the complete authorized dataset; do not download all contacts.

## 3. Proposed interaction contract

These details make the requested behavior testable. The 300 ms debounce and bounded cache policy below are implementation defaults, not verbatim user requirements.

### 3.1 Toolbar and search

- Present search, source and status together in a single toolbar above the table, rather than placing filters in a separate row on desktop. Keep search left-aligned and group both filters against the right edge.
- Keep accessible names for search and both filter groups, with visible keyboard focus and keyboard-operable selectors.
- Remove the required “Buscar” button. Typing in the search input updates its displayed value immediately.
- Apply the search after 300 ms without further typing. Each keystroke cancels the previous scheduled search.
- Clearing search restores results for the remaining active source and status filters after the same debounce.
- Preserve the existing maximum search length of 200 characters and the server's existing name/email matching behavior.
- A source or status selection applies immediately, includes the current search text, and cancels any obsolete scheduled search.
- Changing search, source or status resets pagination to page 1 while preserving the other active filters.
- Keep `q`, `source`, `status` and `page` represented in the URL. Use history replacement for typing so each search update does not create another Back-history entry.
- Opening a filtered URL and navigating Back/Forward restores the matching controls and results; a pending debounce must not overwrite navigation.

### 3.2 Initial load and subsequent updates

- Show “Cargando contactos…” only when no results are available for the current mounted list yet.
- During later requests, keep the previous successful rows and table structure visible. Show a discreet “Actualizando…” status and mark the results region busy for assistive technology.
- Old rows and counts are previous results, not a claim that the new filter has already completed. Keep their pagination context consistent and disable pagination while those results are stale.
- Once the current request succeeds, update rows, total count and pagination together.
- Preserve the existing empty-results message, presented inside the table after a successful empty response.
- On an update failure, retain the last successful table, show an accessible error and provide “Reintentar” for the current requested search/filter combination. Do not present stale results as successfully refreshed.
- On an initial failure without prior results, show the error and retry control without fabricating a table of results.

### 3.3 Cache and request ordering

- Maintain a bounded, in-memory cache of successful query results in the dashboard-wide Zustand store, keyed by search, source, status and page. Default capacity: 20 query combinations, evicting the least recently used entry.
- Returning to a cached combination displays its rows, count and pagination immediately, then revalidates them in the background.
- Do not persist contact information in localStorage or another persistent browser cache. Leaving the Contacts list cancels pending work but retains the dashboard-wide state and cache. Leaving the dashboard discards contact state and cache. A different authenticated user receives a new store through the user-keyed provider.
- Scope the shared Zustand store to the dashboard provider, never a module-level server singleton. Independent dashboard renders must not share contact records or requests.
- Cancel obsolete network requests and ignore late responses from previous query combinations, including responses that finish after cancellation.
- Changing filters quickly must never let an older response overwrite the latest selected combination.
- Retain server-side filtering and pagination over the complete authorized dataset. Do not filter only the loaded page or download all contacts to simulate client-side filtering.

## 4. Acceptance checks

| Check | Expected observable outcome |
| --- | --- |
| A1 — Family-table styling (S1) | Shared table presentation, compact rows, rounded border, badges and pagination remain visible and consistent with Families. |
| A2 — Segmented filters (S2) | Source and status support all existing options, including “Todos”; the selected option is distinct and keyboard-operable. |
| A3 — No table flash (S3) | After initial success, changing source, status, search or page retains the table during the request and announces “Actualizando…”, not “Cargando contactos…”. |
| A4 — Live search (S4) | Typing a name or email makes no request before 300 ms; after the pause, the latest text is searched without pressing a button. |
| A5 — Debounce and clear (S4) | Rapid keystrokes produce only the final scheduled search; clearing removes `q` and retains the source/status filters. |
| A6 — Combined filtering (S2–S4) | Changing a filter while a search is pending uses the latest input, cancels the obsolete debounce and resets to page 1. |
| A7 — Toolbar layout (S5) | Search stays on the left and both filters are grouped on the right of the same row at desktop width; narrow viewports wrap without clipping or horizontal page overflow. |
| A8 — Cached return (S3, S6) | Returning to a visited combination, including after leaving/reentering the list within the dashboard, immediately displays its cached results while a fresh request runs. Capacity remains bounded; exiting the dashboard discards entries. |
| A9 — Response ordering (S3–S4) | Resolving older requests after newer ones never changes the latest selected results or overwrites their error state. |
| A10 — Failure and retry (S3) | An update failure retains prior rows and exposes the error; retry targets the current combination. An initial failure still exposes retry. |
| A11 — Existing navigation (S1–S4) | Detail links and page navigation remain correct; rows, counts and pagination belong to one successful response, and stale pagination is disabled. |
| A12 — URL synchronization (S2–S4) | Direct URLs and Back/Forward restore controls/results; pending typing cannot overwrite navigation, and automatic search does not flood history. |

| A13 — Global Zustand state (S6) | Consumers within one dashboard share the same real Zustand store, including search, filters, results and cache. Independent dashboard trees have separate stores; dashboard cleanup cancels work, clears records/cache and rejects late completions. |

Use deterministic timer and mocked-response tests for debounce, cancellation, cache, failures and response ordering. Check the combined toolbar, focus behavior and absence of layout jumps in a browser at desktop and narrow widths. Retain regression checks for existing search, filters, detail links, empty results and pagination. Tests must not modify real contact records.

## 5. Implementation boundaries

Expected primary surface: `src/modules/contacts/views/contacts-list.tsx`, plus focused Contacts tests and a local hook/helper if needed to keep request management understandable.

- Reuse existing shadcn/Base UI components; keep segmented styling local to Contacts rather than changing shared dashboard Tabs.
- Use Zustand as a direct dependency (authorized by S6); retain existing UI dependencies.
- No changes to contact submission, stored records, status management, authorization, source definitions or API query semantics.
- No persistent browser storage, migrations, all-records download, publishing or unrelated UI refactoring.
- The existing Families list is a visual reference, not an edit target.

## 6. Delivery evidence

- Implemented live search with a 300 ms debounce and no submit button; source/status filters share the wrapping toolbar.
- Initially added a per-mounted-list controller; S6 migrates its state and 20-entry LRU query cache to real `zustand/vanilla`, consumed with Zustand's `useStore`. `ContactsStoreProvider` is mounted in the dashboard layout, keyed by authenticated user ID. Background refresh, request cancellation and late-response rejection remain. URL updates use Next-compatible native history, avoiding server-route navigation for local filters.
- Existing results remain visible while refreshing; previous-result counts are labeled, pagination is disabled while updating/stale, and update errors retain the table with retry.
- RED: six controller tests failed before `contacts-query.ts` existed. GREEN: `node --test tests/integration/contacts-query.test.mjs tests/integration/contacts-list.test.mjs` passed 11 tests.
- Independent verification found no reproduced functional blocker: 11 existing tests and 3 independently derived probes passed in isolation. Those probes were incorporated as regression tests; the parent then observed 14/14 passing tests, with `git diff --check` passing.
- Independent deterministic coverage supports S3 and the debounce/search portion of S4; S1 visual consistency, S2 real keyboard operation, S5 responsive layout and A12 real Next Back/Forward integration remain unverified without a browser.
- Background job `job-3`: TypeScript passed; ESLint failed on the test mock's missing display name (one error and three unused-variable warnings); the chained domain suite did not execute. The mock was corrected.
- Background job `job-4`: targeted ESLint and `npm run test:domain` both passed (exit 0); all 98 domain tests passed. The final right-alignment change also passed all 14 focused tests and `git diff --check`.
- Follow-up request: “los filtros deben estar alineados a la derecha”. Added a right-aligned wrapping group for both filters, preserving search on the left. Observed RED on the toolbar test before adding the group, then GREEN with all 14 focused tests passing.
- S6 RED: two new Zustand tests failed because no store existed. GREEN: all 18 focused tests passed after migration, including real Zustand subscriptions, cache reuse across list mounts, independent SSR provider isolation and dashboard cleanup rejecting late results.
- Installed Zustand 5.1.0 as a direct dependency using `npm install zustand --ignore-scripts --no-audit --no-fund`; package and lockfile updated. The existing transitive Zustand 4 dependency remains isolated under `tunnel-rat`.
- S6 independent verification found no reproduced functional blocker: 18/18 existing tests and one independent lifecycle probe passed in isolation. The probe was incorporated into the repository; the parent observed 19/19 focused tests passing and `git diff --check` passing.
- S6 is met deterministically: real Zustand subscriptions, dashboard-wide cache reuse, independent SSR store isolation and reset on dashboard cleanup. Actual browser hydration, StrictMode mounting and Next history integration remain unverified.
- S6 background job `job-6` completed with exit 0: TypeScript (`tsc --noEmit --incremental false`), targeted ESLint and all 98 domain regression tests passed. Together with 19 focused tests and independent verification, automated verification of the Zustand migration is complete. Browser-dependent acceptance remains open; no browser pass is claimed.
- Browser validation remains unavailable in this session: no browser automation tools/packages are installed. Desktop/narrow layout, real keyboard focus and Next history integration still require browser evidence.
