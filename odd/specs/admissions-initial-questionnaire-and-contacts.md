# Initial admissions questionnaire and Contacts dashboard

Status: Implementation authorized by the user; questionnaire supplied and product decisions confirmed.
Deliverable: Native initial questionnaire and permission-based Contactos with full SUPERADMIN inheritance. Production migration execution and publishing remain excluded. Implementation ledger: `odd/tasks/admissions.md`.

## 1. Goal

Implement the initial admissions questionnaire as a native Koru form and provide a unified administrative **Contactos** section for both initial admissions submissions and messages from the existing public contact form.

The initial questionnaire precedes enrollment. It must not require an existing student or family account, and submitting it must not automatically create a user, family, or student.

## 2. Confirmed requirements

- R1. Use the existing family forms as the visual and interaction references: **Expediente de cada niñ@** and **Cuestionario de ingreso**. Do not embed or redirect to Google Forms.
- R2. Make the initial questionnaire accessible from **Completar cuestionario inicial** on the public Admisiones page.
- R3. Validate and persist questionnaire submissions in the database.
- R4. Create a dashboard section with the exact visible name **Contactos**.
- R5. Show submissions from both the existing contact form and the new initial questionnaire in that section, with a distinguishable source.
- R6. Include previously stored contact messages, not only submissions received after launch.
- R7. Allow staff to inspect the original message or the complete questionnaire responses, as appropriate.
- R8. Keep this initial questionnaire separate from the existing student admission questionnaire and student record.

## 3. Questionnaire source and completeness gate

Source supplied by the user:

https://docs.google.com/document/d/1MLMrJaV6mJpgHB_DiUWJ-8KMm-smAArHKrMaGbMg-YA/edit?tab=t.0#heading=h.5kivy898bzl8

The source originally returned HTTP 401. The user subsequently pasted the complete questionnaire; the authoritative wording is reproduced verbatim in `odd/tasks/admissions.md`, S2. That supplied text replaces the unavailable linked source for this implementation.

The supplied questionnaire resolves the content gate. Its implementation inventory is below; the original inventory checklist is retained for future versions:

| Attribute | Required specification |
| --- | --- |
| Stable key | Unique technical identifier, independent of the visible label |
| Section and order | Exact source grouping and ordering |
| Label and help text | Exact approved Spanish wording |
| Input type | Text, multiline, email, telephone, date, choice, or other supported type |
| Options | Exact values and visible labels, where applicable |
| Requiredness | Required or optional; explicitly confirm if the source is ambiguous |
| Validation | Length, format, boundaries, and conditional rules |
| Storage | Contact summary field or versioned questionnaire answer |
| Visibility | Whether used in the list summary or only in the authorized detail |

Confirmed submission unit: one child per submission. Version: `initial-v1`. The exact introduction and confidentiality notice are in the supplied questionnaire recorded verbatim in `odd/tasks/admissions.md`, S2. The repeated heading “Sobre su hija/o” is preserved under Información general and again before narrative questions.

### Approved field inventory

All fields are stored in versioned answers; guardian name, email and telephone are server-derived administrative summary fields. Only sender contact summary appears in the list; full answers appear only in authorized detail. No choice options or conditional questions were supplied. Labels below are exact. Technical limits are implementation constraints, not additional source questions.

