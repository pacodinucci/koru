import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { posix } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { inflateRawSync } from "node:zlib";
import ts from "typescript";

// Execute real public handlers, repositories, parsers and signature checks.
// Only authentication, database, and remote storage boundaries are doubled.
function load(path, mocks, cache = new Map()) {
  if (cache.has(path)) return cache.get(path);
  const loadedModule = { exports: {} };
  cache.set(path, loadedModule.exports);
  const source = readFileSync(new URL(`../../src/${path}.ts`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(output, {
    module: loadedModule, exports: loadedModule.exports, Buffer, File, Request, Response, Date,
    fetch: mocks.fetch,
    console: { error() {} },
    require: (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id === "server-only") return {};
      if (id === "node:zlib") return { inflateRawSync };
      if (id === "node:crypto") return { randomUUID: () => "upload" };
      if (id.startsWith("@/")) return load(id.slice(2), mocks, cache);
      if (id.startsWith(".")) {
        return load(posix.normalize(posix.join(posix.dirname(path), id)), mocks, cache);
      }
      throw Error(`Unexpected dependency ${id}`);
    },
  });
  return loadedModule.exports;
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const denied = "No autorizado.";
const missing = "Acuerdo no disponible.";
const conflict = "El acuerdo cambió. Volvé a intentarlo.";
const saveFailure = "No pudimos guardar el acuerdo. Intentá nuevamente.";
const fileError = "Adjuntá un PDF, DOC, DOCX, JPG, PNG o WEBP válido de hasta 10 MB.";
const docMime = "application/msword";
const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function app() {
  let user = { id: "admin", role: "SUPERADMIN", permissionKeys: [] };
  let rows = [], sequence = 0, teacherExists = true, fail = null;
  let onUpload = () => {}, onWrite = () => {};
  const effects = { reads: 0, writes: 0, uploads: 0, destroys: [], fetches: 0 };
  const matches = (row, where) => Object.entries(where).every(([key, value]) => {
    if (key === "teacher") return value.userId === "recipient" && row.teacherId === "teacher1";
    return row[key] === value;
  });
  const select = (row, fields) => row && Object.fromEntries(Object.keys(fields).map((key) => {
    if (key === "author") return [key, { name: row.authorId === "admin" ? "Superadmin" : "Spoof" }];
    if (key === "acceptedBy") {
      return [key, row.acceptedById ? { name: row.acceptedById === "recipient" ? "Docente" : "Spoof" } : null];
    }
    return [key, row[key]];
  }));
  const prisma = {
    teacherProfile: {
      findUnique: async ({ where }) => {
        effects.reads++;
        if (fail === "read") throw Error("DB");
        return teacherExists && where.id === "teacher1" ? { id: "teacher1" } : null;
      },
    },
    teacherFollowUpAgreement: {
      findFirst: async ({ where, select: fields }) => {
        effects.reads++;
        if (fail === "read") throw Error("DB");
        const row = rows.find((row) => matches(row, where));
        return fields ? select(row, fields) ?? null : row ? { ...row } : null;
      },
      findMany: async ({ where, select: fields }) => {
        effects.reads++;
        return rows.filter((row) => matches(row, where)).map((row) => select(row, fields));
      },
      create: async ({ data }) => {
        if (fail === "create" || fail === "create-cleanup" || !teacherExists) throw Error("DB");
        effects.writes++;
        const row = {
          id: `agreement${++sequence}`, status: "DRAFT", revision: 0,
          attachmentPublicId: null, attachmentFileName: null, attachmentMimeType: null,
          createdAt: new Date("2026-10-23T12:00:00Z"),
          publishedAt: null, acceptedAt: null, acceptedById: null,
          ...data,
        };
        rows.push(row);
        return { ...row };
      },
      updateMany: async ({ where, data }) => {
        onWrite();
        if (fail === "update") throw Error("DB");
        const row = rows.find((row) => matches(row, where));
        if (!row) return { count: 0 };
        effects.writes++;
        for (const [key, value] of Object.entries(data)) {
          row[key] = value?.increment ? row[key] + value.increment : value;
        }
        return { count: 1 };
      },
      deleteMany: async ({ where }) => {
        onWrite();
        if (fail === "delete") throw Error("DB");
        const count = rows.filter((row) => matches(row, where)).length;
        effects.writes += count;
        rows = rows.filter((row) => !matches(row, where));
        return { count };
      },
    },
  };
  const mocks = {
    "@/lib/prisma": { prisma },
    "@/lib/env": { env: {
      CLOUDINARY_CLOUD_NAME: "test", CLOUDINARY_API_KEY: "test", CLOUDINARY_API_SECRET: "test",
    } },
    "@/modules/auth/server/auth-guards": {
      getActualAuthenticatedUser: async () => user,
      // This deliberately disagrees with the actual actor, like development preview.
      getAuthenticatedUser: async () => ({
        id: "preview", role: "SUPERADMIN", permissionKeys: ["teachers.manage"],
      }),
    },
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    cloudinary: { v2: {
      config() {},
      uploader: {
        upload_stream: (options, callback) => ({ end() {
          assert.equal(options.type, "authenticated");
          assert.equal(options.resource_type, "raw");
          if (fail === "upload") return callback(Error("storage"));
          const public_id = `private/${++effects.uploads}.pdf`;
          onUpload();
          callback(null, { public_id });
        } }),
        destroy: async (id, options) => {
          assert.equal(options.type, "authenticated");
          effects.destroys.push(id);
          if (fail === "cleanup" || fail === "create-cleanup") throw Error("storage");
        },
      },
      utils: { private_download_url: () => "https://private.invalid/signed" },
    } },
    fetch: async (url, options) => {
      effects.fetches++;
      assert.equal(url, "https://private.invalid/signed");
      assert.equal(options.cache, "no-store");
      if (fail === "fetch") return new Response("error", { status: 500 });
      return new Response("%PDF-private bytes");
    },
  };
  const cache = new Map();
  const route = (suffix) => load(`app/api/teacher-follow-up-agreements${suffix}/route`, mocks, cache);
  const invoke = (suffix, method, body, id = "agreement1", headers) => route(suffix)[method](
    new Request("http://local/api", { method, body, headers }),
    { params: Promise.resolve({ id }) },
  );
  const repo = () => load("modules/follow-up-agreements/server/teacher-follow-up-agreements.repository", mocks, cache);
  return {
    effects,
    snapshot: () => JSON.stringify(rows),
    role: (role, id = "recipient") => {
      user = role ? { id, role, permissionKeys: ["teachers.manage", "students.view"] } : null;
    },
    fail: (value) => { fail = value; },
    teacher: (value) => { teacherExists = value; },
    onUpload: (fn) => { onUpload = fn; },
    onWrite: (fn) => { onWrite = fn; },
    race: (data) => { Object.assign(rows[0], data); },
    post: (data = form()) => invoke("", "POST", data),
    patch: (data = form(), id) => invoke("/[id]", "PATCH", data, id),
    publish: (id) => invoke("/[id]/publish", "POST", undefined, id),
    consent: (id) => invoke("/[id]/consent", "POST", JSON.stringify({
      acceptedById: "spoof", acceptedAt: "1900-01-01", teacherId: "other",
    }), id),
    delete: (id) => invoke("/[id]", "DELETE", undefined, id),
    attachment: (id) => invoke("/[id]/attachment", "GET", undefined, id),
    malformed: (patch = false) => invoke(patch ? "/[id]" : "", patch ? "PATCH" : "POST", "broken", undefined, {
      "Content-Type": "multipart/form-data; boundary=missing",
    }),
    list: (id = "teacher1") => repo().listTeacherFollowUpAgreements(id),
    own: () => repo().listOwnTeacherFollowUpAgreements(),
  };
}

function form({
  title = "Acuerdo docente", body = "Seguimiento", teacherId = "teacher1",
  bytes, name = "acuerdo.pdf", type = "application/pdf",
} = {}) {
  const data = new FormData();
  data.set("teacherId", teacherId);
  data.set("title", title);
  data.set("body", body);
  if (bytes !== undefined) data.set("file", new File([bytes], name, { type }));
  return data;
}

async function response(result, status, body) {
  assert.equal(result.status, status);
  assert.deepEqual(await result.json(), body);
  assert.equal(result.headers.get("Cache-Control"), "private, no-store");
}

async function rejected(ctx, action, status, error) {
  const before = ctx.snapshot(), effects = plain(ctx.effects);
  await response(await action(), status, { error });
  assert.equal(ctx.snapshot(), before, "rejection leaves stored data unchanged");
  for (const key of ["writes", "uploads", "destroys", "fetches"]) {
    assert.deepEqual(ctx.effects[key], effects[key], `${key} unchanged`);
  }
}

test("S3 admin operations reject other actual roles before reads, irrespective of permissions or preview", async () => {
  const ctx = app();
  await ctx.post(form({ bytes: "%PDF-1.7" }));
  for (const role of [null, "TEACHER", "ADMIN_TEACHER", "PARENT", "ADMIN", "ADMIN_OPERATOR", "CUSTOM"]) {
    ctx.role(role);
    const reads = ctx.effects.reads;
    for (const action of [() => ctx.post(), () => ctx.patch(), () => ctx.publish(), () => ctx.delete()]) {
      await rejected(ctx, action, role ? 403 : 401, denied);
    }
    await assert.rejects(ctx.list(), { message: denied });
    assert.equal(ctx.effects.reads, reads);
  }
});

test("S1-S3 exact private read model, server-derived author, draft editing, publication freeze and deletion", async () => {
  const ctx = app(), data = form({ title: "  Acuerdo docente  ", body: " Seguimiento " });
  data.set("authorId", "spoof");
  data.set("status", "PUBLISHED");
  data.set("acceptedById", "spoof");
  await response(await ctx.post(data), 201, { ok: true });
  assert.deepEqual(plain(await ctx.list()), [{
    id: "agreement1", teacherId: "teacher1", title: "Acuerdo docente", body: "Seguimiento",
    status: "DRAFT", createdAt: "2026-10-23T12:00:00.000Z", publishedAt: null,
    acceptedAt: null, acceptedByName: null, authorName: "Superadmin",
    attachmentName: null, hasAttachment: false,
  }]);
  await response(await ctx.patch(form({ title: "Editado", teacherId: "cannot-reassign" })), 200, { ok: true });
  assert.equal((await ctx.list())[0].title, "Editado");
  assert.equal((await ctx.list())[0].teacherId, "teacher1");
  await response(await ctx.publish(), 200, { ok: true });
  assert.equal((await ctx.list())[0].status, "PUBLISHED");
  assert.ok((await ctx.list())[0].publishedAt);
  for (const action of [() => ctx.patch(), () => ctx.publish()]) {
    await rejected(ctx, action, 409, conflict);
  }
  await response(await ctx.delete(), 200, { ok: true });
  assert.deepEqual(plain(await ctx.list()), []);
});

test("S3 recipients cannot probe foreign/draft records; published consent is first-actor idempotent, not spoofable", async () => {
  const ctx = app();
  await ctx.post(form({ bytes: "%PDF-1.7" }));
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    ctx.role(role);
    assert.deepEqual(plain(await ctx.own()), []);
    for (const action of [() => ctx.consent(), () => ctx.attachment(), () => ctx.consent("unknown")]) {
      await rejected(ctx, action, 404, missing);
    }
  }
  ctx.role("SUPERADMIN", "admin");
  await ctx.publish();
  await rejected(ctx, () => ctx.consent(), 403, denied);
  await assert.rejects(ctx.own(), { message: denied });
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    ctx.role(role, "other");
    assert.deepEqual(plain(await ctx.own()), []);
    for (const action of [() => ctx.consent(), () => ctx.attachment()]) {
      await rejected(ctx, action, 404, missing);
    }
    ctx.role(role);
    await response(await ctx.consent(), 200, { ok: true });
    const [first] = plain(await ctx.own()), writes = ctx.effects.writes;
    await response(await ctx.consent(), 200, { ok: true });
    assert.deepEqual(plain(await ctx.own()), [first]);
    assert.equal(ctx.effects.writes, writes);
    assert.equal(first.acceptedByName, "Docente");
    assert.ok(first.acceptedAt.startsWith("20"));
    assert.equal(first.hasAttachment, true);
  }
  const adminTeacher = app();
  await adminTeacher.post();
  await adminTeacher.publish();
  adminTeacher.role("ADMIN_TEACHER");
  await response(await adminTeacher.consent(), 200, { ok: true });
  assert.equal((await adminTeacher.own())[0].acceptedByName, "Docente");
  for (const role of [null, "PARENT", "ADMIN", "ADMIN_OPERATOR", "CUSTOM"]) {
    ctx.role(role);
    await assert.rejects(ctx.own(), { message: denied });
    for (const action of [() => ctx.consent(), () => ctx.attachment()]) {
      await rejected(ctx, action, role ? 403 : 401, denied);
    }
  }
});

