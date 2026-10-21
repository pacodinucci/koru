import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind } from "typescript";
import { z } from "zod";

import { createFamilyPaymentService } from "../../src/modules/families/server/payment-allocation.service.ts";
import { buildAllocationSummary } from "../../src/modules/families/lib/payment-allocation.ts";
import { formatReceiptDate } from "../../src/modules/mailing/lib/email-copy.ts";

// In-memory transaction adapter: no Prisma client, network, environment, or database.
function harness(seed = []) {
  let state = { entries: structuredClone(seed), payments: [], receipts: [], allocations: [], counters: { payment: 0, entry: 0, allocation: 0 } };
  let revision = 0;
  let conflict = false;
  const options = [], locks = [];
  const db = {
    async $transaction(work, option) {
      options.push(option);
      const initialRevision = revision;
      const draft = structuredClone(state);
      const tx = {
        $queryRaw: async (strings, ...values) => { assert.match(strings.join("?"), /pg_advisory_xact_lock/); locks.push(values[0]); return [{ "?column?": 1 }]; },
        family: { findUnique: async ({ where }) => where.id === "family" ? { id: "family" } : null },
        familyAccountEntry: {
          findMany: async ({ where }) => draft.entries.filter((entry) => entry.familyId === where.familyId).map((entry) => ({
            ...entry,
            payment: entry.paymentId ? draft.payments.find((payment) => payment.id === entry.paymentId) : entry.payment,
            allocationsAsCredit: draft.allocations.filter((allocation) => allocation.creditEntryId === entry.id),
          })),
          create: async ({ data }) => {
            const entry = { id: `entry-${++draft.counters.entry}`, occurredAt: new Date(), ...data };
            draft.entries.push(entry);
            return entry;
          },
        },
        familyPayment: {
          create: async ({ data }) => {
            const payment = { id: `payment-${++draft.counters.payment}`, status: "REGISTERED", ...data };
            draft.payments.push(payment);
            return payment;
          },
          findUnique: async ({ where }) => draft.payments.find((payment) => payment.id === where.id) ?? null,
          update: async ({ where, data }) => Object.assign(draft.payments.find((payment) => payment.id === where.id), data),
        },
        familyPaymentAllocation: {
          createMany: async ({ data }) => {
            for (const allocation of data) draft.allocations.push({ id: `allocation-${++draft.counters.allocation}`, ...allocation });
            return { count: data.length };
          },
        },
        paymentReceipt: { updateMany: async ({ where, data }) => {
          for (const receipt of draft.receipts.filter((receipt) => receipt.paymentId === where.paymentId)) Object.assign(receipt, data);
        } },
      };
      const result = await work(tx);
      if (conflict || revision !== initialRevision) throw Object.assign(new Error("serialization failure"), { code: "P2034" });
      state = draft;
      revision++;
      return result;
    },
  };
  return {
    db,
    service: createFamilyPaymentService(db),
    snapshot: () => structuredClone(state),
    summary: () => buildAllocationSummary(state.entries.map((entry) => ({ ...entry, payment: state.payments.find((payment) => payment.id === entry.paymentId) ?? entry.payment, allocationsAsCredit: state.allocations.filter((row) => row.creditEntryId === entry.id) }))),
    conflict: () => { conflict = true; },
    seedPayment(payment, entry, receipt) { state.payments.push(payment); state.entries.push(entry); if (receipt) state.receipts.push(receipt); },
    options, locks,
  };
}
const charge = (id = "charge", amount = "100.00", familyId = "family", type = "MONTHLY_CHARGE") => ({ id, familyId, amount, type, description: id, occurredAt: new Date("2026-10-01T03:00:00Z") });
const allocations = (...rows) => JSON.stringify(rows.map(([chargeEntryId, amount]) => ({ chargeEntryId, amount })));
const payment = (overrides = {}) => ({ familyId: "family", amount: "40.00", method: "CASH", paidAt: "2026-10-19", allocations: allocations(["charge", "40.00"]), ...overrides });
const credit = (type = "PAYMENT", amount = "-40.00") => ({ ...charge("legacy", amount), type, payment: type === "PAYMENT" ? { status: "REGISTERED" } : null });
const total = (state) => state.entries.reduce((sum, entry) => sum + Math.round(Number(entry.amount) * 100), 0);

