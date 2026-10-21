import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { inflateRawSync } from "node:zlib";
import ts from "typescript";

// Execute real public routes/repository and validation helpers, never auth, DB or Cloudinary.
function load(path, mocks, cache = new Map()) {
  if (cache.has(path)) return cache.get(path);
  const module = { exports: {} };
  cache.set(path, module.exports);
  const source = readFileSync(new URL(`../../src/${path}.ts`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports, Buffer, File, Request, Response, Date, console: { error() {} },
    fetch: mocks.fetch,
    require: (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === "server-only") return {};
      if (id === "node:zlib") return { inflateRawSync };
      if (id.startsWith("@/modules/teachers/")) return load(id.slice(2), mocks, cache);
      throw Error(`Unexpected dependency ${id}`);
    },
  });
  return module.exports;
}
const collection = "app/api/teachers/[teacherId]/reports/route";
const item = "app/api/teacher-reports/[id]/route";
const visibility = "app/api/teacher-reports/[id]/visibility/route";
const download = "app/api/teacher-reports/[id]/download/route";
const plain = (value) => JSON.parse(JSON.stringify(value));
const mime = { PDF: "application/pdf", DOC: "application/msword", DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

function app() {
  let role = "SUPERADMIN", teacherExists = true, fail = null, onUpload = () => {};
  let rows = [], sequence = 0;
  const effects = { reads: 0, writes: 0, uploads: 0, destroys: 0, downloads: 0, fetches: 0 };
  const project = (row, select) => row && Object.fromEntries(Object.entries(select).map(([key]) => [key, row[key]]));
  const prisma = {
    teacherProfile: { findUnique: async () => {
      effects.reads++;
      if (fail === "read") throw Error("db unavailable");
      return teacherExists ? { id: "teacher1" } : null;
    } },
    teacherReport: {
      findMany: async ({ where, select }) => { effects.reads++; return rows.filter((r) => r.teacherId === where.teacherId).reverse().map((r) => project(r, select)); },
      findUnique: async ({ where, select }) => { effects.reads++; if (fail === "read") throw Error("db unavailable"); return project(rows.find((r) => r.id === where.id), select) ?? null; },
      create: async ({ data }) => {
        if (fail === "create" || fail === "create-cleanup" || !teacherExists) throw Error("db unavailable");
        effects.writes++;
        const row = { id: `report${++sequence}`, createdAt: new Date("2026-10-22T12:00:00Z"), content: null, fileName: null, cloudinaryPublicId: null, author: { name: "Superadmin" }, ...data };
        rows.push(row); return { ...row };
      },
      updateMany: async ({ where, data }) => {
        if (fail === "update") throw Error("db unavailable");
        const row = rows.find((r) => r.id === where.id);
        if (!row) return { count: 0 };
        effects.writes++; Object.assign(row, data); return { count: 1 };
      },
      deleteMany: async ({ where }) => {
        if (fail === "delete") throw Error("db unavailable");
        const count = rows.filter((r) => r.id === where.id).length;
        effects.writes += count; rows = rows.filter((r) => r.id !== where.id); return { count };
      },
    },
  };
  const mocks = {
    "@/lib/prisma": { prisma },
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => role ? { id: "actor", role, permissionKeys: ["teachers.manage", "students.view"] } : null },
    "@/modules/teachers/server/student-report-cloudinary": {
      uploadStudentReportFile: async () => { if (fail === "upload") throw Error("storage unavailable"); effects.uploads++; onUpload(); return "private/report.pdf"; },
      deleteStudentReportFile: async (id) => { assert.equal(id, "private/report.pdf"); effects.destroys++; if (fail === "cleanup" || fail === "create-cleanup") throw Error("storage unavailable"); },
      getStudentReportDownloadUrl: () => { effects.downloads++; return "https://private-storage.invalid/signed"; },
    },
    fetch: async (url, options) => {
      effects.fetches++; assert.equal(url, "https://private-storage.invalid/signed"); assert.equal(options.cache, "no-store");
      if (fail === "fetch") return new Response("unavailable", { status: 500 });
      return new Response("%PDF-1.7 private bytes");
    },
  };
  const cache = new Map();
  const routes = Object.fromEntries([collection, item, visibility, download].map((p) => [p, load(p, mocks, cache)]));
  const repository = load("modules/teachers/server/teacher-reports.repository", mocks, cache);
  const request = (path, method, body, headers) => new Request(`http://localhost/${path}`, { method, body, headers });
  return {
    effects, role: (value) => { role = value; }, teacher: (value) => { teacherExists = value; }, fail: (value) => { fail = value; }, onUpload: (fn) => { onUpload = fn; },
    snapshot: () => JSON.stringify(rows), list: () => repository.listTeacherReports("teacher1"),
    post: (form, id = "teacher1") => routes[collection].POST(request("reports", "POST", form), { params: Promise.resolve({ teacherId: id }) }),
    patch: (payload, id = "report1") => routes[visibility].PATCH(request("visibility", "PATCH", JSON.stringify(payload), { "Content-Type": "application/json" }), { params: Promise.resolve({ id }) }),
    malformedPost: () => routes[collection].POST(request("reports", "POST", "broken multipart", { "Content-Type": "multipart/form-data; boundary=missing" }), { params: Promise.resolve({ teacherId: "teacher1" }) }),
    malformedPatch: () => routes[visibility].PATCH(request("visibility", "PATCH", "{broken", { "Content-Type": "application/json" }), { params: Promise.resolve({ id: "report1" }) }),
    delete: (id = "report1") => routes[item].DELETE(request("reports", "DELETE"), { params: Promise.resolve({ id }) }),
    download: (id = "report1") => routes[download].GET(request("download", "GET"), { params: Promise.resolve({ id }) }),
  };
}
function form({ title = "Informe docente", content = "Seguimiento", bytes, name = "reporte.pdf", type = "application/pdf" } = {}) {
  const data = new FormData(); data.set("title", title); data.set("content", content);
  if (bytes !== undefined) data.set("reportFile", new File([bytes], name, { type }));
  return data;
}
const fileForm = (changes = {}) => form({ content: "", bytes: "%PDF-1.7 report", ...changes });
async function response(result, status, body) {
  assert.equal(result.status, status);
  assert.deepEqual(await result.json(), body);
  assert.equal(result.headers.get("Cache-Control"), "private, no-store");
}
async function rejected(ctx, action, status, error) {
  const before = ctx.snapshot(), effects = { ...ctx.effects };
  await response(await action(), status, { error });
  assert.equal(ctx.snapshot(), before, "rejection leaves stored reports unchanged");
  for (const key of ["writes", "uploads", "destroys", "downloads", "fetches"]) assert.equal(ctx.effects[key], effects[key], `${key} unchanged`);
}

