import assert from "node:assert/strict";
import test from "node:test";

import { argentinaPaymentDate, buildAllocationSummary, moneyToCents, parseAllocations } from "../../src/modules/families/lib/payment-allocation";

const date = new Date("2026-10-01T03:00:00Z");

test("money accepts exact decimal(12,2) cents, not rounding or coercion", () => {
  assert.equal(moneyToCents("9999999999.99"), 999999999999);
  assert.equal(moneyToCents("0.01"), 1);
  assert.equal(moneyToCents("1.2"), 120);
  for (const amount of ["0", "-1", "1.001", "1e2", "NaN", "Infinity", "10000000000", " 1", "", ".5"]) {
    assert.throws(() => moneyToCents(amount), /Revisá los importes/);
  }
});

test("allocation JSON requires explicit nonduplicate targets and decimal strings", () => {
  assert.deepEqual(parseAllocations('[{"chargeEntryId":"c1","amount":"1.20"}]'), [{ chargeEntryId: "c1", cents: 120 }]);
  for (const input of ["", "null", "{}", "[]", "[null]", '[{"chargeEntryId":"c1","amount":1}]', '[{"chargeEntryId":"","amount":"1"}]', '[{"chargeEntryId":"c1","amount":"1"},{"chargeEntryId":"c1","amount":"2"}]']) {
    assert.throws(() => parseAllocations(input));
  }
});

test("Argentina calendar date is strict and does not drift to previous day", () => {
  assert.equal(argentinaPaymentDate("2026-10-19").toISOString(), "2026-10-19T15:00:00.000Z");
  assert.equal(argentinaPaymentDate("2024-02-29").toISOString(), "2024-02-29T15:00:00.000Z");
  assert.equal(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(argentinaPaymentDate("2026-10-19")), "2026-10-19");
  for (const value of ["2026-02-29", "2026-04-31", "2026-13-01", "2026-1-01", "", "2026-10-19T00:00:00Z"]) {
    assert.throws(() => argentinaPaymentDate(value), /fecha/);
  }
});

test("legacy credits do not arbitrarily pay charges; voided allocations restore debt", () => {
  const entries = [
    { id: "charge", type: "MONTHLY_CHARGE", amount: "100", description: "Tuition", occurredAt: date, allocationsAsCredit: [] },
    { id: "credit", type: "PAYMENT", amount: "-40", description: "Payment", occurredAt: date, payment: { status: "REGISTERED" }, allocationsAsCredit: [{ chargeEntryId: "charge", amount: "10" }] },
    { id: "waiver", type: "BALANCE_WAIVER", amount: "-20", description: "Waiver", occurredAt: date, allocationsAsCredit: [] },
    { id: "void", type: "PAYMENT", amount: "-10", description: "Void", occurredAt: date, payment: { status: "VOIDED" }, allocationsAsCredit: [{ chargeEntryId: "charge", amount: "10" }] },
    { id: "reversal", type: "PAYMENT_REVERSAL", amount: "10", description: "Reversal", occurredAt: date, allocationsAsCredit: [] },
  ];
  const summary = buildAllocationSummary(entries);
  assert.deepEqual(summary.pendingCharges, [{ id: "charge", description: "Tuition", occurredAt: date.toISOString(), amount: "100.00", outstandingAmount: "90.00" }]);
  assert.deepEqual(summary.unallocatedCredits, [
    { id: "credit", description: "Payment", occurredAt: date.toISOString(), amount: "40.00", unallocatedAmount: "30.00", type: "PAYMENT" },
    { id: "waiver", description: "Waiver", occurredAt: date.toISOString(), amount: "20.00", unallocatedAmount: "20.00", type: "BALANCE_WAIVER" },
  ]);
});
