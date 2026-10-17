import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = "modules/operations/";
function load(path, mocks = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "server-only") return {};
    if (["zod", "node:crypto", "node:zlib", "xlsx"].includes(id)) return require(id);
    if (id.startsWith("@/modules/operations/")) return load(id.slice(2) + ".ts", mocks);
    throw new Error(`Unexpected dependency ${id}`);
  }, Request, Response, FormData, Blob, Buffer, Uint8Array, AbortSignal, TextDecoder, console });
  return module.exports;
}
const catalog = [{ id: "p1", name: "Leche", unit: "unidad" }, { id: "p2", name: "Leche", unit: "caja" }];
const draftLine = { description: "Leche caja x12", invoiceQuantity: 2, invoiceUnit: "caja", productId: "p1", stockQuantity: 24, unitsPerInvoiceUnit: 12, unitCost: 10, confidence: "high", note: null, packageSize: 12, sourceUnitCost: 120, costBasis: "invoice" };
const draft = (line = {}) => ({ supplier: "Proveedor", invoiceNumber: "F-1", lines: [{ ...draftLine, ...line }], warnings: [] });
const batch = { batchId: "ac5b3bb1-8eef-44c8-a16e-0ba8bffca111", reviewed: true, totalAmount: 240, supplier: "Proveedor", date: "2024-02-29", invoiceNumber: "F-1", lines: [{ productId: "p1", quantity: 24, unitCost: 10, description: "Leche caja x12" }] };
function api(options = {}) {
  const effects = { auth: [], catalog: 0, paid: [], writes: [], transactions: 0, refresh: 0 };
  let stored = [];
  let purchases = [];
  const db = {
    inventoryProduct: { findMany: async () => { effects.catalog++; return options.missingProduct ? [] : catalog; }, create: async ({ data }) => { if (options.createError) throw Error("private database detail"); effects.writes.push(data); return { id: "new", ...data }; } },
    $transaction: async (callback) => {
      effects.transactions++;
      const working = [...stored];
      const pendingPurchases = [];
      const tx = { inventoryPurchase: {
        findUnique: async ({ where }) => purchases.find((purchase) => purchase.id === where.id) ?? null,
        create: async ({ data }) => { pendingPurchases.push(data); return data; },
      }, inventoryProduct: db.inventoryProduct, inventoryMovement: {
        findMany: async ({ where }) => working.filter((row) => where.OR.some((clause) => clause.id ? row.id.startsWith(clause.id.startsWith) : row.purchaseId === clause.purchaseId)),
        createMany: async ({ data }) => {
          working.push(...data);
          if (options.rollback) throw Error("private database detail");
        },
      } };
      const initialIds = new Set(stored.map((row) => row.id));
      const result = await callback(tx);
      const inserted = working.filter((row) => !initialIds.has(row.id));
      if (inserted.some((row) => stored.some((old) => old.id === row.id))) throw Object.assign(Error("duplicate"), { code: "P2002" });
      if (pendingPurchases.some((purchase) => purchases.some((old) => old.id === purchase.id))) throw Object.assign(Error("duplicate"), { code: "P2002" });
      purchases.push(...pendingPurchases);
      effects.writes.push(...inserted);
      stored = [...stored, ...inserted];
      return result;
    },
  };
  const mocks = {
    "@/lib/prisma": { prisma: db },
    "@/lib/env": { env: { OPENAI_API_KEY: options.noKey ? undefined : "test-key", OPENAI_INVOICE_MODEL: "gpt-4.1-mini" } },
    "next/cache": { revalidatePath: () => effects.refresh++ },
    "@prisma/client": { Prisma: { TransactionIsolationLevel: { Serializable: "Serializable" } } },
    "@/modules/operations/server/operations-access": {
      requireOperationsOperator: async (permission) => { effects.auth.push(permission); if (options.denied) throw Error("private auth detail"); return { id: "actor" }; },
      requireOperationsSuperAdmin: async (permission) => { effects.auth.push(permission); if (options.denied) throw Error("private auth detail"); return { id: "admin" }; },
    },
  };
  mocks["@/modules/operations/server/inventory-invoice.provider"] = load(root + "server/inventory-invoice.provider.ts", mocks);
  const fetcher = async (url, init) => {
    effects.paid.push({ url, ...init, body: JSON.parse(init.body) });
    if (options.timeout) throw Object.assign(Error("secret timeout detail"), { name: "TimeoutError" });
    if (options.network) throw Error("secret network detail");
    return Response.json(options.providerResponse ?? { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(options.draft ?? draft()) }] }] }, { status: options.httpStatus ?? 200 });
  };
  // The provider's native fetch is replaced at its public transport boundary.
  mocks["@/modules/operations/server/inventory-invoice.provider"] = {
    ...mocks["@/modules/operations/server/inventory-invoice.provider"],
    extractInvoice: (args) => loadProvider(mocks).extractInvoice({ ...args, fetcher }),
  };
  const handlers = load(root + "server/inventory-invoice.http.ts", mocks);
  const action = load(root + "server/inventory-invoice.actions.ts", mocks);
  return { ...handlers, ...action, effects, rows: () => stored };
}
function loadProvider(mocks) { return load(root + "server/inventory-invoice.provider.ts", mocks); }
function upload(bytes = Buffer.from([0xff, 0xd8, 0xff, 0, 1]), type = "image/jpeg", count = 1, filename = "invoice") {
  const data = new FormData();
  for (let i = 0; i < count; i++) data.append("file", new Blob([bytes], { type }), filename);
  return new Request("http://localhost/api/operations/inventory/invoice", { method: "POST", body: data });
}
const confirmRequest = (data = batch) => new Request("http://localhost", { method: "POST", body: JSON.stringify(data) });
async function rejected(response, status, message) {
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), { ok: false, message });
}