test("S1/S3 all public operations reject every non-SUPERADMIN before persistence/storage, even visible reports", async () => {
  const ctx = app(); await ctx.post(fileForm()); await ctx.patch({ visibleToTeacher: true });
  for (const role of [null, "PARENT", "TEACHER", "ADMIN_TEACHER", "ADMIN", "ADMIN_OPERATOR", "STAFF", "CUSTOM"]) {
    ctx.role(role);
    const reads = ctx.effects.reads;
    for (const call of [() => ctx.post(form()), () => ctx.patch({ visibleToTeacher: false }), () => ctx.delete(), () => ctx.download()]) {
      await rejected(ctx, call, role ? 403 : 401, "No autorizado.");
    }
    await assert.rejects(ctx.list(), { message: "No autorizado." });
    assert.equal(ctx.effects.reads, reads, "denial precedes all report/teacher reads");
  }
});

test("S1 text creation uses L4, remains hidden despite supplied flag, and returns only private list fields", async () => {
  const ctx = app(), data = form({ title: "  Informe docente  ", content: "  Seguimiento  " });
  data.set("visibleToTeacher", "true");
  await response(await ctx.post(data), 201, { ok: true });
  const reports = await ctx.list(); assert.equal(reports[0].createdAt instanceof Date, true);
  assert.deepEqual(plain(reports), [{ id: "report1", title: "Informe docente", content: "Seguimiento", fileName: null, fileMimeType: null, fileUrl: null, visibleToTeacher: false, createdAt: "2026-10-22T12:00:00.000Z", author: { name: "Superadmin" } }]);
  await response(await ctx.patch({ visibleToTeacher: true }), 200, { ok: true, visibleToTeacher: true });
  assert.equal((await ctx.list())[0].visibleToTeacher, true);
  await response(await ctx.patch({ visibleToTeacher: false }), 200, { ok: true, visibleToTeacher: false });
  await response(await ctx.delete(), 200, { ok: true }); assert.deepEqual(plain(await ctx.list()), []);
});