test("S1-S3 input boundaries, duplicates, malformed multipart, missing targets and IDs have no effects", async () => {
  const ctx = app();
  for (const title of ["", "a", "x".repeat(161)]) {
    await rejected(ctx, () => ctx.post(form({ title })), 400, "Ingresá un título de entre 2 y 160 caracteres.");
  }
  for (const body of ["", " ", "x".repeat(10001)]) {
    await rejected(ctx, () => ctx.post(form({ body })), 400, "Escribí el acuerdo (máximo 10.000 caracteres).");
  }
  for (const field of ["title", "body", "teacherId", "file"]) {
    const data = form();
    data.append(field, "duplicate");
    if (field === "file") data.append(field, "duplicate");
    await rejected(ctx, () => ctx.post(data), 400, "Revisá los datos del acuerdo.");
  }
  await rejected(ctx, () => ctx.malformed(), 400, "Revisá los datos del acuerdo.");
  ctx.teacher(false);
  await rejected(ctx, () => ctx.post(), 404, "Docente no disponible.");
  ctx.teacher(true);
  for (const id of ["", " x ", "../x", "x".repeat(129)]) {
    await rejected(ctx, () => ctx.post(form({ teacherId: id })), 400, "Identificador inválido.");
    for (const action of [() => ctx.patch(form(), id), () => ctx.publish(id), () => ctx.delete(id), () => ctx.attachment(id)]) {
      await rejected(ctx, action, 400, "Identificador inválido.");
    }
  }
  for (const action of [() => ctx.patch(), () => ctx.publish(), () => ctx.delete(), () => ctx.attachment()]) {
    await rejected(ctx, action, 404, missing);
  }
  await response(await ctx.post(form({ title: "ab", body: "x".repeat(10000) })), 201, { ok: true });
  await response(await ctx.patch(form({ title: "x".repeat(160) })), 200, { ok: true });
  await rejected(ctx, () => ctx.malformed(true), 400, "Revisá los datos del acuerdo.");
  await rejected(ctx, () => ctx.patch(form({ title: "a" })), 400, "Ingresá un título de entre 2 y 160 caracteres.");
  await rejected(ctx, () => ctx.patch(form({ body: "" })), 400, "Escribí el acuerdo (máximo 10.000 caracteres).");
  ctx.role("TEACHER");
  await rejected(ctx, () => ctx.consent("../x"), 400, "Identificador inválido.");
});

