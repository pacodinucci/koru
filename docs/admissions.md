# Initial admissions and Contactos

The public questionnaire at `/admisiones/cuestionario-inicial` saves pre-enrollment inquiries without creating accounts, families, or students. Administrators consult these inquiries alongside historical contact messages at `/dashboard/contactos`.

## Operating the feature

1. Open **Admisiones → Completar cuestionario inicial**. Submit one questionnaire per child. The seven general fields are mandatory; the sixteen narrative answers are optional.
2. After confirmed persistence, the visitor sees a receipt message. Failed requests retain entered answers. An uncertain request freezes the attempted answers and offers a retry of the same send, avoiding accidental duplicates.
3. Sign in as `ADMIN`, `SUPERADMIN`, or a dashboard user granted **Contactos → Ver**, and open **Contactos**. Search by name/email, filter by source/status, and open a detail. Status changes are explicit; opening does not mark a record read. **Respondido** does not send email.

**Roles → Contactos** exposes **Ver** (`contacts.view`) and **Gestionar** (`contacts.manage`). List/detail/navigation require Ver; status changes require both Ver and Gestionar. View-only users see a disabled status selector. System ADMIN and SUPERADMIN roles receive initial grants; custom roles receive nothing automatically and retain explicit restrictions. SUPERADMIN inherits every catalog capability even when its assigned role has an incomplete grant set. Navigation visibility is not authorization: every API read and write independently checks the authenticated server-side capabilities.

## Storage and HTTP contracts

| Boundary | Behavior |
| --- | --- |
| `POST /api/admissions` | Strict `initial-v1` schema; UUID `idempotencyKey`; structured `answers`; optional empty honeypot `website`. |
| Retry | Same key and normalized answers returns success without another row. Same key and different answers returns 409 without mutation. Intentional new sends use a new UUID; email is not unique. |
| Body limits | JSON only, maximum 64 KiB of streamed bytes. Field limits are listed in the [specification](../odd/specs/admissions-initial-questionnaire-and-contacts.md). |
| `GET /api/dashboard/contacts` | `q`, `source=contact\|admission`, `status=NEW\|READ\|REPLIED`, `page`; 20 rows per page. |
| Detail | `GET /api/dashboard/contacts/{source}/{id}` keeps source-local IDs distinct. Returns full original message or versioned answers. |
| Follow-up | `PATCH` the detail URL with `{ "status": "READ" }` (or NEW/REPLIED), an authenticated session with both Contactos permissions and an Origin matching the trusted configured public origin (`APP_URL`, falling back to `BETTER_AUTH_URL`). Internal Next request URLs and client-supplied Host/forwarded-host headers are not the production authority for this comparison. |
| Errors | Invalid payload/filters (including repeated `q`, `source`, `status` or `page` keys): 400; forbidden: 403; missing detail: 404; conflicting send: 409; safe persistence failure: 500. |

`AdmissionInquiry` is independent of the student questionnaire. Summaries are derived from the validated answers, never accepted as competing copies. Definitions and exact Spanish wording live in `src/modules/admissions/initial-questionnaire.ts`; keep historical definitions when adding versions. Unknown versions are not relabeled with current questions.

The unified SQL read model applies filters and ordering across both sources before LIMIT/OFFSET; count and page use the same repeatable-read snapshot. Ties sort by source and ID. `ContactMessage` data is not copied, rewritten or deleted. Submitted text is rendered as text, not HTML.

## Contactos role permissions

The follow-up migration `20261119090000_contacts_permissions` was applied to the authorized configured database with standard Prisma deploy. All 89 migrations are applied. Pre/postflight verified its checksum, both permission definitions, initial system ADMIN/SUPERADMIN grants, unchanged contacts/inquiries and unchanged unrelated/custom-role grants. It adds the two permission records and initial grants for system ADMIN/SUPERADMIN only. It does not grant custom roles automatically, change private submissions, or rewrite historical migrations. Its isolated PostgreSQL probe checks both grant defaults and unchanged contact/inquiry fingerprints. `scripts/contacts-permissions-configured-check.mjs before|after` is the read-only configured-target pre/postflight helper; it must run only under explicit target authorization.