test("S1 rich text normalization matches student validation and preserves valid text boundaries", async () => {
  const ctx = app();
  const rich = 'koru-report-rich-v1:{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Informe","marks":[{"type":"bold"}]}]}]}';
  await response(await ctx.post(form({ title: "ab", content: rich })), 201, { ok: true });
  assert.equal((await ctx.list())[0].content, rich);
  await response(await ctx.post(form({ title: "x".repeat(160), content: "x".repeat(10000) })), 201, { ok: true });
  for (const content of ["", "  ", "x".repeat(10001), "koru-report-rich-v1:{}", 'koru-report-rich-v1:{"type":"doc","content":[{"type":"image"}]}']) {
    await rejected(ctx, () => ctx.post(form({ content })), 400, "Escribí el reporte (máximo 10.000 caracteres).");
  }
});

test("S1 invalid titles, duplicate fields, mixed content, missing teachers and invalid IDs have no effects", async () => {
  const ctx = app();
  for (const title of ["", "a", "x".repeat(161)]) await rejected(ctx, () => ctx.post(form({ title })), 400, "Ingresá un título válido (entre 2 y 160 caracteres).");
  const duplicate = form(); duplicate.append("title", "Otro");
  await rejected(ctx, () => ctx.post(duplicate), 400, "Revisá los datos del reporte.");
  await rejected(ctx, () => ctx.post(fileForm({ content: "Texto" })), 400, "Adjuntá un archivo o escribí el reporte, pero no ambos.");
  ctx.teacher(false); await rejected(ctx, () => ctx.post(form()), 404, "Docente no disponible."); ctx.teacher(true);
  for (const id of ["", " x ", "../x", "x".repeat(129)]) {
    for (const call of [() => ctx.post(form(), id), () => ctx.patch({ visibleToTeacher: true }, id), () => ctx.delete(id), () => ctx.download(id)]) await rejected(ctx, call, 400, "Identificador inválido.");
  }
  for (const call of [() => ctx.patch({ visibleToTeacher: true }), () => ctx.delete(), () => ctx.download()]) await rejected(ctx, call, 404, "Reporte no disponible.");
});

test("S1 visibility requires a boolean JSON payload, malformed values never change reports", async () => {
  const ctx = app(); await ctx.post(form());
  for (const payload of [null, [], {}, true, { visibleToTeacher: "true" }, { visibleToTeacher: 1 }, { visibleToTeacher: null }, { visibleToFamily: true }]) {
    await rejected(ctx, () => ctx.patch(payload), 400, "Indicá si el reporte será visible para el docente.");
  }
  await rejected(ctx, ctx.malformedPatch, 400, "Indicá si el reporte será visible para el docente.");
});

test("S1 file validation rejects extensions, signatures, MIME, empty and oversized attachments before uploading", async () => {
  const ctx = app();
  for (const changes of [{ bytes: "" }, { bytes: Buffer.alloc(10 * 1024 * 1024 + 1) }, { name: "report.exe" }, { name: "x".repeat(256) + ".pdf" }, { type: "image/png" }]) {
    await rejected(ctx, () => ctx.post(fileForm(changes)), 400, "Adjuntá un PDF, DOC o DOCX de hasta 10 MB.");
  }
  for (const [name, type, bytes, format] of [["report.pdf", mime.PDF, "invalid", "PDF"], ["report.doc", mime.DOC, "invalid", "DOC"], ["report.docx", mime.DOCX, "PK\u0003\u0004not word", "DOCX"]]) {
    await rejected(ctx, () => ctx.post(fileForm({ name, type, bytes })), 400, `El archivo no es un ${format} válido.`);
  }
});