test("S2 private attachments validate types, signatures and size without widening student rules", async () => {
  const ctx = app();
  const invalid = [
    { bytes: "" },
    { bytes: Buffer.alloc(10 * 1024 * 1024 + 1) },
    { bytes: "fake" },
    { bytes: "%PDF-1.7", name: "x.exe" },
    { bytes: "%PDF-1.7", name: `${"x".repeat(256)}.pdf` },
    { bytes: "%PDF-1.7", type: "image/png" },
    { bytes: "bad", name: "x.doc", type: docMime },
    { bytes: "PK\u0003\u0004bad", name: "x.docx", type: docxMime },
    { bytes: "bad", name: "x.png", type: "image/png" },
  ];
  for (const value of invalid) await rejected(ctx, () => ctx.post(form(value)), 400, fileError);
  const pdf = Buffer.alloc(10 * 1024 * 1024);
  pdf.write("%PDF-1.7");
  const doc = Buffer.concat([
    Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
    Buffer.from("WordDocument", "utf16le"),
  ]);
  const valid = [
    { bytes: pdf, type: "application/octet-stream" },
    { bytes: doc, name: "x.doc", type: docMime },
    { bytes: validDocx(), name: "x.docx", type: docxMime },
    { bytes: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), name: "x.png", type: "image/png" },
    { bytes: Buffer.from([255, 216, 255]), name: "x.jpg", type: "image/jpeg" },
    { bytes: "RIFF0000WEBP", name: "x.webp", type: "image/webp" },
  ];
  for (const value of valid) await response(await ctx.post(form(value)), 201, { ok: true });
  assert.equal(ctx.effects.uploads, valid.length);
  const row = (await ctx.list())[0];
  assert.equal(JSON.stringify(row).includes("private/"), false);
  assert.equal(JSON.stringify(row).includes("PublicId"), false);
  await rejected(ctx, () => ctx.patch(form({ bytes: "invalid" })), 400, fileError);
});