async function rejectedUnchanged(h, invoke, message) {
  const before = h.snapshot();
  assert.deepEqual(await invoke(), { ok: false, message });
  assert.deepEqual(h.snapshot(), before, "rejection preserves all records and counters");
}

test("register requires explicit full allocation; invalid inputs are atomic", async () => {
  const h = harness([charge(), charge("other-family", "100", "foreign"), charge("reversal", "10", "family", "PAYMENT_REVERSAL"), charge("negative", "-1")]);
  for (const overrides of [
    { allocations: "" }, { allocations: "null" }, { allocations: "[null]" }, { allocations: "[]" },
    { amount: "1.001" }, { amount: "1e2" }, { amount: "10000000000" }, { amount: "0" },
    { amount: "-1" }, { amount: "Infinity" }, { amount: "NaN" }, { method: "INVALID" },
    { paidAt: "2026-02-29" }, { paidAt: "" }, { reference: "x".repeat(161) },
    { allocations: '[{"chargeEntryId":"charge","amount":40}]' },
    { allocations: allocations(["charge", "20"], ["charge", "20"]) },
  ]) await rejectedUnchanged(h, () => h.service.register(payment(overrides), "admin"), "Revisá los datos del pago y sus asignaciones.");
  for (const target of ["missing", "other-family", "reversal", "negative"]) {
    await rejectedUnchanged(h, () => h.service.register(payment({ allocations: allocations([target, "40"]) }), "admin"), "Seleccioná cargos pendientes de esta familia y no superes sus importes pendientes.");
  }
  for (const amount of ["39.99", "40.01"]) await rejectedUnchanged(h, () => h.service.register(payment({ allocations: allocations(["charge", amount]) }), "admin"), "Asigná el total del pago a los conceptos seleccionados; el restante debe ser cero.");
  await rejectedUnchanged(h, () => h.service.register(payment({ familyId: "missing" }), "admin"), "No encontramos la familia.");
  await rejectedUnchanged(h, () => h.service.register(payment({ amount: "101", allocations: allocations(["charge", "101"]) }), "admin"), "Seleccioná cargos pendientes de esta familia y no superes sus importes pendientes.");
});

test("explicit payment splits across charges, preserves partial debt, and uses Argentina payment date", async () => {
  const h = harness([charge(), charge("second", "20", "family", "EVENTUAL_CHARGE")]);
  const result = await h.service.register(payment({ amount: "40.01", allocations: allocations(["charge", "30.01"], ["second", "10"]) }), "admin");
  assert.equal(result.ok, true);
  assert.equal(result.message, "Pago registrado.");
  const state = h.snapshot();
  assert.equal(state.payments[0].paidAt.toISOString(), "2026-10-19T15:00:00.000Z");
  assert.equal(state.entries.at(-1).occurredAt.toISOString(), state.payments[0].paidAt.toISOString());
  assert.equal(formatReceiptDate(state.payments[0].paidAt), "19/10/2026", "existing receipt date must match the chosen Argentina calendar date");
  assert.equal(state.entries.at(-1).amount, "-40.01");
  assert.equal(total(state), 7999);
  assert.deepEqual(h.summary().pendingCharges.map((row) => row.outstandingAmount), ["69.99", "10.00"]);
  assert.deepEqual(h.summary().unallocatedCredits, []);
  assert.equal(state.allocations.length, 2);
  assert.deepEqual(h.options, [{ isolationLevel: "Serializable" }]);
  assert.deepEqual(h.locks, ["family"], "payments share the rubric editor/generator family lock");
});

test("maximum decimal payment is exact, and overallocated targets reject without writes", async () => {
  const h = harness([charge("charge", "9999999999.99")]);
  assert.equal((await h.service.register(payment({ amount: "9999999999.99", allocations: allocations(["charge", "9999999999.99"]) }), "admin")).ok, true);
  assert.deepEqual(h.summary().pendingCharges, []);
  await rejectedUnchanged(h, () => h.service.register(payment(), "admin"), "Seleccioná cargos pendientes de esta familia y no superes sus importes pendientes.");
});