function validDocx() {
  const parts = [
    ["[Content_Types].xml", 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'],
    ["word/document.xml", 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'],
  ];
  const localParts = [], directoryParts = [];
  let offset = 0;
  for (const [name, content] of parts) {
    const nameBytes = Buffer.from(name), bytes = Buffer.from(content), local = Buffer.alloc(30), directory = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt32LE(bytes.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(nameBytes.length, 26);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt32LE(bytes.length, 20); directory.writeUInt32LE(bytes.length, 24); directory.writeUInt16LE(nameBytes.length, 28); directory.writeUInt32LE(offset, 42);
    localParts.push(local, nameBytes, bytes); directoryParts.push(directory, nameBytes); offset += local.length + nameBytes.length + bytes.length;
  }
  const directory = Buffer.concat(directoryParts), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(2, 8); end.writeUInt16LE(2, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, directory, end]);
}

test("S1 accepts valid Word files and exact 10 MB PDF boundary with private downloads", async () => {
  const doc = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.from("WordDocument", "utf16le")]);
  const pdf = Buffer.alloc(10 * 1024 * 1024); pdf.write("%PDF-1.7");
  for (const [format, bytes, contentType] of [["DOC", doc, mime.DOC], ["DOCX", validDocx(), mime.DOCX], ["PDF", pdf, "application/octet-stream"]]) {
    const ctx = app(); await response(await ctx.post(fileForm({ name: `reporte.${format.toLowerCase()}`, type: contentType, bytes })), 201, { ok: true });
    const [report] = await ctx.list(); assert.equal(report.fileMimeType, mime[format]); assert.equal(report.content, null); assert.equal(report.visibleToTeacher, false);
    assert.equal(ctx.effects.writes, 1); assert.equal(ctx.effects.uploads, 1);
    const result = await ctx.download(); assert.equal(result.status, 200); assert.equal(result.headers.get("Content-Type"), mime[format]);
    assert.equal(result.headers.get("Content-Disposition"), `${format === "PDF" ? "inline" : "attachment"}; filename*=UTF-8''reporte.${format.toLowerCase()}`);
    assert.equal(await result.text(), "%PDF-1.7 private bytes");
  }
});

