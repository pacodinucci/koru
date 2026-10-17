import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const messages = {
  file: "Subí una imagen JPEG, PNG o WebP, un PDF o una planilla XLSX, XLS o CSV válida de hasta 4 MB.",
  malformed: "La planilla está vacía, dañada o tiene un formato no compatible.",
  limits: "La planilla supera los límites: 5 hojas, 1000 filas por hoja, 30 columnas, 10000 celdas o 100000 caracteres.",
  archive: "El XLSX está dañado, no es una planilla compatible o supera los límites de descompresión (8 MiB y 128 archivos).",
  formula: "La planilla contiene fórmulas o vínculos externos. Exportala como valores y volvé a subirla.",
  manual: "Ingresá el proveedor (hasta 200 caracteres) y una fecha válida en formato AAAA-MM-DD.",
};
const catalog = [{ id: "p1", name: "Leche", unit: "unidad" }];
const modelDraft = { supplier: "NO AUTOCOMPLETAR", invoiceNumber: "F-1", lines: [{ description: "Leche", invoiceQuantity: 2, invoiceUnit: "unidad", productId: "p1", stockQuantity: 2, unitsPerInvoiceUnit: 1, unitCost: null, confidence: "high", note: null, packageSize: null, sourceUnitCost: null, costBasis: "unknown" }], warnings: [] };
function load(path, mocks) {
  const source = readFileSync(new URL(`../../src/${path}.ts`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "server-only") return {};
    if (["zod", "node:crypto", "node:zlib", "xlsx"].includes(id)) return require(id);
    if (id.startsWith("@/modules/operations/")) return load(id.slice(2), mocks);
    throw Error(`Unexpected dependency ${id}`);
  }, Request, Response, FormData, Blob, Buffer, Uint8Array, TextDecoder, AbortSignal });
  return module.exports;
}
function app({ denied = false, spreadsheetParser, providerDraft = modelDraft } = {}) {
  const effects = { paid: [], writes: [], auth: [], catalog: 0, transactions: 0, parses: 0 };
  let rows = [];
  const purchases = [];
  const mocks = {
    "@/lib/env": { env: { OPENAI_API_KEY: "mock", OPENAI_INVOICE_MODEL: "mock" } },
    "next/cache": { revalidatePath() {} },
    "@prisma/client": { Prisma: { TransactionIsolationLevel: { Serializable: "Serializable" } } },
    "xlsx": spreadsheetParser ?? XLSX,
    "@/modules/operations/server/operations-access": { requireOperationsOperator: async (permission) => {
      effects.auth.push(permission); if (denied) throw Error("denied"); return { id: "actor" };
    } },
    "@/lib/prisma": { prisma: {
      inventoryProduct: { findMany: async () => { effects.catalog++; return catalog; } },
      $transaction: async (callback) => {
        effects.transactions++;
        const pending = [];
        const pendingPurchases = [];
        await callback({ inventoryPurchase: {
          findUnique: async ({ where }) => purchases.find((purchase) => purchase.id === where.id) ?? null,
          create: async ({ data }) => { pendingPurchases.push(data); return data; },
        }, inventoryProduct: { findMany: async () => catalog }, inventoryMovement: {
          findMany: async () => rows,
          createMany: async ({ data }) => pending.push(...data),
        } });
        purchases.push(...pendingPurchases);
        rows.push(...pending); effects.writes.push(...pending);
      },
    } },
  };
  const provider = load("modules/operations/server/inventory-invoice.provider", mocks);
  mocks["@/modules/operations/server/inventory-invoice.provider"] = { extractInvoice: (args) => provider.extractInvoice({ ...args, fetcher: async (_url, init) => {
    effects.paid.push(JSON.parse(init.body));
    return Response.json({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(providerDraft) }] }] });
  } }) };
  return { ...load("modules/operations/server/inventory-invoice.http", mocks), effects, rows: () => rows };
}
function upload(bytes, filename, type = "") {
  const form = new FormData(); form.append("file", new Blob([bytes], { type }), filename);
  return new Request("http://localhost", { method: "POST", body: form });
}
function workbook(rows = [["Producto", "Cantidad", "Precio"], ["Leche", 2, "1,50"]], kind = "xlsx", change) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Factura");
  change?.(book);
  return XLSX.write(book, { type: "buffer", bookType: kind, compression: true });
}
const batch = { batchId: "ac5b3bb1-8eef-44c8-a16e-0ba8bffca111", reviewed: true, totalAmount: 100, supplier: " Proveedor ", date: "2024-02-29", invoiceNumber: null, lines: [{ productId: "p1", quantity: 2, description: "Ingreso manual" }] };
const confirmRequest = (data) => new Request("http://localhost", { method: "POST", body: JSON.stringify(data) });
async function reject(app, request, status, message, confirm = false) {
  const before = { writes: app.effects.writes.length, paid: app.effects.paid.length, transactions: app.effects.transactions, rows: app.rows().length };
  const response = await (confirm ? app.confirmInvoice(request) : app.analyzeInvoice(request));
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), { ok: false, message });
  assert.equal(app.effects.writes.length, before.writes);
  assert.equal(app.rows().length, before.rows);
  assert.equal(app.effects.paid.length, before.paid);
  if (confirm && status === 400) assert.equal(app.effects.transactions, before.transactions);
}