| Order / section | Stable key | Exact label | Type / requiredness / validation |
| --- | --- | --- | --- |
| 1 / Información general · Sobre su hija/o | childName | Nombre completo: | Text, required, max 200 |
| 2 / same | birthDate | Fecha de nacimiento: | ISO date, required, valid calendar date, not future |
| 3 / same | age | Edad: | Integer, required, 0–25 |
| 4 / same | guardianNames | Nombre(s) de madre, padre o tutores: | Text, required, max 200 |
| 5 / same | phone | Teléfono de contacto: | Telephone, required, max 40 |
| 6 / same | email | Correo electrónico: | Email, required, max 254 |
| 7 / same | city | Ciudad donde viven: | Text, required, max 120 |
| 8 / Sobre su hija/o | childDescription | ¿Cómo describirían a su hija/o? | Multiline, optional, max 4,000 |
| 9 / same | enjoys | ¿Qué disfruta hacer? | Multiline, optional, max 4,000 |
| 10 / same | interests | ¿Qué intereses, juegos o actividades llaman más su atención actualmente? | Multiline, optional, max 4,000 |
| 11 / same | relationships | ¿Cómo suele relacionarse con otros niños y adultos? | Multiline, optional, max 4,000 |
| 12 / same | importantTraits | ¿Hay algo importante que consideren valioso que sepamos sobre su forma de ser? | Multiline, optional, max 4,000 |
| 13 / Trayectoria y experiencias educativas | previousEducation | ¿Ha asistido anteriormente a otro espacio educativo? ¿Cuál? | Multiline, optional, max 4,000 |
| 14 / same | schoolExperience | ¿Cómo ha sido su experiencia escolar hasta ahora? | Multiline, optional, max 4,000 |
| 15 / same | likedEducation | ¿Qué les ha gustado de otros espacios educativos? | Multiline, optional, max 4,000 |
| 16 / same | desiredChanges | ¿Qué les gustaría que fuera diferente en esta nueva experiencia? | Multiline, optional, max 4,000 |
| 17 / Relación con Koru | discovery | ¿Cómo conocieron Koru? | Multiline, optional, max 4,000 |
| 18 / same | projectAttraction | ¿Qué les llamó la atención del proyecto? | Multiline, optional, max 4,000 |
| 19 / same | childExpectations | ¿Qué esperan encontrar aquí para su hija/o? | Multiline, optional, max 4,000 |
| 20 / same | familyExpectations | ¿Qué esperan encontrar ustedes como familia? | Multiline, optional, max 4,000 |
| 21 / Ritmo de vida y bienestar | dailyRhythm | ¿Cómo describirían el ritmo cotidiano de su hija/o? | Multiline, optional, max 4,000 |
| 22 / same | supportNeeds | ¿Hay alguna necesidad médica, alimenticia, emocional o de acompañamiento que consideren importante compartir desde este momento? | Multiline, optional, max 4,000 |
| 23 / same | currentNeeds | ¿Qué sienten que su hija/o necesita en este momento de su vida? | Multiline, optional, max 4,000 |

Payload boundary: 64 KiB; strict versioned keys/types; first-party honeypot without new third-party services. Idempotency uses a random per-send UUID retained across retries: identical normalized content replays success, different content with the same key is rejected without mutations. This is not a distributed rate limiter. No production deployment is authorized by this document.

## 4. Existing implementation baseline

| Area | Current evidence |
| --- | --- |
| Admissions entry | `src/modules/admisiones/views/admisiones-view.tsx` renders a disabled `Completar cuestionario inicial` element in the first stage. |
| Contact validation | `src/modules/contact/contact.schema.ts` validates name, email, optional telephone, and message. |
| Contact persistence | `src/modules/contact/server/contact.repository.ts` calls `prisma.contactMessage.create`. |
| Contact delivery | `src/modules/contact/server/contact.actions.ts` validates and saves; `src/app/api/contact/route.ts` exposes the public POST route. |
| Existing records | `ContactMessage` in `prisma/schema.prisma` stores `nombre`, `email`, optional `telefono`, `mensaje`, `status`, and timestamps. |
| Existing status vocabulary | `ContactMessageStatus`: `NEW`, `READ`, `REPLIED`. |
| Student questionnaire | `StudentAdmissionQuestionnaire` is keyed by required `studentId`, with JSON answers and submission timestamps. |
| Family UI reference | `src/modules/family-dashboard/views/admission-questionnaire-form.tsx` uses section cards, labels, textareas, pending feedback, draft saving, and submission. |

A search of `src` found contact-message creation but no administrative reader of `ContactMessage`. Build the administrative view rather than assuming an existing inbox.

Existing contact behavior to preserve: name trimmed with minimum two characters; valid email; optional telephone; message trimmed with minimum ten characters. Persistence trims values, lowercases email, and converts an empty telephone to null. New rows default to `NEW`.

## 5. Proposed user journeys

### 5.1 Initial admissions submission

1. Visitor opens Admisiones and activates `Completar cuestionario inicial`.
2. A native public page presents the questionnaire, following the family forms' visual language.
3. Visitor completes the approved sections and submits.
4. Client feedback identifies errors without discarding entered answers.
5. Server validates the complete payload against the approved questionnaire version.
6. Server persists the submission and only then returns success.
7. Visitor receives a clear confirmation. Staff can find the submission in Contactos.

A database failure must never display success. Repeated clicks during an active request must not produce concurrent submissions from the same interaction. Retry behavior after an uncertain response must follow the duplicate policy selected in section 11.

### 5.2 Existing contact form