for (const type of ["PAYMENT", "BALANCE_WAIVER"]) {
  test(`${type} legacy reconciliation appends partial allocations without changing ledger balance`, async () => {
    const h = harness([charge(), credit(type)]);
    await rejectedUnchanged(h, () => h.service.register(payment(), "admin"), "Conciliá los pagos y condonaciones pendientes antes de registrar un nuevo pago.");
    const before = h.snapshot();
    let waiverAuthorizations = 0;
    const authorize = async () => { waiverAuthorizations++; };
    for (const amount of ["10", "30"]) {
      const result = await h.service.reconcile({ familyId: "family", creditEntryId: "legacy", allocations: allocations(["charge", amount]) }, "admin", authorize);
      assert.deepEqual(result, { ok: true, message: "Crédito conciliado.", familyId: "family" });
    }
    assert.equal(waiverAuthorizations, type === "BALANCE_WAIVER" ? 2 : 0);
    assert.equal(total(h.snapshot()), total(before));
    assert.deepEqual(h.snapshot().entries, before.entries);
    assert.deepEqual(h.snapshot().payments, before.payments);
    assert.equal(h.snapshot().allocations.length, 2);
    assert.equal(h.summary().pendingCharges[0].outstandingAmount, "60.00");
    assert.deepEqual(h.summary().unallocatedCredits, []);
    await rejectedUnchanged(h, () => h.service.reconcile({ familyId: "family", creditEntryId: "legacy", allocations: allocations(["charge", "0.01"]) }, "admin", authorize), "La asignación supera el crédito disponible.");
    assert.equal((await h.service.register(payment(), "admin")).ok, true);
  });
}

test("legacy shortage, invalid sources, malformed JSON and unauthorized waiver leave everything unchanged", async () => {
  const h = harness([charge("charge", "10"), credit("BALANCE_WAIVER", "-40"), charge("foreign", "-10", "foreign", "BALANCE_WAIVER"), { ...credit(), id: "void", payment: { status: "VOIDED" } }]);
  const reconcile = (creditEntryId, value, authorize = async () => {}) => h.service.reconcile({ familyId: "family", creditEntryId, allocations: value }, "admin", authorize);
  for (const source of ["missing", "foreign", "charge", "void"]) await rejectedUnchanged(h, () => reconcile(source, allocations(["charge", "1"])), "Seleccioná un pago o una condonación vigente de esta familia.");
  for (const value of ["[]", "[null]", "{}", allocations(["charge", "0"]), allocations(["charge", "1"], ["charge", "1"])]) await rejectedUnchanged(h, () => reconcile("legacy", value), "Revisá los datos de la conciliación.");
  await rejectedUnchanged(h, () => reconcile("legacy", allocations(["charge", "40"])), "Seleccioná cargos pendientes de esta familia y no superes sus importes pendientes.");
  const before = h.snapshot();
  await assert.rejects(() => reconcile("legacy", allocations(["charge", "1"]), async () => { throw new Error("Permission denied"); }), /Permission denied/);
  assert.deepEqual(h.snapshot(), before);
  assert.equal((await reconcile("legacy", allocations(["charge", "10"]))).ok, true);
  assert.deepEqual(h.summary().pendingCharges, []);
  assert.equal(h.summary().unallocatedCredits[0].unallocatedAmount, "30.00");
  await rejectedUnchanged(h, () => h.service.register(payment(), "admin"), "Conciliá los pagos y condonaciones pendientes antes de registrar un nuevo pago.");
});

test("void preserves allocation history, restores charge debt and ledger, and voids receipts once", async () => {
  const h = harness([charge()]);
  const registered = await h.service.register(payment(), "admin");
  h.seedPayment({ id: "unrelated", familyId: "family", amount: "1", status: "VOIDED" }, { ...credit(), id: "old-void", paymentId: "unrelated" }, { id: "receipt", paymentId: registered.paymentId, status: "ACTIVE" });
  const before = h.snapshot();
  assert.deepEqual(await h.service.voidPayment({ paymentId: registered.paymentId, reason: "Duplicate" }, "admin"), { ok: true, message: "Pago anulado y saldo revertido.", familyId: "family" });
  assert.deepEqual(h.snapshot().allocations, before.allocations);
  assert.equal(total(h.snapshot()) - total(before), 4000);
  assert.equal(h.summary().pendingCharges[0].outstandingAmount, "100.00");
  assert.deepEqual(h.summary().unallocatedCredits, []);
  assert.equal(h.snapshot().receipts[0].status, "VOIDED");
  const after = h.snapshot();
  assert.equal((await h.service.voidPayment({ paymentId: registered.paymentId, reason: "Duplicate" }, "admin")).ok, true);
  assert.deepEqual(h.snapshot(), after);
});