test("S2 byte proxy allows admin drafts and own published recipients, safe headers and replacement preservation", async () => {
  const ctx = app();
  await ctx.post(form({ bytes: "%PDF-1.7", name: "C:\\docs\\Informe.PDF" }));
  const get = async () => {
    const result = await ctx.attachment();
    assert.equal(result.status, 200);
    assert.equal(await result.text(), "%PDF-private bytes");
    assert.equal(result.headers.get("Content-Type"), "application/pdf");
    assert.equal(result.headers.get("Content-Disposition"), "inline; filename*=UTF-8''Informe.PDF");
    assert.equal(result.headers.get("Cache-Control"), "private, no-store");
    assert.equal(result.headers.get("X-Content-Type-Options"), "nosniff");
    assert.equal(result.headers.has("Location"), false);
  };
  await get();
  await ctx.patch();
  assert.equal((await ctx.list())[0].attachmentName, "Informe.PDF");
  ctx.fail("update");
  const before = ctx.snapshot();
  await response(await ctx.patch(form({ bytes: "%PDF-new" })), 500, { error: saveFailure });
  assert.equal(ctx.snapshot(), before);
  assert.deepEqual(ctx.effects.destroys, ["private/2.pdf"]);
  ctx.fail(null);
  await ctx.patch(form({ bytes: "%PDF-next", name: "Informe.PDF" }));
  assert.deepEqual(ctx.effects.destroys, ["private/2.pdf", "private/1.pdf"]);
  await ctx.publish();
  for (const role of ["TEACHER", "ADMIN_TEACHER"]) {
    ctx.role(role);
    await get();
  }
  ctx.fail("fetch");
  await response(await ctx.attachment(), 503, { error: "No pudimos abrir el adjunto." });
  ctx.role("SUPERADMIN", "admin");
  ctx.fail("delete");
  await rejected(ctx, () => ctx.delete(), 500, "No pudimos eliminar el acuerdo. Intentá nuevamente.");
  ctx.fail(null);
  await ctx.delete();
  assert.equal(ctx.effects.destroys.at(-1), "private/3.pdf");
});