test("S1 file lifecycle sanitizes filenames, hides storage IDs/URLs, proxies private bytes and removes storage", async () => {
  const ctx = app();
  await response(await ctx.post(fileForm({ name: "C:\\reports\\Informe.PDF" })), 201, { ok: true });
  const reports = await ctx.list(); assert.equal(reports[0].fileName, "Informe.PDF"); assert.equal(reports[0].fileMimeType, mime.PDF);
  assert.equal(reports[0].fileUrl, "/api/teacher-reports/report1/download");
  assert.equal(reports[0].visibleToTeacher, false);
  assert.equal(JSON.stringify(reports).includes("cloudinary"), false); assert.equal(JSON.stringify(reports).includes("private/report"), false);
  const result = await ctx.download(); assert.equal(result.status, 200); assert.equal(await result.text(), "%PDF-1.7 private bytes");
  assert.equal(result.headers.get("Content-Type"), mime.PDF); assert.equal(result.headers.get("Cache-Control"), "private, no-store");
  assert.equal(result.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(result.headers.get("Content-Disposition"), "inline; filename*=UTF-8''Informe.PDF"); assert.equal(result.headers.has("Location"), false);
  await response(await ctx.delete(), 200, { ok: true }); assert.equal(ctx.effects.destroys, 1); assert.deepEqual(plain(await ctx.list()), []);
});

test("S1 storage/DB failures do not announce success, uploads are compensated, failed deletion retains files", async () => {
  const ctx = app();
  ctx.fail("read"); await rejected(ctx, () => ctx.post(form()), 500, "No pudimos guardar el reporte. Intentá nuevamente.");
  ctx.fail("upload"); await rejected(ctx, () => ctx.post(fileForm()), 500, "No pudimos guardar el reporte. Intentá nuevamente.");
  ctx.fail("create"); await rejected(ctx, () => ctx.post(form()), 500, "No pudimos guardar el reporte. Intentá nuevamente.");
  const before = ctx.snapshot();
  await response(await ctx.post(fileForm()), 500, { error: "No pudimos guardar el reporte. Intentá nuevamente." });
  assert.equal(ctx.snapshot(), before); assert.equal(ctx.effects.writes, 0); assert.equal(ctx.effects.uploads, 1); assert.equal(ctx.effects.destroys, 1);
  ctx.fail(null); await ctx.post(fileForm());
  ctx.fail("update"); await rejected(ctx, () => ctx.patch({ visibleToTeacher: true }), 500, "No pudimos cambiar la visibilidad. Intentá nuevamente.");
  ctx.fail("delete"); await rejected(ctx, () => ctx.delete(), 500, "No pudimos eliminar el reporte. Intentá nuevamente.");
  ctx.fail("fetch"); const snapshot = ctx.snapshot();
  await response(await ctx.download(), 503, { error: "No pudimos abrir el documento." }); assert.equal(ctx.snapshot(), snapshot);
});

test("S1 malformed multipart, text downloads and cleanup outages fail safely without leaking internals", async () => {
  const ctx = app();
  await rejected(ctx, ctx.malformedPost, 400, "Revisá los datos del reporte.");
  await ctx.post(form()); await rejected(ctx, ctx.download, 404, "Reporte no disponible.");
  ctx.fail("read");
  await rejected(ctx, ctx.download, 500, "No pudimos abrir el documento.");
  await rejected(ctx, ctx.delete, 500, "No pudimos eliminar el reporte. Intentá nuevamente.");
  ctx.fail("create-cleanup"); const before = ctx.snapshot(), writes = ctx.effects.writes;
  await response(await ctx.post(fileForm()), 500, { error: "No pudimos guardar el reporte. Intentá nuevamente." });
  assert.equal(ctx.snapshot(), before); assert.equal(ctx.effects.writes, writes); assert.equal(ctx.effects.uploads, 1); assert.equal(ctx.effects.destroys, 1);
  ctx.fail(null); await ctx.post(fileForm()); ctx.fail("cleanup");
  await response(await ctx.delete("report2"), 200, { ok: true });
  ctx.fail(null); assert.equal((await ctx.list()).length, 1); assert.equal(ctx.effects.destroys, 2);
});

test("S1 upload rechecks authorization and teacher existence, cleaning files if either changes", async () => {
  for (const change of ["role", "teacher"]) {
    const ctx = app(); ctx.onUpload(() => change === "role" ? ctx.role("TEACHER") : ctx.teacher(false));
    await response(await ctx.post(fileForm()), change === "role" ? 403 : 404, { error: change === "role" ? "No autorizado." : "Docente no disponible." });
    assert.equal(ctx.snapshot(), "[]"); assert.equal(ctx.effects.writes, 0); assert.equal(ctx.effects.uploads, 1); assert.equal(ctx.effects.destroys, 1);
  }
});

test("PRESERVE existing student POST validates TEXT/file exclusivity and keeps default family visibility", async () => {
  let writes = 0;
  const mocks = {
    "@prisma/client": { Prisma: { PrismaClientKnownRequestError: Error } },
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/prisma": { prisma: { studentReport: { create: async ({ data }) => { writes++; assert.equal(data.visibleToFamily, false); assert.equal(data.body, "Informe"); } } } },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => ({ id: "teacher" }) },
    "@/modules/teachers/server/student-reports.repository": { getAssignedTeacherStudent: async () => ({ teacherId: "teacher", studentId: "student" }) },
    "@/modules/teachers/server/student-report-cloudinary": {},
  };
  const route = load("app/api/teacher/students/[id]/reports/route", mocks);
  const call = (data) => route.POST(new Request("http://localhost/reports", { method: "POST", body: data }), { params: Promise.resolve({ id: "student" }) });
  const data = new FormData(); data.set("title", "Informe"); data.set("type", "TEXT"); data.set("body", "Informe");
  assert.equal((await call(data)).status, 201); assert.equal(writes, 1);
  data.set("file", new File(["%PDF-1.7"], "report.pdf"));
  const denied = await call(data); assert.equal(denied.status, 400); assert.deepEqual(await denied.json(), { error: "Adjuntá un archivo o escribí el reporte, pero no ambos." }); assert.equal(writes, 1);
});
