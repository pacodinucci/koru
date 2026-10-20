# Explicit family payment allocation

Payments now reduce only the selected charge debts. The ledger remains the source of the family balance; allocations explain which concepts a payment or balance waiver covers.

## Operator workflow

1. Reconcile any existing unassigned payments and waivers against their actual charges. Partial reconciliation is allowed; new payments stay blocked until every active credit is fully assigned.
2. Enter a payment amount and its Argentina calendar date (`YYYY-MM-DD`). Select one or several pending charges. Selecting a charge pre-fills its outstanding balance, capped by the payment amount still available. The pre-filled amount remains editable for partial settlement; deselecting removes that allocation without changing the others.
3. Assign the entire payment: the remaining payment amount must equal zero before saving. Each charge allocation must fit its pending debt.
4. If the account changed concurrently, refresh the family detail, review the new pending amounts, then try again. The server does not automatically retry financial decisions.

Waivers created by the existing form have no target selection and therefore enter manual reconciliation too. Waiver reconciliation requires both payment management and balance-waiver permission. If historical credit exceeds the available charges, the remainder stays visible and blocks new payments: an administrator must investigate the historical records. There is no automatic write-off, FIFO assignment, or historical backfill.

## Server contract

| Action | Fields and behavior |
| --- | --- |
| `registerFamilyPaymentAction` | Existing `familyId`, `amount`, `method`, optional `reference`, plus `paidAt` and `allocations`. Full amount must be allocated atomically. |
| `reconcileFamilyCreditAction` | `familyId`, `creditEntryId`, `allocations`. Appends allocations up to the active payment/waiver remainder, without changing ledger entries or payment dates. |
| Allocation payload | JSON string, e.g. `[{"chargeEntryId":"charge-id","amount":"125.50"}]`. No duplicate targets. Amounts are positive decimal strings with at most two fractional digits and at most `9999999999.99`. |

Both actions return `{ok:boolean,message:string}` with safe Spanish input/conflict messages. Every source and target must belong to the selected family; targets must be positive monthly/eventual charges. Ledger reversals are not new payable charges. Voided payments are excluded from applied amounts, while their allocation rows remain intact for audit. Voiding still reverses the ledger and marks existing receipts voided, once only.

Payment creation, reconciliation, waivers, and voiding use serializable transactions. Reconciliation never changes the financial balance. Payment `paidAt` and its ledger `occurredAt` share the selected Argentina date, anchored at noon Argentina time (15:00 UTC) so the existing Mexico City receipt formatter also retains that calendar date; receipt generation keeps its existing content and uses the persisted `paidAt`. Receipt generation failure does not undo a committed payment.

## Migration and verification

`prisma/migrations/20261019190000_family_payment_allocations/migration.sql` creates only the allocation table, foreign keys, indexes, and positive/non-self allocation checks. It has been **applied to the configured project database**, following explicit user authorization, together with the pending `20261016220000_add_inventory_purchases` migration. `prisma migrate deploy` succeeded and the subsequent `prisma migrate status` confirmed that the schema is up to date. Other environments must apply the additive migration before using the new queries. Application validation and serializable transactions enforce cross-row ownership, credit limits, and debt limits.

Local deterministic checks (no live database):

- `npm run test:domain`
- `node --test tests/integration/family-payment-allocation.test.mjs tests/integration/family-payment-allocation-ui.test.mjs tests/integration/family-payment-allocation-detail.test.mjs`
- `npx tsc --noEmit --incremental false`
- `npx prisma validate`
- `npx prisma generate` (local client generation only)

The integration tests use an isolated transaction adapter and exercise registration, reconciliation, voiding, waivers, rejected-write atomicity, and serialization conflicts. UI tests execute callbacks and server renders with stubbed dialog primitives; they are not browser tests. Both the full family page and the client-loaded Manage Family dialog receive allocation summaries; the dialog reloads its detail after successful financial mutations. They do not establish real PostgreSQL concurrency, browser behavior, or receipt delivery. Migration execution was separately verified against the configured project database; this does not establish end-to-end application behavior.