test("S2-S3 conditional writes defeat publication, replacement, delete and consent races; uploads are compensated", async () => {
  const ctx = app();
  await ctx.post(form({ bytes: "%PDF-old" }));
  ctx.onUpload(() => ctx.race({ status: "PUBLISHED", publishedAt: new Date(), revision: 1 }));
  await response(await ctx.patch(form({ bytes: "%PDF-new" })), 409, { error: conflict });
  assert.deepEqual(ctx.effects.destroys, ["private/2.pdf"]);
  assert.equal((await ctx.list())[0].attachmentName, "acuerdo.pdf");

  const other = app();
  await other.post(form({ bytes: "%PDF-old" }));
  let revision = 0;
  other.onWrite(() => other.race({ revision: ++revision }));
  await response(await other.patch(), 409, { error: conflict });
  await response(await other.delete(), 409, { error: conflict });
  assert.deepEqual(other.effects.destroys, []);

  const publish = app();
  await publish.post();
  publish.onWrite(() => publish.race({ status: "PUBLISHED", publishedAt: new Date() }));
  await response(await publish.publish(), 409, { error: conflict });

  const consent = app();
  await consent.post();
  await consent.publish();
  consent.role("TEACHER");
  const first = new Date("2026-10-23T13:00:00Z");
  consent.onWrite(() => consent.race({ acceptedAt: first, acceptedById: "recipient" }));
  await response(await consent.consent(), 200, { ok: true });
  assert.equal((await consent.own())[0].acceptedAt, first.toISOString());
});