test("CSV UTF8/BOM/semicolon and common MIME variants become structured text, never file_data", async () => {
  for (const mime of ["", "text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"]) {
    const api = app();
    const response = await api.analyzeInvoice(upload(Buffer.from('\uFEFFProducto;Cantidad;Precio\r\n"Café; leche";2;"1,50"\r\n'), "factura.CSV", mime));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.draft.supplier, null);
    const content = api.effects.paid[0].input[0].content;
    assert.equal(content[1].type, "input_text");
    assert.match(content[1].text, /Café; leche/);
    assert.match(content[1].text, /1,50/);
    assert.doesNotMatch(JSON.stringify(content), /file_data|base64/);
    assert.equal(api.effects.writes.length, 0);
  }
});

test("XLSX and XLS preserve raw numeric cells and comma strings without object header keys", async () => {
  for (const [kind, mime] of [["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], ["xls", "application/vnd.ms-excel"]]) {
    const api = app();
    const response = await api.analyzeInvoice(upload(workbook([["__proto__", "constructor", "prototype"], ["Leche", 2, "1,50"]], kind), `factura.${kind}`, mime));
    assert.equal(response.status, 200);
    const text = api.effects.paid[0].input[0].content[1].text;
    assert.match(text, /\["Leche",2,"1,50"\]/);
    assert.match(text, /__proto__/);
    assert.equal({}.polluted, undefined);
    assert.equal(api.effects.writes.length, 0);
  }
});

test("supplier is never requested or autofilled for images or spreadsheets", async () => {
  const api = app();
  const response = await api.analyzeInvoice(upload(Buffer.from([255, 216, 255]), "foto.jpg", "image/jpeg"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).draft.supplier, null);
  const format = api.effects.paid[0].text.format.schema;
  assert.equal(Object.hasOwn(format.properties, "supplier"), false);
  assert.equal(Object.hasOwn(format.properties, "date"), false);
  assert.match(api.effects.paid[0].input[0].content[0].text, /No extraigas.*proveedor.*fecha/);
});

test("current provider schema accepts output without supplier/date", async () => {
  const api = app({ providerDraft: { invoiceNumber: modelDraft.invoiceNumber, lines: modelDraft.lines, warnings: [] } });
  const response = await api.analyzeInvoice(upload(Buffer.from("Producto,Cantidad\nLeche,2"), "factura.csv"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).draft.supplier, null);
  assert.equal(api.effects.writes.length, 0);
});

test("format mismatch, invalid UTF8/CSV, empty and arbitrary binaries reject before provider", async () => {
  const cases = [
    [Buffer.from("hola"), "factura.csv", "text/csv", messages.malformed],
    [Buffer.from([0xff, 0xfe, 0, 1]), "factura.csv", "text/csv", messages.malformed],
    [Buffer.from('a,b\n"unterminated,2'), "factura.csv", "", messages.malformed],
    [Buffer.from("a,b\n1,2,3"), "factura.csv", "", messages.malformed],
    [Buffer.from("a\0,b\n1,2"), "factura.csv", "", messages.malformed],
    [Buffer.from("\n\n"), "factura.csv", "", messages.malformed],
    [Buffer.from("a,b\n1,2"), "factura.csv", "image/jpeg", messages.file],
    [Buffer.from("a,b\n1,2"), "factura.exe", "text/csv", messages.file],
    [workbook(), "factura.csv", "text/csv", messages.malformed],
    [workbook(), "factura.xls", "application/vnd.ms-excel", messages.malformed],
    [Buffer.from("PK\x03\x04arbitrary zip"), "factura.xlsx", "", messages.archive],
    [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), "factura.xls", "", messages.malformed],
    [workbook([]), "factura.xlsx", "", messages.malformed],
  ];
  for (const [bytes, name, mime, message] of cases) await reject(app(), upload(bytes, name, mime), 400, message);
});

test("spreadsheet dimensions, sparse ranges, sheets, cells and text are rejected rather than truncated", async () => {
  const cases = [
    workbook(Array.from({ length: 1001 }, () => ["Leche", 1])),
    workbook([Array(31).fill("Leche")]),
    workbook([["Leche", 1]], "xlsx", (book) => { book.Sheets.Factura["!ref"] = "A1:A1001"; }),
    workbook([["Leche", 1]], "xlsx", (book) => { for (let i = 0; i < 5; i++) XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Leche", 1]]), `Hoja${i}`); }),
    workbook(Array.from({ length: 500 }, () => Array(21).fill(1))),
    workbook(Array.from({ length: 10 }, () => ["x".repeat(12000), 1])),
  ];
  for (const bytes of cases) await reject(app(), upload(bytes, "factura.xlsx"), 400, messages.limits);
});

test("XLSX zip expansion/count and disguised ZIP are rejected before xlsx.read", async () => {
  const bomb = workbook([["Leche", 1]]);
  // Central directory uncompressed-size declaration, even if local metadata disagrees.
  const central = bomb.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  bomb.writeUInt32LE(9 * 1024 * 1024, central + 24);
  const tooMany = workbook();
  const end = tooMany.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  tooMany.writeUInt16LE(129, end + 8); tooMany.writeUInt16LE(129, end + 10);
  const disguised = Buffer.from(workbook());
  // Keep a valid ZIP but remove its workbook content-type identity.
  const marker = Buffer.from("xl/workbook.xml");
  for (let offset = disguised.indexOf(marker); offset !== -1; offset = disguised.indexOf(marker, offset + marker.length)) disguised.write("xx/notebook.xml", offset);
  const expandedBomb = workbook(Array.from({ length: 300 }, () => ["x".repeat(30000), 1]));
  const localBomb = Buffer.from(workbook());
  const localCentral = localBomb.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  localBomb.writeUInt16LE(8, localCentral + 8); localBomb.writeUInt16LE(8, 6);
  localBomb.writeUInt32LE(0x7fffffff, 22);
  const commented = Buffer.concat([workbook(), Buffer.from("PK\x05\x06")]);
  commented.writeUInt16LE(4, commented.length - 6);
  for (const bytes of [bomb, tooMany, disguised, expandedBomb, localBomb, commented]) {
    let parses = 0;
    const api = app({ spreadsheetParser: { ...XLSX, read: () => { parses++; throw Error("should not parse"); } } });
    await reject(api, upload(bytes, "factura.xlsx"), 400, messages.archive);
    assert.equal(parses, 0);
  }
});

test("formulas and external links reject without evaluation; CSV formula-like strings remain inert", async () => {
  for (const kind of ["xlsx", "xls"]) {
    const bytes = workbook([["Producto", "Cantidad"], ["Leche", 2]], kind, (book) => { // BIFF writer requires binary formula tokens (f alone is written as a cached value).
      book.Sheets.Factura.B2 = { t: "n", v: 2, f: "1+1", bf: [7, 0, 0x1e, 1, 0, 0x1e, 1, 0, 3] }; });
    await reject(app(), upload(bytes, `factura.${kind}`), 400, messages.formula);
  }
  const linked = workbook([["Producto", "Cantidad"], ["Leche", 2]], "xlsx", (book) => { book.Sheets.Factura.A2.l = { Target: "https://invalid.example/no-fetch" }; });
  await reject(app(), upload(linked, "factura.xlsx"), 400, messages.formula);
  const api = app();
  assert.equal((await api.analyzeInvoice(upload(Buffer.from("Producto,Cantidad\n=1+1,2"), "factura.csv"))).status, 200);
  assert.match(api.effects.paid[0].input[0].content[1].text, /=1\+1/);
});

test("case-insensitive ZIP paths cannot bypass worksheet bounds", async () => {
  const bytes = Buffer.from(workbook(Array.from({ length: 1001 }, () => ["Leche", 1])));
  const name = Buffer.from("xl/worksheets/sheet1.xml");
  for (let offset = bytes.indexOf(name); offset !== -1; offset = bytes.indexOf(name, offset + name.length)) {
    bytes.write("XL/WORKSHEETS/SHEET1.XML", offset);
  }
  let parses = 0;
  const api = app({ spreadsheetParser: { ...XLSX, read: () => { parses++; throw Error(); } } });
  await reject(api, upload(bytes, "factura.xlsx"), 400, messages.limits);
  assert.equal(parses, 0);
});

test("CSV limits and exact row/column/cell boundaries are checked without truncation", async () => {
  for (const text of [
    Array.from({ length: 1001 }, () => "Leche,1").join("\n"),
    Array(31).fill("Leche").join(","),
    Array.from({ length: 500 }, () => Array(21).fill("1").join(",")).join("\n"),
    `Producto,Cantidad\n${"x".repeat(100001)},1`,
  ]) await reject(app(), upload(Buffer.from(text), "factura.csv"), 400, messages.limits);
  for (const [rows, columns] of [[1000, 10], [1, 30]]) {
    const api = app();
    const csv = Array.from({ length: rows }, () => Array(columns).fill("1").join(",")).join("\n");
    assert.equal((await api.analyzeInvoice(upload(Buffer.from(csv), "factura.csv"))).status, 200);
    const text = api.effects.paid[0].input[0].content[1].text;
    const structured = JSON.parse(text.slice(text.indexOf("{\"sheets\"")));
    assert.equal(structured.sheets[0].rows.length, rows);
    assert.equal(structured.sheets[0].rows[0].length, columns);
    assert.equal(api.effects.writes.length, 0);
  }
});

test("malformed CFB allocation cycles reject before legacy parser", async () => {
  const bytes = Buffer.from(workbook(undefined, "xls"));
  const sectorSize = 1 << bytes.readUInt16LE(30);
  const fatId = bytes.readInt32LE(76);
  const directoryId = bytes.readInt32LE(48);
  bytes.writeInt32LE(directoryId, (fatId + 1) * sectorSize + directoryId * 4);
  let parses = 0;
  const api = app({ spreadsheetParser: { ...XLSX, CFB: { ...XLSX.CFB, read: () => { parses++; throw Error(); } } } });
  await reject(api, upload(bytes, "factura.xls"), 400, messages.malformed);
  assert.equal(parses, 0);
});

test("XLS rejects excessive ranges and sheets without provider calls", async () => {
  for (const bytes of [
    workbook(Array.from({ length: 1001 }, () => ["Leche", 1]), "xls"),
    workbook([Array(31).fill("Leche")], "xls"),
    workbook([["Leche", 1]], "xls", (book) => { for (let i = 0; i < 5; i++) XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Leche", 1]]), `Hoja${i}`); }),
  ]) await reject(app(), upload(bytes, "factura.xls"), 400, messages.limits);
});

test("authorization happens before spreadsheet parse or provider", async () => {
  let parses = 0;
  const api = app({ denied: true, spreadsheetParser: { ...XLSX, read: () => { parses++; throw Error(); } } });
  await reject(api, upload(workbook(), "factura.xlsx"), 403, "No tenés permiso para operar el inventario.");
  assert.equal(parses, 0); assert.equal(api.effects.catalog, 0);
});

test("manual supplier and exact Gregorian date are mandatory before transactions", async () => {
  for (const supplier of [null, undefined, "", "   ", "x".repeat(201), 7]) await reject(app(), confirmRequest({ ...batch, supplier }), 400, messages.manual, true);
  for (const date of [null, undefined, "", "2023-02-29", "1900-02-29", "2024-04-31", "2024-13-01", "2024-00-01", "2024-01-00", "2024-2-09", "2024-02-29T00:00:00Z", "0000-01-01", " 2024-02-29", 20240229]) await reject(app(), confirmRequest({ ...batch, date }), 400, messages.manual, true);
});

test("manual confirmation commits UTC-noon event date, trims supplier and never calls provider", async () => {
  for (const date of ["2024-02-29", "2000-02-29", "2025-01-31", "0099-01-01"]) {
    const api = app();
    const response = await api.confirmInvoice(confirmRequest({ ...batch, date }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, message: "Ingreso de stock registrado." });
    assert.equal(api.effects.transactions, 1);
    assert.equal(api.rows().length, 1);
    assert.equal(api.rows()[0].occurredAt.toISOString(), `${date}T12:00:00.000Z`);
    assert.equal(Object.hasOwn(api.rows()[0], "createdAt"), false);
    assert.match(api.rows()[0].reason, /· Proveedor ·/);
    assert.equal(api.effects.paid.length, 0);
    assert.deepEqual(api.effects.auth, ["inventory.operate"]);
  }
});

test("normalized retries succeed; same batch with changed date/supplier rejects atomically", async () => {
  const api = app();
  assert.equal((await api.confirmInvoice(confirmRequest(batch))).status, 200);
  assert.equal((await api.confirmInvoice(confirmRequest({ ...batch, supplier: "Proveedor" }))).status, 200);
  assert.equal(api.rows().length, 1);
  for (const change of [{ date: "2024-03-01" }, { supplier: "Otro proveedor" }]) await reject(api, confirmRequest({ ...batch, ...change }), 409, "Este lote ya fue confirmado con otros datos.", true);
});