test("waiver keeps ledger semantics and creates an unassigned credit; bounds are atomic", async () => {
  const h = harness([charge()]);
  await rejectedUnchanged(h, () => h.service.waive({ familyId: "family", amount: "100.01", reason: "Help" }, "admin"), "La condonación no puede superar el saldo pendiente.");
  await rejectedUnchanged(h, () => h.service.waive({ familyId: "family", amount: "1.001", reason: "Help" }, "admin"), "Revisá el importe y el motivo de la condonación.");
  assert.equal((await h.service.waive({ familyId: "family", amount: "20", reason: "Help" }, "admin")).ok, true);
  assert.equal(total(h.snapshot()), 8000);
  assert.equal(h.snapshot().allocations.length, 0);
  assert.equal(h.summary().pendingCharges[0].outstandingAmount, "100.00");
  assert.equal(h.summary().unallocatedCredits[0].type, "BALANCE_WAIVER");
  await rejectedUnchanged(h, () => h.service.register(payment(), "admin"), "Conciliá los pagos y condonaciones pendientes antes de registrar un nuevo pago.");
});

test("serialization failures return actionable errors without blind retries or mutations", async () => {
  for (const operation of ["register", "reconcile", "waive", "voidPayment"]) {
    const h = harness([charge(), ...(operation === "reconcile" ? [credit()] : [])]);
    if (operation === "voidPayment") h.seedPayment({ id: "p", familyId: "family", amount: "40", status: "REGISTERED" }, { ...credit(), paymentId: "p" });
    h.conflict();
    const calls = {
      register: () => h.service.register(payment(), "admin"),
      reconcile: () => h.service.reconcile({ familyId: "family", creditEntryId: "legacy", allocations: allocations(["charge", "10"]) }, "admin", async () => {}),
      waive: () => h.service.waive({ familyId: "family", amount: "10", reason: "Help" }, "admin"),
      voidPayment: () => h.service.voidPayment({ paymentId: "p", reason: "Duplicate" }, "admin"),
    };
    await rejectedUnchanged(h, calls[operation], "La cuenta cambió mientras guardabas. Actualizá la ficha, revisá los pendientes y volvé a intentar.");
    assert.deepEqual(h.options, [{ isolationLevel: "Serializable" }]);
  }
});

test("foreign-key races report refresh feedback without retrying or mutating records", async () => {
  const h = harness([charge()]);
  const db = { $transaction: async () => { throw Object.assign(new Error("foreign key"), { code: "P2003" }); } };
  const before = h.snapshot();
  const result = await createFamilyPaymentService(db).register(payment(), "admin");
  assert.deepEqual(result, { ok: false, message: "La cuenta cambió mientras guardabas. Actualizá la ficha, revisá los pendientes y volvé a intentar." });
  assert.deepEqual(h.snapshot(), before);
});

test("simultaneous payment allocation, waiver and void conflict rather than overspend", async () => {
  const h = harness([charge()]);
  const outcomes = await Promise.all([
    h.service.register(payment({ amount: "100", allocations: allocations(["charge", "100"]) }), "admin"),
    h.service.waive({ familyId: "family", amount: "100", reason: "Help" }, "admin"),
  ]);
  assert.equal(outcomes.filter((result) => result.ok).length, 1);
  assert.equal(outcomes.filter((result) => !result.ok).length, 1);
  assert.equal(total(h.snapshot()), 0);
  const legacy = harness([charge(), credit()]);
  const reconcile = () => legacy.service.reconcile({ familyId: "family", creditEntryId: "legacy", allocations: allocations(["charge", "40"]) }, "admin", async () => {});
  const reconciliations = await Promise.all([reconcile(), reconcile()]);
  assert.equal(reconciliations.filter((result) => result.ok).length, 1);
  assert.equal(legacy.snapshot().allocations.length, 1);
  const voidRace = harness([charge()]);
  const registered = await voidRace.service.register(payment(), "admin");
  const race = await Promise.all([
    voidRace.service.voidPayment({ paymentId: registered.paymentId, reason: "Duplicate" }, "admin"),
    voidRace.service.register(payment(), "admin"),
  ]);
  assert.equal(race.filter((result) => result.ok).length, 1);
});