test("S2 failures, cleanup outages and post-upload role/target changes never announce false success", async () => {
  const ctx = app();
  ctx.fail("read");
  await rejected(ctx, () => ctx.post(), 500, saveFailure);
  ctx.fail("upload");
  await rejected(ctx, () => ctx.post(form({ bytes: "%PDF-1.7" })), 500, saveFailure);
  ctx.fail("create");
  await response(await ctx.post(form({ bytes: "%PDF-1.7" })), 500, { error: saveFailure });
  assert.deepEqual(ctx.effects.destroys, ["private/1.pdf"]);
  assert.deepEqual(plain(await ctx.list()), []);
  ctx.fail(null);
  ctx.onUpload(() => ctx.role("TEACHER"));
  await response(await ctx.post(form({ bytes: "%PDF-1.7" })), 403, { error: denied });
  assert.equal(ctx.effects.writes, 0);
  assert.deepEqual(ctx.effects.destroys, ["private/1.pdf", "private/2.pdf"]);

  const removed = app();
  removed.onUpload(() => removed.teacher(false));
  await response(await removed.post(form({ bytes: "%PDF-1.7" })), 500, { error: saveFailure });
  assert.equal(removed.effects.writes, 0);
  assert.deepEqual(removed.effects.destroys, ["private/1.pdf"]);

  const cleanup = app();
  cleanup.fail("create-cleanup");
  await response(await cleanup.post(form({ bytes: "%PDF-1.7" })), 500, { error: saveFailure });
  assert.deepEqual(plain(await cleanup.list()), []);
  assert.deepEqual(cleanup.effects.destroys, ["private/1.pdf"]);
  cleanup.fail(null);
  await cleanup.post(form({ bytes: "%PDF-1.7" }));
  cleanup.fail("cleanup");
  await response(await cleanup.delete(), 200, { ok: true });
  assert.deepEqual(plain(await cleanup.list()), []);
});

test("S2 persistence failures on publication, consent and reads leave data and storage unchanged", async () => {
  const ctx = app();
  await ctx.post();
  await rejected(ctx, () => ctx.attachment(), 404, missing);
  ctx.fail("update");
  await rejected(ctx, () => ctx.publish(), 500, "No pudimos publicar el acuerdo. Intentá nuevamente.");
  ctx.fail(null);
  await ctx.publish();
  ctx.role("TEACHER");
  ctx.fail("update");
  await rejected(ctx, () => ctx.consent(), 500, "No pudimos registrar la conformidad. Intentá nuevamente.");
  ctx.fail("read");
  await rejected(ctx, () => ctx.attachment(), 500, "No pudimos abrir el adjunto.");
});

test("PRESERVE shared student participant validation and file-name rules keep their previous behavior", async () => {
  const validation = load("modules/follow-up-agreements/lib/agreement-validation", {});
  const data = form();
  data.set("studentIds", '["student1"]');
  assert.deepEqual(plain(validation.parseAgreementForm(data)), {
    title: "Acuerdo docente", body: "Seguimiento", studentIds: ["student1"], removeAttachment: false,
  });
  assert.deepEqual(plain(validation.validateAgreementParticipants([
    { id: "student1", familyId: "family1" },
  ], ["student1"])), ["family1"]);
  assert.throws(() => validation.validateAgreementParticipants([], ["student1"]), {
    message: "Sólo podés incluir alumnos con familia activa de tus grupos.", status: 403,
  });
  const ctx = app();
  await ctx.post(form({ bytes: "%PDF-1.7", name: "path/to/test.pdf" }));
  assert.equal((await ctx.list())[0].attachmentName, "test.pdf");
});