test("analysis authorizes first and never writes stock", async () => {
  const denied = api({ denied: true });
  await rejected(await denied.analyzeInvoice(new Request("http://localhost", { method: "POST", body: "invalid" })), 403, "No tenés permiso para operar el inventario.");
  assert.equal(denied.effects.catalog, 0);
  assert.equal(denied.effects.paid.length, 0);
  const allowed = api();
  const response = await allowed.analyzeInvoice(upload());
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.draft.lines[0].stockQuantity, 24);
  assert.equal(result.draft.lines[0].unitCost, 10);
  assert.deepEqual(allowed.effects.auth, ["inventory.operate"]);
  assert.equal(allowed.rows().length, 0);
  assert.equal(allowed.effects.transactions, 0);
});

test("JPEG PNG WebP and PDF use Responses image/file shapes, catalog and strict private output", async () => {
  for (const [bytes, mime, kind] of [
    [Buffer.from([255, 216, 255]), "image/jpeg", "input_image"],
    [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png", "input_image"],
    [Buffer.from("RIFF0000WEBP"), "image/webp", "input_image"],
    [Buffer.from("%PDF-1.7\n"), "application/pdf", "input_file"],
  ]) {
    const app = api();
    assert.equal((await app.analyzeInvoice(upload(bytes, mime))).status, 200);
    const call = app.effects.paid[0];
    assert.equal(call.url, "https://api.openai.com/v1/responses");
    assert.equal(call.body.store, false);
    assert.equal(call.body.model, "gpt-4.1-mini");
    assert.equal(call.body.text.format.type, "json_schema");
    assert.equal(call.body.text.format.strict, true);
    const content = call.body.input[0].content;
    assert.equal(content[1].type, kind);
    assert.match(content[1][kind === "input_file" ? "file_data" : "image_url"], new RegExp(`^data:${mime};base64,`));
    assert.match(content[0].text, /p1/);
    assert.match(content[0].text, /unidad/);
    assert.ok(call.signal);
  }
});

test("invalid, empty, extra, forged MIME and oversized files are rejected before provider", async () => {
  for (const request of [upload(Buffer.alloc(0)), upload(Buffer.from("text")), upload(Buffer.from("%PDF-1.7"), "image/png"), upload(undefined, undefined, 2), upload(Buffer.concat([Buffer.from([255, 216, 255]), Buffer.alloc(4 * 1024 * 1024 - 2)])), new Request("http://localhost", { method: "POST", body: new FormData() })]) {
    const app = api();
    const response = await app.analyzeInvoice(request);
    assert.ok([400, 413].includes(response.status));
    assert.equal((await response.json()).ok, false);
    assert.equal(app.effects.paid.length, 0);
    assert.equal(app.effects.writes.length, 0);
  }
  const app = api();
  const exact = Buffer.alloc(4 * 1024 * 1024); exact.set([255, 216, 255]);
  assert.equal((await app.analyzeInvoice(upload(exact))).status, 200);
  const huge = new Request("http://localhost", { method: "POST", body: "x".repeat(4 * 1024 * 1024 + 16385) });
  assert.equal((await app.analyzeInvoice(huge)).status, 413);
});

test("missing key, timeout, provider status/refusal/incomplete/malformed output are safe", async () => {
  for (const options of [{ noKey: true }, { network: true }, { timeout: true }, { httpStatus: 429 }, { providerResponse: { status: "incomplete", output: [] } }, { providerResponse: { status: "completed", output: [{ content: [{ type: "refusal", refusal: "secret" }] }] } }, { providerResponse: { status: "completed", output: [{ content: [{ type: "output_text", text: "not json" }] }] } }, { draft: draft({ productId: "foreign" }) }, { draft: draft({ invoiceQuantity: -1 }) }, { draft: draft({ stockQuantity: "24" }) }]) {
    const app = api(options);
    const response = await app.analyzeInvoice(upload());
    assert.ok([400, 503, 502].includes(response.status));
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.doesNotMatch(body.message, /secret|private|test-key/);
    assert.equal(app.effects.writes.length, 0);
    if (options.noKey) assert.equal(app.effects.paid.length, 0);
  }
});

test("known conversion is checked; boxes remain boxes; unknown or ambiguous needs review", async () => {
  for (const [line, quantity, cost] of [
    [{}, 24, 10],
    [{ productId: "p2", stockQuantity: 2, unitsPerInvoiceUnit: 1, packageSize: null, unitCost: 120 }, 2, 120],
    [{ packageSize: null }, null, null],
    [{ stockQuantity: 25 }, null, null],
    [{ productId: null }, null, null],
    [{ costBasis: "total" }, 24, null],
  ]) {
    const app = api({ draft: draft(line) });
    const body = await (await app.analyzeInvoice(upload())).json();
    assert.equal(body.draft.lines[0].stockQuantity, quantity);
    assert.equal(body.draft.lines[0].unitCost, cost);
    if (quantity === null) assert.equal(body.draft.lines[0].confidence, "low");
  }
});

test("confirm validates review, UUID, numbers, precision, products and permissions without writes", async () => {
  for (const data of [null, [], { ...batch, reviewed: false }, { ...batch, batchId: "bad" }, { ...batch, lines: [] }, { ...batch, total: 240 }, { ...batch, lines: [{ ...batch.lines[0], total: 240 }] }, ...[0, -1, 0.0001, 1000000000, "2"].map((quantity) => ({ ...batch, lines: [{ ...batch.lines[0], quantity }] })), ...[-1, 0.001, 10000000000].map((unitCost) => ({ ...batch, lines: [{ ...batch.lines[0], unitCost }] }))]) {
    const app = api();
    await rejected(await app.confirmInvoice(confirmRequest(data)), 400, "Revisá los productos, las cantidades y los costos antes de confirmar.");
    assert.equal(app.effects.writes.length, 0);
    assert.equal(app.effects.transactions, 0);
  }
  const missing = api({ missingProduct: true });
  await rejected(await missing.confirmInvoice(confirmRequest()), 400, "Uno de los productos ya no existe.");
  assert.equal(missing.rows().length, 0);
  const denied = api({ denied: true });
  await rejected(await denied.confirmInvoice(confirmRequest()), 403, "No tenés permiso para operar el inventario.");
  assert.equal(denied.effects.transactions, 0);
});

test("confirm is atomic, attributed, replay-safe and rejects changed batch payload", async () => {
  const app = api();
  const result = await app.confirmInvoice(confirmRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true, message: "Ingreso de stock registrado." });
  assert.equal(app.rows().length, 1);
  assert.equal(app.rows()[0].type, "STOCK_IN");
  assert.equal(app.rows()[0].createdById, "actor");
  assert.equal(app.rows()[0].quantity, 24);
  assert.match(app.rows()[0].reason, /Proveedor/);
  assert.equal((await app.confirmInvoice(confirmRequest())).status, 200);
  assert.equal(app.rows().length, 1);
  await rejected(await app.confirmInvoice(confirmRequest({ ...batch, lines: [{ ...batch.lines[0], quantity: 25 }] })), 409, "Este lote ya fue confirmado con otros datos.");
  assert.equal(app.rows().length, 1);
  const rollback = api({ rollback: true });
  assert.equal((await rollback.confirmInvoice(confirmRequest({ ...batch, lines: [batch.lines[0], { ...batch.lines[0], productId: "p2" }] }))).status, 500);
  assert.equal(rollback.rows().length, 0);
  assert.equal(rollback.effects.writes.length, 0);
});

