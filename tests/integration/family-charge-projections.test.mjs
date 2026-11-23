import assert from "node:assert/strict";
import test from "node:test";

const current = new Date("2026-10-01T00:00:00Z");
const schedule = (overrides = {}) => ({
  id: "rubric", familyId: "family", itemName: "Materiales", isBase: false,
  totalAmount: "100.00", grossAmount: "120.00", installmentCount: 3,
  startPeriod: new Date("2026-10-01T00:00:00Z"), effectiveFrom: null, cancelledFrom: null,
  student: { firstName: "Ana", lastName: "Pérez", familyId: "family" }, accountEntries: [],
  ...overrides,
});

// Read-only projections: no Prisma, database or generated accounting entries.
test("future projection keeps saved net installment cents and excludes the current month without mutation", async () => {
  const { projectFutureFamilyCharges } = await import("../../src/modules/families/lib/family-charge-projections.ts");
  const schedules = [schedule()];
  const before = JSON.stringify(schedules);
  const rows = projectFutureFamilyCharges(schedules, current);
  assert.deepEqual(rows.map((r) => [r.id, r.amount, r.grossAmount, r.discountAmount, r.occurredAt]), [
    ["future:rubric:2", "33.33", "40.00", "6.67", "2026-10-25T03:00:00.000Z"],
    ["future:rubric:3", "33.34", "40.00", "6.66", "2026-11-25T03:00:00.000Z"],
  ]);
  assert.ok(rows.every((r) => r.isFuture && r.payment === null && r.type === "EVENTUAL_CHARGE"));
  assert.match(rows[0].description, /Materiales.*cuota 2\/3.*noviembre de 2026.*Ana Pérez/);
  assert.equal(JSON.stringify(schedules), before);
});

test("future projection honors cancellation, effective start, emitted numbers and student ownership", async () => {
  const { projectFutureFamilyCharges } = await import("../../src/modules/families/lib/family-charge-projections.ts");
  const rows = projectFutureFamilyCharges([
    schedule({ effectiveFrom: new Date("2026-12-01T00:00:00Z") }),
    schedule({ id: "cancelled", cancelledFrom: new Date("2026-11-01T00:00:00Z") }),
    schedule({ id: "emitted", accountEntries: [{ installmentNumber: 2 }, { installmentNumber: 3 }, { installmentNumber: null }] }),
    schedule({ id: "moved", student: { firstName: "Ana", lastName: "Pérez", familyId: "other" } }),
  ], current);
  assert.deepEqual(rows.map((r) => r.id), ["future:rubric:3"]);
});

test("future projection crosses years, retains zero totals and omits finished schedules", async () => {
  const { projectFutureFamilyCharges } = await import("../../src/modules/families/lib/family-charge-projections.ts");
  const rows = projectFutureFamilyCharges([
    schedule({ startPeriod: new Date("2026-12-01T00:00:00Z"), totalAmount: "0.00", grossAmount: null, isBase: true }),
    schedule({ id: "finished", startPeriod: new Date("2025-01-01T00:00:00Z") }),
  ], new Date("2026-12-01T00:00:00Z"));
  assert.deepEqual(rows.map((r) => [r.occurredAt, r.amount, r.type]), [
    ["2026-12-25T03:00:00.000Z", "0.00", "MONTHLY_CHARGE"],
    ["2027-01-25T03:00:00.000Z", "0.00", "MONTHLY_CHARGE"],
  ]);
});