1. Visitor submits the existing contact form.
2. Existing validation and persistence remain functional.
3. The message appears in Contactos alongside admissions submissions.
4. Historical messages appear without needing resubmission or a manual copy operation.

### 5.3 Administrative consultation

1. Authorized staff navigate to **Contactos**.
2. They see a unified, paginated list with a clearly identified source.
3. They open a record and see the sender's contact information and either the message or all submitted questionnaire sections.
4. Any authorized status changes persist and are reflected consistently in list and detail.

## 6. Proposed data design

This is the recommended design, not an applied schema change.

### 6.1 Keep `ContactMessage`

Preserve existing rows, identifiers, timestamps, message contents, and statuses. Do not repurpose `mensaje` to contain serialized questionnaire answers. Do not manufacture questionnaire submissions from old contact messages.

### 6.2 Add `AdmissionInquiry`

Use a separate model for the pre-enrollment questionnaire, independent of `StudentAdmissionQuestionnaire`.

| Proposed field | Purpose |
| --- | --- |
| `id` | Stable submission identifier |
| Contact summary fields | Guardian names, email and telephone derived from validated answers |
| `answers` | Structured JSON answers, preserving approved field types and repeatable groups if needed |
| `questionnaireVersion` | Identifies the definition needed to interpret the stored answers |
| `status` | Administrative follow-up state, distinct from draft/submission state |
| `submittedAt` | Submission timestamp |
| `createdAt`, `updatedAt` | Persistence timestamps |

Only allow known keys and approved value types for the selected version. JSON storage is not permission to accept arbitrary client objects. Keep definitions available for every stored version; do not relabel historical answers using an incompatible new definition.

If contact summary values also appear in `answers`, derive both from the same validated payload on the server. Do not accept competing copies from the client.

Index the fields required by the chosen ordering and filters. Any migration must be additive and tested against a database containing existing contact messages. Production migration execution is a separate authorized operation.

### 6.3 Unified read model

Normalize both sources into an administrative read model with source, source-local ID, sender summary, contact channels, status, and received timestamp. Use a composite identity such as `(source, id)` for selection and detail routing.

Pagination must be global across both sources, not separately paginated lists concatenated afterward. Apply filters and ordering before selecting the page, with deterministic tie-breaking. Counts and displayed rows must use the same filters and authorization rules.

The read model unifies presentation; it does not deduplicate people or merge their submission histories automatically.

## 7. Contactos interface

Proposed route: `/dashboard/contactos`; visible navigation label: **Contactos**. Confirm routing conventions during implementation.

### List

- Sender name or an explicit fallback if a historical record lacks display information.
- Source: **Formulario de contacto** or **Cuestionario inicial**.
- Email and telephone when present.
- Received timestamp and follow-up status.
- Action to open the detail.
- Search, source/status filtering, pagination, empty states, and recoverable load errors.

Confirmed defaults: newest first; search by sender name or email; source filter including both sources; 20 records per page. Do not expose complete questionnaire answers in the list or search snippets.

### Detail

- Source, received timestamp, status, and available contact channels.
- For contact messages: complete original message.
- For questionnaires: sections and questions in their versioned order, with readable choice labels and an explicit unanswered representation for optional questions.
- Render submitted content as text, never executable markup.
- Back navigation that preserves list search, filters, and page.
- Clear not-found and unauthorized handling without exposing private content.

### Follow-up

Proposed shared states reuse existing semantics: `NEW` → **Nuevo**, `READ` → **Leído**, `REPLIED` → **Respondido**. Final transition rules and whether opening a record marks it read require confirmation.

Marking a record **Respondido** records staff follow-up only; it does not send an email. Outbound messaging is outside this delivery.

## 8. Form implementation and reuse boundaries

Reuse shared inputs, buttons, section cards, spacing, accessible labels, pending feedback, and the question-definition pattern. Keep existing family forms behavior intact.

Do not reuse the existing family save action: it requires a family session and verifies student ownership. Implement a dedicated public submission boundary and an independent validation schema for the new questionnaire.

Public access does not include permission to read submissions. Do not expose a submission listing or answer lookup on the public endpoint.

The existing student form supports drafts. This does not automatically authorize anonymous server-side drafts here. Cross-device resume, local answer persistence, tokens, and post-submission editing remain excluded unless explicitly selected.

## 9. Validation, privacy, and failure behavior

