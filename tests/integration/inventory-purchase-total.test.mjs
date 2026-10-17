import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
function load(path, mocks) {
  const module = { exports: {} };
  const output = ts.transpileModule(read(`src/${path}.ts`), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, require: (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "server-only") return {};
    if (["zod", "node:crypto"].includes(id)) return require(id);
    if (id.startsWith("@/modules/operations/")) return load(id.slice(2), mocks);
    throw Error(`Unexpected dependency ${id}`);
  }, Request, Response, Buffer, Uint8Array, TextDecoder });
  return module.exports;
}
const batch = {
  batchId: "ac5b3bb1-8eef-44c8-a16e-0ba8bffca111", reviewed: true,
  supplier: " Proveedor ", date: "2024-02-29", totalAmount: 123.45, invoiceNumber: " F-1 ",
  lines: [
    { productId: "p1", quantity: 2, unitCost: 7.5, description: " Leche " },
    { productId: "p2", quantity: 3, unitCost: null, description: "Pan" },
    { productId: "p1", quantity: 4, description: "Otra fila de leche" },
  ],
};
const messages = {
  invalid: "Revisá los productos, las cantidades y los costos antes de confirmar.",
  conflict: "Este lote ya fue confirmado con otros datos.",
  failure: "No se pudo registrar el ingreso. Reintentá con el mismo lote.",
};
const request = (data = batch) => new Request("http://localhost", { method: "POST", body: JSON.stringify(data) });
function app(options = {}) {
  let purchases = [];
  let movements = options.legacy ? [{ id: `invoice:${batch.batchId}:0`, quantity: 2, purchaseId: null }] : [];
  const effects = { transactions: 0, purchaseInserts: 0, movementInserts: 0, refresh: 0, productReads: 0 };
  let actor = "actor";
  const snapshot = () => JSON.stringify({ purchases, movements });
  const prisma = { $transaction: async (callback, config) => {
    assert.equal(config.isolationLevel, "Serializable");
    effects.transactions++;
    const initialPurchases = [...purchases];
    const initialMovements = [...movements];
    const pendingPurchases = [];
    const pendingMovements = [];
    await callback({
      inventoryPurchase: {
        findUnique: async ({ where }) => initialPurchases.find((row) => row.id === where.id) ?? null,
        create: async ({ data }) => { pendingPurchases.push(data); return data; },
      },
      inventoryProduct: { findMany: async ({ where }) => {
        effects.productReads++;
        return where.id.in.filter((id) => !options.missingProduct && ["p1", "p2"].includes(id)).map((id) => ({ id }));
      } },
      inventoryMovement: {
        findMany: async ({ where }) => initialMovements.filter((row) =>
          where.OR ? where.OR.some((clause) => clause.id ? row.id.startsWith(clause.id.startsWith) : row.purchaseId === clause.purchaseId)
            : where.id ? row.id.startsWith(where.id.startsWith) : row.purchaseId === where.purchaseId),
        createMany: async ({ data }) => {
          assert.ok(data.every((row) => pendingPurchases.some((purchase) => purchase.id === row.purchaseId)), "purchase is inserted before its linked movements");
          pendingMovements.push(...data);
          if (options.insertionFailure) throw Error("private insertion details");
        },
      },
    });
    if (options.uncertain) throw Error("unknown commit outcome");
    if (pendingPurchases.some((row) => purchases.some((old) => old.id === row.id))
      || pendingMovements.some((row) => movements.some((old) => old.id === row.id))) throw Object.assign(Error("duplicate"), { code: "P2002" });
    purchases.push(...pendingPurchases); movements.push(...pendingMovements);
    effects.purchaseInserts += pendingPurchases.length; effects.movementInserts += pendingMovements.length;
  } };
  const mocks = {
    "@/lib/prisma": { prisma }, "@/lib/env": { env: {} },
    "@prisma/client": { Prisma: { TransactionIsolationLevel: { Serializable: "Serializable" } } },
    "next/cache": { revalidatePath: () => { effects.refresh++; } },
    "@/modules/operations/server/operations-access": { requireOperationsOperator: async (permission) => {
      assert.equal(permission, "inventory.operate");
      if (options.denied) throw Error("denied");
      return { id: actor };
    } },
    "@/modules/operations/server/inventory-invoice.provider": {},
    "@/modules/operations/server/inventory-invoice.spreadsheet": {},
  };
  return { ...load("modules/operations/server/inventory-invoice.http", mocks), effects, snapshot,
    purchases: () => purchases, movements: () => movements, actor: (id) => { actor = id; } };
}
async function success(response) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(await response.json(), { ok: true, message: "Ingreso de stock registrado." });
}
async function reject(api, input, status, message, prevalidation = false) {
  const before = api.snapshot();
  const counters = { ...api.effects };
  const response = await api.confirmInvoice(request(input));
  assert.equal(response.status, status);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual(await response.json(), { ok: false, message });
  assert.equal(api.snapshot(), before, "rejected confirmation leaves purchases and movements unchanged");
  assert.equal(api.effects.purchaseInserts, counters.purchaseInserts);
  assert.equal(api.effects.movementInserts, counters.movementInserts);
  assert.equal(api.effects.refresh, counters.refresh);
  if (prevalidation) assert.deepEqual(api.effects, counters);
}