Real-session Chromium checks in `tests/integration/contacts-permissions-e2e.mjs` passed Superadmin access and the Roles Contactos group, read-only and manage grants, restricted ADMIN behavior, and grant/revoke persistence with changes effective on the next request. The independent focused permission/HTTP verification passed 9/9; the full domain suite passed 98 tests. Both test services were stopped afterward. Fixture sign-ins are deliberately spaced to respect production authentication throttling.

## Migration safety

The migration only creates `AdmissionInquiry` and its indexes. It first passed on an explicitly disposable local PostgreSQL database with historical contacts preserved. The user subsequently authorized the configured `.env` target explicitly; standard `prisma migrate deploy` successfully applied `20261118160000_admission_inquiry` there. Preflight confirmed it was the sole pending migration and there were no failed migrations. Postflight verified the applied SQL checksum/history, all 13 columns and four indexes, zero manufactured inquiry records, and unchanged count/full-row fingerprint of the one existing contact. All 88 migrations are applied on that target. Application publishing was not performed.

The optional read-only evidence helper is `scripts/admissions-configured-migration-check.mjs before|after`. Its preflight refuses any additional pending/failed migration or unexpected inquiry table. It stores only aggregate contact count/fingerprint in ignored scratch, never contact payloads or credentials. Run this configured-target helper only after explicit database-target authorization; it does not itself execute migrations.

**Historical-chain limitation:** a clean replay of existing migrations failed before admissions in `20260909210000_add_dynamic_roles`: the final `perm_roles_manage` seed row has five values for six columns. This pre-existing migration was not modified. The additive admission migration passed on a separate equivalent schema baseline generated from the current Prisma schema without `AdmissionInquiry`; this does not prove a successful clean historical migration chain.

## Checks and remaining proof

Focused HTTP/domain tests: `tests/domain/admissions*.test.ts`. Static React rendering check: `node --test tests/integration/admissions-ui.test.mjs`. Standard domain suite: `npm run test:domain`. Also run TypeScript, ESLint and Prisma validation.

Both static render tests pass: question controls/order/requiredness/privacy and explicit shared Montserrat typography on the public page. The final wrapper-class-only typography correction passed focused rendering and lint after the successful production build/browser run; no API or DB behavior changed afterward. Static rendering alone is not an interactive browser or accessibility audit. The user subsequently authorized isolated setup: project-local PostgreSQL 15 on loopback port 55549 and project-local Playwright/Chromium under ignored `.tmp-admissions-e2e/`. Migration preservation passed on the equivalent baseline. Real API paging/concurrency and browser/mobile/keyboard/pending/error probes in `tests/integration/admissions-e2e.mjs` passed all seven acceptance groups against a production build and real authenticated sessions. They verified interleaved global ordering/counts/ties, source-local identities, five concurrent same-send requests creating one inquiry, no user/family/student creation, rejected-operation invariants, persisted statuses, actual database failure without success, mobile keyboard controls, pending guard, error retention/retry and inert dashboard answers/back navigation. Captures and structured results are retained under ignored `.tmp-admissions-e2e/evidence/`. The local server and PostgreSQL cluster were stopped after execution.

Real-server checks also exposed a Next internal/public-origin mismatch in status CSRF handling. It was reproduced RED, fixed using trusted configured public origin, independently rechecked, and validated GREEN in the real API run. An initial browser probe failed because its generic alert selector also matched Next's route announcer; the corrected exact-message selector passed.

The isolated SQL runner is `scripts/admissions-isolated-db-check.mjs`: its default mode replays historical migrations and does not hide their failure. Explicit `--schema-baseline` mode instead uses `.tmp-admissions-e2e/baseline.sql`, preserving the limitation above. Both modes require an exact disposable `TEST_DATABASE_URL`; neither falls back to the application's `DATABASE_URL`.

Public abuse defenses are limited to strict validation, a streamed body cap and a honeypot; they are **not** distributed rate limiting or a CAPTCHA. Do not log request bodies or sensitive questionnaire answers. No marketing consent, third-party service, outbound messaging, deletion, export, or anonymous drafts were introduced.