function actionHarness(h, { receiptFails = false, denyWaiver = false } = {}) {
  const revalidated = [];
  const permissions = [];
  const receipts = [];
  const dependencies = {
    "@prisma/client": { AccountEntryType: { EVENTUAL_CHARGE: "EVENTUAL_CHARGE" } },
    "next/cache": { revalidatePath: (path) => revalidated.push(path) },
    zod: { z },
    "@/lib/prisma": { prisma: h.db },
    "@/modules/auth/server/auth-guards": { requirePermission: async (permission) => {
      permissions.push(permission);
      if (denyWaiver && permission === "families.waive-balance") throw new Error("Permission denied");
      return { id: "admin" };
    } },
    "@/modules/families/server/payment-allocation.service": { createFamilyPaymentService },
    "@/modules/families/server/receipt.service": { createReceiptForPayment: async (id) => {
      receipts.push(id);
      if (receiptFails) throw new Error("Delivery unavailable");
    } },
  };
  const source = readFileSync(new URL("../../src/modules/families/server/family-account.actions.ts", import.meta.url), "utf8");
  const js = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText;
  const exports = {};
  runInNewContext(js, { exports, require: (id) => {
    assert.ok(id in dependencies, `Unexpected dependency ${id}`);
    return dependencies[id];
  } });
  return { actions: exports, revalidated, permissions, receipts };
}
function form(fields) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

test("public payment action rejects missing allocation and preserves receipt failure behavior, reference and revalidation", async () => {
  const h = harness([charge()]);
  const a = actionHarness(h, { receiptFails: true });
  const before = h.snapshot();
  assert.equal(JSON.stringify(await a.actions.registerFamilyPaymentAction(form(payment({ allocations: "" })))), JSON.stringify({ ok: false, message: "Revisá los datos del pago y sus asignaciones." }));
  assert.deepEqual(h.snapshot(), before);
  assert.deepEqual(a.receipts, []);
  assert.deepEqual(a.revalidated, []);
  const result = await a.actions.registerFamilyPaymentAction(form(payment({ method: "BANK_TRANSFER", reference: "  transfer-42  " })));
  assert.equal(JSON.stringify(result), JSON.stringify({ ok: true, message: "Pago registrado." }));
  assert.equal(h.snapshot().payments[0].method, "BANK_TRANSFER");
  assert.equal(h.snapshot().payments[0].reference, "transfer-42");
  assert.equal(h.snapshot().payments[0].createdById, "admin");
  assert.deepEqual(a.receipts, [h.snapshot().payments[0].id]);
  assert.deepEqual(a.revalidated, ["/dashboard/families", "/dashboard/families/family"]);
  assert.deepEqual(a.permissions, ["families.payments", "families.payments"]);
});

test("public reconciliation action requires payment and waiver permissions and never generates receipts", async () => {
  const h = harness([charge(), credit("BALANCE_WAIVER")]);
  const input = form({ familyId: "family", creditEntryId: "legacy", allocations: allocations(["charge", "40"]) });
  const denied = actionHarness(h, { denyWaiver: true });
  const before = h.snapshot();
  await assert.rejects(() => denied.actions.reconcileFamilyCreditAction(input), /Permission denied/);
  assert.deepEqual(h.snapshot(), before);
  assert.deepEqual(denied.permissions, ["families.payments", "families.waive-balance"]);
  assert.deepEqual(denied.revalidated, []);
  const allowed = actionHarness(h);
  assert.equal(JSON.stringify(await allowed.actions.reconcileFamilyCreditAction(input)), JSON.stringify({ ok: true, message: "Crédito conciliado." }));
  assert.deepEqual(allowed.permissions, ["families.payments", "families.waive-balance"]);
  assert.deepEqual(allowed.receipts, []);
  assert.deepEqual(allowed.revalidated, ["/dashboard/families", "/dashboard/families/family"]);
});