test("S6 total is required, numeric, finite, nonnegative and Decimal(12,2) before transactions", async () => {
  const api = app();
  await success(await api.confirmInvoice(request()));
  for (const totalAmount of [undefined, null, "123.45", -1, NaN, Infinity, -Infinity, 0.001, 1.234, 10000000000]) {
    await reject(api, { ...batch, totalAmount }, 400, messages.invalid, true);
  }
  // JSON.stringify turns nonfinite numbers into null. Exercise actual parsed infinity too.
  for (const rawNumber of ["NaN", "1e400", "-1e400"]) {
    const before = api.snapshot(); const counters = { ...api.effects };
    const response = await api.confirmInvoice(new Request("http://localhost", { method: "POST", body: JSON.stringify(batch).replace('"totalAmount":123.45', `"totalAmount":${rawNumber}`) }));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { ok: false, message: messages.invalid });
    assert.equal(api.snapshot(), before); assert.deepEqual(api.effects, counters);
  }
});

test("S6 zero/max purchase total is stored once with linked rows, repeated products and independent costs", async () => {
  for (const totalAmount of [0, 9999999999.99, 123.45]) {
    const api = app();
    await success(await api.confirmInvoice(request({ ...batch, totalAmount })));
    assert.equal(api.purchases().length, 1); assert.equal(api.movements().length, 3);
    const purchase = api.purchases()[0];
    assert.equal(purchase.id, batch.batchId); assert.equal(Number(purchase.totalAmount), totalAmount);
    assert.equal(purchase.supplier, "Proveedor"); assert.equal(purchase.invoiceNumber, "F-1");
    assert.equal(purchase.createdById, "actor"); assert.match(purchase.fingerprint, /^[a-f0-9]{64}$/);
    assert.equal(purchase.occurredAt.toISOString(), "2024-02-29T12:00:00.000Z");
    assert.equal(Object.hasOwn(purchase, "createdAt"), false);
    api.movements().forEach((row, i) => {
      assert.equal(row.purchaseId, batch.batchId); assert.equal(row.id, `invoice:${batch.batchId}:${i}`);
      assert.equal(row.unitCost, batch.lines[i].unitCost ?? null); assert.equal(row.quantity, batch.lines[i].quantity);
      assert.equal(row.productId, batch.lines[i].productId); assert.equal(row.createdById, "actor");
      assert.equal(row.occurredAt.toISOString(), "2024-02-29T12:00:00.000Z");
      assert.equal(Object.hasOwn(row, "totalAmount"), false); assert.equal(Object.hasOwn(row, "createdAt"), false);
    });
    assert.equal(api.effects.productReads, 1);
  }
});

test("S6 normalized replay succeeds; changed total/metadata/actor/lines conflicts without writes", async () => {
  const api = app(); await success(await api.confirmInvoice(request()));
  const before = api.snapshot(); const inserts = api.effects.purchaseInserts;
  await success(await api.confirmInvoice(request({ ...batch, batchId: batch.batchId.toUpperCase(), supplier: "Proveedor", invoiceNumber: "F-1", lines: batch.lines.map((line) => ({ ...line, description: line.description.trim(), unitCost: line.unitCost ?? null })) })));
  assert.equal(api.snapshot(), before); assert.equal(api.effects.purchaseInserts, inserts);
  for (const change of [{ totalAmount: 123.46 }, { supplier: "Otro" }, { date: "2024-03-01" }, { invoiceNumber: "F-2" }, { lines: [...batch.lines].reverse() }, { lines: [{ ...batch.lines[0], quantity: 5 }] }]) {
    await reject(api, { ...batch, ...change }, 409, messages.conflict);
  }
  api.actor("other"); await reject(api, batch, 409, messages.conflict);
});

test("S6 purchase metadata, fingerprint and actual linked rows are all verified on replay", async () => {
  for (const corrupt of [
    (api) => { api.purchases()[0].totalAmount = 999; },
    (api) => { api.purchases()[0].fingerprint = "wrong"; },
    (api) => { api.purchases()[0].supplier = "wrong"; },
    (api) => { api.purchases()[0].occurredAt = new Date("2025-01-01"); },
    (api) => { api.purchases()[0].invoiceNumber = null; },
    (api) => { api.purchases()[0].createdById = "other"; },
    (api) => { api.movements()[0].purchaseId = null; },
    (api) => { api.movements()[0].quantity = 99; },
    (api) => { api.movements().pop(); },
    (api) => { api.movements().push({ ...api.movements()[0], id: "unexpected-linked-row" }); },
  ]) {
    const api = app(); await success(await api.confirmInvoice(request())); corrupt(api);
    await reject(api, batch, 409, messages.conflict);
  }
});