test("PRESERVE student repository still creates linked drafts, publishes only scoped students, then deletes", async () => {
  let row = null, assigned = true;
  const effects = { writes: 0 };
  const matches = (where) => row && Object.entries(where).every(([key, value]) => row[key] === value);
  const prisma = {
    teacherProfile: { findFirst: async () => ({ id: "student-author" }) },
    student: { findMany: async () => assigned ? [{
      id: "student1", firstName: "Alumna", lastName: "Uno", familyId: "family1", family: { status: "ACTIVE" },
    }] : [] },
    followUpAgreement: {
      create: async ({ data }) => {
        effects.writes++;
        row = {
          id: "student-agreement", status: "DRAFT", attachmentPublicId: null,
          teacherId: data.teacherId, title: data.title, body: data.body,
          families: data.families.create, students: data.students.create,
        };
        return { ...row };
      },
      findMany: async ({ where }) => matches(where) ? [{ ...row }] : [],
      findFirst: async ({ where }) => matches(where) ? { ...row } : null,
      updateMany: async ({ where, data }) => {
        if (!matches(where)) return { count: 0 };
        effects.writes++;
        Object.assign(row, data);
        return { count: 1 };
      },
      deleteMany: async ({ where }) => {
        if (!matches(where)) return { count: 0 };
        effects.writes++;
        row = null;
        return { count: 1 };
      },
    },
    $transaction: async (action) => action(prisma),
  };
  const repository = load("modules/follow-up-agreements/server/agreements.repository", {
    "@/lib/prisma": { prisma },
    "@/modules/follow-up-agreements/server/agreement-files": {
      readAgreementFile: async () => { throw Error("unexpected file"); },
      uploadAgreementFile: async () => { throw Error("unexpected upload"); },
      deleteAgreementFile: async () => { throw Error("unexpected delete"); },
    },
  });
  const data = form();
  data.set("studentIds", '["student1"]');
  await repository.saveAgreementDraft("student-teacher", data);
  const [draft] = await repository.listTeacherAgreements("student-author");
  assert.equal(draft.status, "DRAFT");
  assert.deepEqual(plain(draft.families), [{ familyId: "family1" }]);
  assert.deepEqual(plain(draft.students), [{ studentId: "student1" }]);
  assigned = false;
  const writes = effects.writes;
  await assert.rejects(repository.publishAgreement("student-teacher", draft.id), {
    message: "Sólo podés incluir alumnos con familia activa de tus grupos.", status: 403,
  });
  assert.equal(effects.writes, writes);
  assert.equal((await repository.listTeacherAgreements("student-author"))[0].status, "DRAFT");
  assigned = true;
  await repository.publishAgreement("student-teacher", draft.id);
  assert.equal((await repository.listTeacherAgreements("student-author"))[0].status, "PUBLISHED");
  await repository.deleteAgreement("student-teacher", draft.id);
  assert.deepEqual(plain(await repository.listTeacherAgreements("student-author")), []);
});

function validDocx() {
  const parts = [
    ["[Content_Types].xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"],
    ["word/document.xml", "http://schemas.openxmlformats.org/wordprocessingml/2006/main"],
  ];
  const locals = [], directories = [];
  let offset = 0;
  for (const [name, content] of parts) {
    const names = Buffer.from(name), bytes = Buffer.from(content);
    const local = Buffer.alloc(30), directory = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(names.length, 26);
    directory.writeUInt32LE(0x02014b50);
    directory.writeUInt32LE(bytes.length, 20);
    directory.writeUInt32LE(bytes.length, 24);
    directory.writeUInt16LE(names.length, 28);
    directory.writeUInt32LE(offset, 42);
    locals.push(local, names, bytes);
    directories.push(directory, names);
    offset += local.length + names.length + bytes.length;
  }
  const directory = Buffer.concat(directories), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(2, 8);
  end.writeUInt16LE(2, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}