- Perform authoritative validation on the server, regardless of client checks.
- Set field and total payload limits after the inventory is available; reject unsupported versions, unknown keys, and invalid answer types.
- Reject invalid submissions before creating records or changing existing records.
- Authorize dashboard reads and mutations on the server using the project's existing permission mechanisms. Decide the roles before enabling access.
- Define abuse controls for public submissions using available project infrastructure. Do not silently introduce a third-party CAPTCHA or new infrastructure dependency.
- Confirm the privacy notice and any consent requirement based on the actual questions; do not invent legal wording or treat sending the form as consent for marketing.
- Avoid logging submitted answers or private contact payloads. Return safe errors, not database details.
- Failed status updates retain the previously persisted state and show an error.
- No public response may reveal whether an email belongs to an existing family or student.

## 10. Acceptance criteria and validation plan

| ID | Observable acceptance criterion |
| --- | --- |
| A1 | The admissions entry is enabled and opens the implemented native form, with keyboard-accessible navigation. |
| A2 | Every approved source question appears in the correct section/order with the specified type, options, requiredness, and validation. |
| A3 | A valid public submission succeeds without authentication or an existing student; its stored responses appear unchanged in the authorized detail. |
| A4 | Invalid input returns a validation failure, creates no submission, and does not alter existing records. |
| A5 | A persistence failure produces no success confirmation; entered values remain available for correction or retry. |
| A6 | Existing contact-form validation, normalization, success/error behavior, and storage continue to work. |
| A7 | A seeded historical contact message and a new contact message are both visible in Contactos alongside a new questionnaire submission, with correct source labels. |
| A8 | Identical source-local IDs cannot cause a detail link to open a record from the wrong source. |
| A9 | Global ordering, filtering, counts, and pagination remain correct for interleaved records from both sources, including tied timestamps and an empty result. |
| A10 | Contact detail shows the complete message; questionnaire detail shows every submitted answer using the stored questionnaire version. User markup renders inertly. |
| A11 | Unauthorized list/detail requests and status mutations reveal no private content and make no changes. |
| A12 | Chosen status transitions persist and update the list/detail; failed changes preserve the prior stored state. |
| A13 | Submission creates no user, family, or student and leaves the existing family questionnaires unchanged. |
| A14 | An additive migration against a database with historical contact messages preserves their contents, identifiers, timestamps, and statuses. |
| A15 | The selected repeated-click/retry policy is tested through the public submission interface. |

Use test-first checks for implementable behavior. Validate through public actions/endpoints and dashboard interactions with isolated test data. Assert success/failure results and absence of side effects on rejected operations. Run applicable type/lint/build checks and browser checks for mobile layout, keyboard operation, pending states, errors, and readable details.

Local implementation: native public form, dedicated submission handler, additive `AdmissionInquiry` migration, and ADMIN-only unified Contactos list/detail/status routes. All 94 compiled domain tests pass, including admissions HTTP/validation regression coverage; static React form rendering, Prisma generation/validation, TypeScript, ESLint and the production build passed. The independent verifier found one duplicate-query validation defect, reproduced RED and corrected GREEN; its limited independent recheck passed (1/1, exit 0). No concrete implementation blocker remains from that review; the previously missing isolated database/browser proof was subsequently observed as described below. Initial domain-suite attempt timed out after 30 seconds (failed check, not RED evidence). Evidence and remaining checks are tracked in `odd/tasks/admissions.md`. After the user's isolated-environment authorization, the additive migration passed on a disposable equivalent-schema baseline with historical IDs/content/timestamps/statuses preserved. Full historical migration replay failed earlier in the pre-existing `20260909210000_add_dynamic_roles` permission seed (mismatched VALUES row); it was not modified. All seven real PostgreSQL/API/Chromium acceptance groups subsequently passed on the disposable equivalent baseline, including authenticated permissions, global SQL pages/counts, concurrent idempotency, actual persistence failures, manual statuses, mobile keyboard/pending/errors/retry and inert dashboard content. A real-server CSRF origin mismatch was reproduced RED, corrected to use trusted configured public origin, independently rechecked and verified in the passing real API run. Test server and PostgreSQL cluster were stopped afterward. A final public-wrapper typography-only adjustment passed both focused render tests (2/2) and ESLint; the production build and browser evidence precede that wrapper-class change. No API or database logic changed afterward. After separate explicit authorization for the configured `.env` target, `20261118160000_admission_inquiry` was successfully applied there with standard Prisma deploy. Pre/postflight confirmed no failed migrations, exact checksum/history, all columns/indexes, zero manufactured inquiries and preserved full-row fingerprint of the existing contact. The follow-up `20261119090000_contacts_permissions` also passed isolated SQL preservation and real Roles/Superadmin/browser tests, then was applied to the same authorized target with pre/postflight checks. All 89 migrations are applied on that target; the historical roles defect remains a separate clean-install limitation. No commit or application publishing was performed.