test("S6 product deletion, insertion failure, denied permission and uncertain outcome never report success", async () => {
  for (const [options, status, message] of [
    [{ missingProduct: true }, 400, "Uno de los productos ya no existe."],
    [{ insertionFailure: true }, 500, messages.failure],
    [{ uncertain: true }, 500, messages.failure],
    [{ denied: true }, 403, "No tenés permiso para operar el inventario."],
  ]) await reject(app(options), batch, status, message, !!options.denied);
});

test("S6 legacy movement-only UUID is a conflict, never a guessed purchase or duplicate stock", async () => {
  await reject(app({ legacy: true }), batch, 409, messages.conflict);
});

test("S6 concurrent identical retries commit one purchase and one set of movements", async () => {
  const api = app();
  for (const response of await Promise.all([api.confirmInvoice(request()), api.confirmInvoice(request())])) await success(response);
  assert.equal(api.purchases().length, 1); assert.equal(api.movements().length, 3);
  assert.equal(api.effects.purchaseInserts, 1); assert.equal(api.effects.movementInserts, 3);
  assert.ok(api.effects.transactions >= 3);
});

test("S6 concurrent changed totals have one success and one conflict", async () => {
  const api = app();
  const responses = await Promise.all([api.confirmInvoice(request()), api.confirmInvoice(request({ ...batch, totalAmount: 999 }))]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  for (const response of responses) {
    if (response.status === 200) await success(response);
    else assert.deepEqual(await response.json(), { ok: false, message: messages.conflict });
  }
  assert.equal(api.purchases().length, 1); assert.equal(api.movements().length, 3);
  assert.equal(api.effects.purchaseInserts, 1); assert.equal(api.effects.movementInserts, 3);
});

test("S6 additive schema/migration stores one purchase total and keeps legacy movements nullable", () => {
  const schema = read("prisma/schema.prisma").replaceAll("\r\n", "\n");
  const purchase = schema.match(/model InventoryPurchase \{([\s\S]*?)\n ?\}/)?.[1];
  assert.ok(purchase, "typed purchase model exists");
  for (const field of [/id\s+String\s+@id/, /supplier\s+String/, /occurredAt\s+DateTime/, /totalAmount\s+Decimal\s+@db.Decimal\(12, 2\)/, /invoiceNumber\s+String\?/, /fingerprint\s+String/, /createdById\s+String\?/, /createdAt\s+DateTime\s+@default\(now\(\)\)/, /movements\s+InventoryMovement\[\]/, /@@index\(\[occurredAt\]\)/]) assert.match(purchase, field);
  const movement = schema.match(/model InventoryMovement \{([\s\S]*?)\n ?\}/)[1];
  assert.match(movement, /purchaseId\s+String\?/);
  assert.match(movement, /purchase\s+InventoryPurchase\?\s+@relation\(fields: \[purchaseId\], references: \[id\], onDelete: Restrict\)/);
  assert.match(movement, /@@index\(\[purchaseId\]\)/);
  const sql = read("prisma/migrations/20261016220000_add_inventory_purchases/migration.sql");
  assert.match(sql, /CREATE TABLE "InventoryPurchase"/);
  assert.match(sql, /"totalAmount" DECIMAL\(12,2\) NOT NULL/);
  assert.match(sql, /ADD COLUMN\s+"purchaseId" TEXT(?! NOT NULL)/);
  assert.match(sql, /FOREIGN KEY \("purchaseId"\) REFERENCES "InventoryPurchase"\("id"\) ON DELETE RESTRICT/);
  assert.match(sql, /CREATE INDEX "InventoryPurchase_occurredAt_idx"/);
  assert.match(sql, /CREATE INDEX "InventoryMovement_purchaseId_idx"/);
  assert.doesNotMatch(sql, /\b(DROP|UPDATE|DELETE|INSERT|TRUNCATE)\b(?! RESTRICT| CASCADE)/i);
  assert.doesNotMatch(sql, /Psychopedagogy|TeacherProfile|Student/);
  assert.equal((schema.match(/psychopedagogyEntries PsychopedagogyEntry\[\]/g) ?? []).length, 2);
  assert.equal(schema.match(/model PsychopedagogyEntry \{[\s\S]*?\n\}/)?.[0], `model PsychopedagogyEntry {
  id        String         @id @default(cuid())
  studentId String
  student   Student        @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacherId String
  teacher   TeacherProfile @relation(fields: [teacherId], references: [id], onDelete: Restrict)
  entryDate DateTime       @db.Date
  title     String
  body      String
  createdAt DateTime       @default(now())

  @@index([studentId, entryDate])
  @@index([teacherId])
}`);
});
