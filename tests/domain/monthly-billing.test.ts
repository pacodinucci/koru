import assert from "node:assert/strict";
import test from "node:test";

import { formatBillingPeriod, getBillingPeriod } from "../../src/modules/families/lib/monthly-billing";

test("el período de facturación respeta el mes de Argentina", () => {
  const period = getBillingPeriod(new Date("2026-09-01T02:30:00.000Z"));
  assert.equal(period.toISOString(), "2026-08-01T00:00:00.000Z");
});

test("el período se normaliza al primer día del mes", () => {
  const period = getBillingPeriod(new Date("2026-09-15T15:30:00.000Z"));
  assert.equal(period.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(formatBillingPeriod(period), "septiembre de 2026");
});