## 11. Open decisions and implementation gates

| Decision | Recommendation / current state |
| --- | --- |
| Exact questionnaire content | Resolved: supplied verbatim by the user; 23-field inventory in section 3. |
| Submission unit | Confirmed: one child per submission. |
| Contact summary fields | Guardian names, email and phone derived from validated answers; no extra questions. |
| Draft/resume | Confirmed: no anonymous drafts or persistent resume. |
| Staff access | Corrected by the user: SUPERADMIN inherits all ADMIN capabilities. Roles includes Contactos → Ver/Gestionar; reads require contacts.view and status writes require contacts.view plus contacts.manage. Default system ADMIN/SUPERADMIN grants; other roles require explicit grants. |
| Status actions | Confirmed: manual NEW/READ/REPLIED; opening a detail does not change status. |
| Duplicate/retry policy | Confirmed: unique per-send UUID; identical normalized content replays success, different content with same key returns conflict without changes. Email is not unique. |
| Search/page defaults | Confirmed: name/email search, newest first, 20 per page, source and status filters. |
| Privacy and abuse controls | Exact supplied notice, no checkbox; strict payload validation, 64 KiB body limit and honeypot. No distributed limiter was found in the inspected infrastructure; these controls do not constitute comprehensive rate limiting. |

Confirmed by the user for implementation: one child per submission; all seven general fields required; all sixteen narrative questions optional; permission-based consultation/status changes (contacts.view/manage) with full SUPERADMIN access; manual NEW/READ/REPLIED with no automatic read on open; name/email search, newest first, 20 records per page, source/status filters; no drafts; same-send idempotent retries without email uniqueness; exact confidentiality notice visible without a checkbox. No new third-party abuse-control dependency. The inventory in section 3 and these decisions supersede the original pending gates and proposals.

User correction superseding the previous exact-ADMIN interpretation:

> superadmin puede hacer todo lo que admin puede hacer. ademas, falta agregar la seccion de contactos en roles:

The `Contactos` group in Roles is part of the feature, not a separate hard-coded role check. A view-only grant must not permit state mutations. Task T5 completed with 98 domain tests, independent permission/HTTP review (9/9), real browser positive/negative and grant/revoke checks, and configured-target permission migration/postflight. See `odd/tasks/admissions.md` for evidence and the recorded test-harness failures/corrections.

## 12. Delivery outline

1. Obtain and specify the questionnaire; resolve blocking product decisions.
2. Implement additive persistence and dedicated validation/public submission behavior, with tests.
3. Implement the native form and activate its admissions entry, with functional checks.
4. Implement Contactos navigation, authorized unified reading, list/detail, and agreed follow-up actions, including historical messages.
5. Verify the end-to-end flows, existing-form regressions, authorization, and migration preservation in isolated state.

This outline is not an implementation task ledger. Implementation tracking, commits, and deployment decisions belong to the separately authorized implementation phase.

## 13. Non-goals

- Replacing or changing the existing student questionnaire or student record.
- Automatically enrolling applicants or creating family accounts.
- Automatic person deduplication or merging records by email.
- Sending emails, WhatsApp messages, marketing campaigns, or notifications.
- Exports, attachments, deletion, bulk actions, staff assignment, internal notes, analytics, or a full admissions CRM.
- Production migration execution or publishing from this specification request.

## 14. Requirement provenance

Confirmed user statements:

> recientemente modificamos la pagina admisiones para agregar el link del cuestionario inicial. ya tengo el cuestionario. ahora bien, quiero crea la spec completa para abarcar desde la implementacion del formulario hasta el guardado en la base de datos y crear la seccion donde vamos a mostrar este contacto en el dashboard. que te parece?

> ese es el cuestionario. pero tenemos que desarrollarlo de la misma manera que desarrollamos los otros 2 formularios que le hacemos a las familias. sabes cuales digo?

> bien, ese es el formato para este nuevo formulario.

> la seccion que vamos a crear en el dashboard sera 'Contactos'.

> bueno, tenemos que mostrarlos junto con estos contactos via formularios tambien. hay que armar la seccion. la spec debe incluirlo tambien.

> desarrolla la spec y dejala en odd/specs