test("concurrent identical confirmations cannot duplicate movements", async () => {
  const app = api();
  const responses = await Promise.all([app.confirmInvoice(confirmRequest()), app.confirmInvoice(confirmRequest())]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.equal(app.rows().length, 1);
  assert.ok(app.effects.transactions >= 3, "loser retries after primary-key conflict");
});

test("decimal boundaries and omitted costs preserve reviewed stock intake", async () => {
  const app = api();
  const input = { ...batch, invoiceNumber: null, lines: [
    { productId: "p1", quantity: 999999999.999, unitCost: 9999999999.99, description: "Límite" },
    { productId: "p2", quantity: 0.001, description: "Sin costo" },
  ] };
  assert.equal((await app.confirmInvoice(confirmRequest(input))).status, 200);
  assert.equal(app.rows().length, 2);
  assert.equal(app.rows()[1].unitCost, null);
  const malformed = api();
  await rejected(await malformed.confirmInvoice(new Request("http://localhost", { method: "POST", body: "{" })), 400, "Revisá los productos, las cantidades y los costos antes de confirmar.");
  assert.equal(malformed.effects.transactions, 0);
  assert.equal(malformed.rows().length, 0);
});

test("concurrent changed batches have one winner and one conflict", async () => {
  const app = api();
  const responses = await Promise.all([
    app.confirmInvoice(confirmRequest()),
    app.confirmInvoice(confirmRequest({ ...batch, supplier: "Otro proveedor" })),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.equal(app.rows().length, 1);
});

test("explicit product creation requires configure and returns product identity safely", async () => {
  const form = () => { const data = new FormData(); data.set("name", " Jabón "); data.set("unit", "unidad"); data.set("minimumStock", "0"); return data; };
  const app = api();
  assert.equal(JSON.stringify(await app.createInvoiceProductAction(form())), JSON.stringify({ ok: true, product: { id: "new", name: "Jabón", unit: "unidad" }, message: "Producto creado." }));
  assert.deepEqual(app.effects.auth, ["inventory.configure"]);
  const denied = api({ denied: true });
  assert.equal((await denied.createInvoiceProductAction(form())).ok, false);
  assert.equal(denied.effects.writes.length, 0);
  const invalid = form(); invalid.set("minimumStock", "0.0001");
  assert.equal((await app.createInvoiceProductAction(invalid)).ok, false);
  const fail = api({ createError: true });
  assert.doesNotMatch((await fail.createInvoiceProductAction(form())).message, /private/);
});

test("manual stock intake public action preserves original behavior", async () => {
  const writes = [];
  const manual = load(root + "server/inventory.actions.ts", {
    "@prisma/client": { InventoryMovementType: { STOCK_IN: "STOCK_IN" }, InventoryRequestStatus: {}, Prisma: {} },
    "next/cache": { revalidatePath() {} },
    "@/lib/prisma": { prisma: { inventoryMovement: { create: async ({ data }) => writes.push(data) } } },
    "@/modules/operations/server/operations-access": { requireOperationsOperator: async () => ({ id: "operator" }) },
    "@/modules/mailing/server/mailing.service": {},
  });
  const form = new FormData();
  for (const [key, value] of Object.entries({ productId: "p1", quantity: "3", unitCost: "4.50", reason: "Ingreso manual" })) form.set(key, value);
  assert.equal(JSON.stringify(await manual.registerInventoryStockMovementAction(form)), JSON.stringify({ ok: true, message: "Ingreso de stock registrado." }));
  assert.equal(JSON.stringify(writes), JSON.stringify([{ productId: "p1", type: "STOCK_IN", quantity: 3, unitCost: 4.5, reason: "Ingreso manual", createdById: "operator" }]));
});
