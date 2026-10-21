import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import pg from "pg";

const enabled = process.env.RUN_ISOLATED_RUBRIC_MIGRATION === "1";

test("rubric migration rejects assigned plans atomically and removes only the isolated old catalog", { skip: !enabled, timeout: 25000 }, async () => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for the opt-in isolated probe");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, query_timeout: 15000 });
  const schema = `rubric_probe_${randomUUID().replaceAll("-", "")}`;
  const tables = ["Plan", "PlanEventualChargeItem", "Family", "Student", "FamilyAccountEntry", "FamilyPaymentAllocation", "FamilyPayment", "PaymentReceipt", "ReceiptDelivery", "EventualChargeSchedule"];
  const raw = await readFile(new URL("../../prisma/migrations/20261021120000_student_billing_rubrics/migration.sql", import.meta.url), "utf8");
  assert.equal((raw.match(/^BEGIN;$/gm) ?? []).length, 1);
  assert.equal((raw.match(/^COMMIT;$/gm) ?? []).length, 1);
  // The outer probe transaction must always roll back, including migration DDL.
  const sql = raw.replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, "");
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout='10s'");
    await client.query("SET LOCAL lock_timeout='3s'");
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}"`);
    for (const table of tables) await client.query(`CREATE TABLE "${table}" (LIKE public."${table}" INCLUDING ALL)`);
    await client.query(`INSERT INTO "Plan" (id,name,"monthlyFee","updatedAt") VALUES ('probe-plan','Probe plan',120000,NOW())`);
    await client.query(`INSERT INTO "PlanEventualChargeItem" (id,"planId",name,"suggestedAmount","updatedAt") VALUES ('probe-item','probe-plan','Probe item',120000,NOW())`);
    await client.query(`INSERT INTO "Family" (id,name,"planId","updatedAt") VALUES ('probe-family','Preserved family','probe-plan',NOW())`);
    await client.query(`ALTER TABLE "Family" ADD FOREIGN KEY ("planId") REFERENCES "Plan"(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE "Student" ADD FOREIGN KEY ("planId") REFERENCES "Plan"(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE "PlanEventualChargeItem" ADD FOREIGN KEY ("planId") REFERENCES "Plan"(id) ON DELETE CASCADE`);
    await client.query(`ALTER TABLE "FamilyAccountEntry" ADD FOREIGN KEY ("eventualChargeItemId") REFERENCES "PlanEventualChargeItem"(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE "EventualChargeSchedule" ADD FOREIGN KEY ("eventualChargeItemId") REFERENCES "PlanEventualChargeItem"(id) ON DELETE SET NULL`);
    await client.query("SAVEPOINT rejected_input");
    await assert.rejects(client.query(sql), /requires empty accounting tables and no family\/student plan assignments/);
    await client.query("ROLLBACK TO SAVEPOINT rejected_input");
    const preserved = (await client.query(`SELECT (SELECT count(*)::int FROM "Plan") AS plans,(SELECT count(*)::int FROM "PlanEventualChargeItem") AS items,(SELECT "planId" FROM "Family" WHERE id='probe-family') AS assignment`)).rows[0];
    assert.deepEqual(preserved, { plans: 1, items: 1, assignment: "probe-plan" });
    await client.query(`UPDATE "Family" SET "planId"=NULL WHERE id='probe-family'`);
    const beforeFamily = (await client.query(`SELECT to_jsonb(f) AS data FROM "Family" f`)).rows;
    await client.query(sql);
    assert.deepEqual((await client.query(`SELECT to_jsonb(f) AS data FROM "Family" f`)).rows, beforeFamily);
    for (const table of ["Plan", "PlanEventualChargeItem", "BillingRubric"]) assert.equal((await client.query(`SELECT count(*)::int AS n FROM "${table}"`)).rows[0].n, 0);
    assert.equal((await client.query(`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema=$1 AND table_name='EventualChargeSchedule' AND column_name='rubricId'`, [schema])).rows[0].n, 1);
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    await client.end();
  }
});
