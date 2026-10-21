import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
const componentRoot = "modules/follow-up-agreements/components/";
const repository = "@/modules/follow-up-agreements/server/teacher-follow-up-agreements.repository";
const primitive = (name) => function MockPrimitive(props) {
  return React.createElement(name, props, props.children);
};
const primitives = new Proxy({}, { get: (_, name) => primitive(name) });
function load(path, overrides = {}, globals = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { ...globals, module: mod, exports: mod.exports, require: (id) => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (["react", "react/jsx-runtime"].includes(id)) return require(id);
    if (id === "next/link") return { __esModule: true, default: primitive("a") };
    return primitives;
  } });
  return mod.exports;
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  if (typeof tree.type === "function") return nodes(tree.type(tree.props));
  const rendered = React.isValidElement(tree.props.render)
    ? React.cloneElement(tree.props.render, {}, tree.props.children ?? tree.props.render.props.children) : null;
  return [tree, ...nodes(tree.props.children), ...nodes(rendered)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (!React.isValidElement(tree)) return typeof tree === "string" ? tree : "";
  return typeof tree.type === "function" ? text(tree.type(tree.props)) : text(tree.props.children);
}
class BrowserFormData extends FormData {
  constructor(form) { super(); if (form instanceof FormData) for (const [key, value] of form) this.append(key, value); }
}
function harness(path, exported, props, extra = {}) {
  const states = [], calls = [], resets = [], transitions = [];
  let cursor = 0, refreshes = 0, saved = 0;
  const hooks = { ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useMemo: (fn) => fn(), useTransition: () => [false, (fn) => { transitions.push(fn()); }],
  };
  const component = load(path, {
    react: hooks,
    "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) },
    "react-hook-form": { useForm: () => ({ reset: (value) => resets.push(value), handleSubmit: (fn) => fn, control: {} }) },
    "@hookform/resolvers/zod": { zodResolver: () => ({}) },
    ...extra.overrides,
  }, { File, FormData: BrowserFormData, fetch: async (url, init) => {
    calls.push({ url, ...init });
    return extra.fetch ? extra.fetch(url, init) : { ok: true, json: async () => ({ ok: true }) };
  } })[exported];
  let tree;
  const ui = {
    render() { cursor = 0; tree = component({ ...props, onSaved: () => saved++ }); return tree; },
    find: (predicate) => nodes(tree).find(predicate), all: () => nodes(tree),
    button: (label) => nodes(tree).find((node) => node.props.onClick && text(node) === label),
    text: () => text(tree), calls, resets, settle: () => Promise.all(transitions),
    get refreshes() { return refreshes; }, get saved() { return saved; },
  };
  ui.render();
  return ui;
}
const teacher = { id: "teacher/1", displayName: "Ana Pérez", email: "ana@example.test", phone: "123", bio: "Notas", position: "Docente", organizationGroup: "Inicial", isActive: true, user: null, groups: [{ id: "g1", name: "Sala A" }], studentsCount: 2 };
const draft = { id: "agreement/1", teacherId: teacher.id, title: "Plan docente", body: "Texto acordado", status: "DRAFT", createdAt: "2026-04-01T12:00:00.000Z", publishedAt: null, acceptedAt: null, acceptedByName: null, authorName: "Dirección", attachmentName: "plan.pdf", hasAttachment: true };
const published = { ...draft, status: "PUBLISHED", publishedAt: "2026-04-02T12:00:00.000Z" };
const client = (agreements = [draft], mode = "admin", extra = {}) => harness(`${componentRoot}teacher-follow-up-agreements-client.tsx`, "TeacherFollowUpAgreementsClient", { agreements, mode, teacherId: teacher.id }, extra);
const form = (agreement, extra = {}) => harness(`${componentRoot}teacher-follow-up-agreement-form.tsx`, "TeacherFollowUpAgreementForm", { teacherId: teacher.id, draft: agreement }, extra);
async function submit(ui, values = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ title: "Plan docente", body: "Texto acordado", ...values })) data.set(key, value);
  await ui.find((node) => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: data });
  ui.render();
}

test("S2/S3: teacher action menu adds guarded agreements while preserving reports, hidden heading and profile saving", async () => {
  for (const canManageReports of [true, false]) {
    const saved = [];
    const ui = harness("modules/teachers/components/dashboard-teachers-client.tsx", "DashboardTeachersClient", { teachers: [teacher], groups: teacher.groups, canManageReports }, { overrides: {
      "@/modules/teachers/server/teacher.actions": { updateTeacherProfileAction: async (values) => { saved.push(values); return { ok: true }; } },
    } });
    const agreementLink = ui.find((node) => node.type === "a" && text(node) === "Acuerdos de seguimiento");
    assert.equal(Boolean(agreementLink), canManageReports);
    if (agreementLink) assert.equal(agreementLink.props.href, "/dashboard/teachers/teacher%2F1/follow-up-agreements");
    const reportLink = ui.find((node) => node.type === "a" && text(node) === "Reportes");
    assert.equal(Boolean(reportLink), canManageReports);
    if (reportLink) assert.equal(reportLink.props.href, "/dashboard/teachers/teacher%2F1/reports");
    assert.ok(ui.find((node) => node.props["aria-label"] === `Acciones para ${teacher.displayName}`));
    assert.equal(text(ui.find((node) => node.type === "TableHead" && node.props["aria-label"] === "Acciones")), "");
    ui.button("Editar perfil").props.onClick();
    ui.render();
    assert.equal(ui.find((node) => node.type === "ResponsiveDialog").props.open, true);
    assert.equal(ui.resets.at(-1).id, teacher.id);
    assert.deepEqual(Array.from(ui.resets.at(-1).groupIds), ["g1"]);
    ui.find((node) => node.type === "form").props.onSubmit(ui.resets.at(-1));
    await ui.settle();
    ui.render();
    assert.equal(saved[0].id, teacher.id);
    assert.equal(ui.refreshes, 1);
    assert.equal(ui.find((node) => node.type === "ResponsiveDialog").props.open, false);
  }
});

test("S3: admin page guards every role before teacher lookup, and missing teacher stops loading", async () => {
  const pagePath = "app/(dashboard)/dashboard/teachers/[teacherId]/follow-up-agreements/page.tsx";
  for (const role of ["TEACHER", "ADMIN_TEACHER", "ADMIN", "PARENT", "SUPERADMIN", null]) {
    const events = [];
    const { default: Page } = load(pagePath, {
      "@/modules/auth/server/auth-guards": { requireRole: async (roles) => {
        events.push("guard"); assert.deepEqual(Array.from(roles), ["SUPERADMIN"]);
        if (!roles.includes(role)) throw new Error("forbidden");
        return { role, email: "admin@example.test", permissionKeys: [] };
      } },
      "@/lib/prisma": { prisma: { teacherProfile: { findUnique: async (query) => { events.push("teacher"); assert.equal(query.where.id, teacher.id); return { id: teacher.id, displayName: teacher.displayName }; } } } },
      "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => { events.push("cms"); return []; } },
    });
    if (role !== "SUPERADMIN") {
      await assert.rejects(Page({ params: Promise.resolve({ teacherId: teacher.id }) }), /forbidden/);
      assert.deepEqual(events, ["guard"]);
    } else {
      const result = await Page({ params: Promise.resolve({ teacherId: teacher.id }) });
      assert.equal(events[0], "guard");
      assert.ok(nodes(result).some((node) => node.props.teacherId === teacher.id && node.props.teacherName === teacher.displayName));
    }
  }
  let reads = 0;
  const { default: Missing } = load(pagePath, {
    "@/modules/auth/server/auth-guards": { requireRole: async () => ({ role: "SUPERADMIN" }) },
    "@/lib/prisma": { prisma: { teacherProfile: { findUnique: async () => null } } },
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND"); } },
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => { reads++; return []; } },
  });
  await assert.rejects(Missing({ params: Promise.resolve({ teacherId: "missing" }) }), /NOT_FOUND/);
  assert.equal(reads, 0);
});

test("S2: admin view consumes serialized rows, loads safely and uses the ghost/sm back arrow", async () => {
  const path = "modules/teachers/views/dashboard-teacher-follow-up-agreements-view.tsx";
  const { DashboardTeacherFollowUpAgreementsView: View } = load(path, { [repository]: { listTeacherFollowUpAgreements: async (id) => { assert.equal(id, teacher.id); return [draft]; } } });
  const tree = await View({ teacherId: teacher.id, teacherName: teacher.displayName });
  const props = nodes(tree).find((node) => Array.isArray(node.props.agreements)).props;
  assert.deepEqual(JSON.parse(JSON.stringify(props.agreements)), [draft]);
  assert.equal(props.mode, "admin");
  const back = nodes(tree).find((node) => node.type === "Button" && node.props.variant === "ghost" && node.props.size === "sm");
  assert.ok(back);
  assert.ok(nodes(back).some((node) => node.type === "a" && node.props.href === "/dashboard/teachers"));
  assert.ok(nodes(back).some((node) => node.type === "ArrowLeft"));
  const { DashboardTeacherFollowUpAgreementsView: Failed } = load(path, { [repository]: { listTeacherFollowUpAgreements: async () => { throw new Error("private storage detail"); } } });
  const failed = await Failed({ teacherId: teacher.id, teacherName: teacher.displayName });
  assert.match(text(failed), /No pudimos cargar los acuerdos/);
  assert.doesNotMatch(text(failed), /private storage/);
  assert.ok(nodes(failed).some((node) => node.type === "a" && node.props.href === "/dashboard/teachers/teacher%2F1/follow-up-agreements"));
});

test("S3: recipient page guards before own-list call with zero identity parameters", async () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER", "SUPERADMIN", "ADMIN", "PARENT", null]) {
    const events = [];
    const { default: Page } = load("app/(dashboard)/dashboard/mis-acuerdos-seguimiento/page.tsx", {
      "@/modules/auth/server/auth-guards": { requireRole: async (roles) => { events.push("guard"); assert.deepEqual(Array.from(roles), ["TEACHER", "ADMIN_TEACHER"]); if (!roles.includes(role)) throw new Error("forbidden"); return { role, email: "teacher@example.test", permissionKeys: [] }; } },
      [repository]: { listOwnTeacherFollowUpAgreements: async (...args) => { events.push("own"); assert.equal(args.length, 0); return [published]; } },
      "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => { events.push("cms"); return []; } },
    });
    if (!["TEACHER", "ADMIN_TEACHER"].includes(role)) {
      await assert.rejects(Page(), /forbidden/); assert.deepEqual(events, ["guard"]);
    } else {
      const tree = await Page();
      assert.equal(events[0], "guard");
      assert.ok(events.includes("own"));
      const props = nodes(tree).find((node) => Array.isArray(node.props.agreements)).props;
      assert.equal(props.mode, "recipient");
      assert.deepEqual(JSON.parse(JSON.stringify(props.agreements)), [published]);
    }
  }
});

test("S2: admin list reads title/body, metadata, attachment proxy, empty state and creates/edits drafts only", () => {
  assert.match(client([]).text(), /Todavía no hay acuerdos/);
  const ui = client([draft, { ...published, id: "published", acceptedAt: "2026-04-03T12:00:00.000Z", acceptedByName: "Ana Pérez" }]);
  for (const label of ["Creado", "Autor", "Estado", "Conformidad", "Dirección", "Borrador", "Publicado", "Ana Pérez", "3/4/2026", draft.body]) assert.ok(ui.text().includes(label), label);
  const attachment = ui.find((node) => node.type === "a" && text(node).includes("plan.pdf"));
  assert.equal(attachment.props.href, "/api/teacher-follow-up-agreements/agreement%2F1/attachment");
  assert.equal(attachment.props.rel, "noopener noreferrer");
  assert.equal(ui.all().filter((node) => node.type === "Button" && text(node) === "Editar").length, 1);
  ui.button("Editar").props.onClick(); ui.render();
  assert.equal(ui.find((node) => node.type === "TeacherFollowUpAgreementForm").props.draft.id, draft.id);
  ui.find((node) => node.type === "TeacherFollowUpAgreementForm").props.onCancel(); ui.render();
  ui.button("Nuevo acuerdo").props.onClick(); ui.render();
  assert.equal(ui.find((node) => node.type === "TeacherFollowUpAgreementForm").props.draft, undefined);
  assert.doesNotMatch(ui.text(), /visibilidad futura|familias|alumnos/i);
});

test("S2: publish freezes editing immediately; failed publish preserves draft and counters", async () => {
  let ok = false;
  const ui = client([draft], "admin", { fetch: async () => ({ ok, json: async () => ({ ok, error: "No se pudo publicar." }) }) });
  await ui.button("Publicar").props.onClick(); ui.render();
  assert.equal(ui.calls[0].url, "/api/teacher-follow-up-agreements/agreement%2F1/publish");
  assert.equal(ui.calls[0].method, "POST");
  assert.equal(ui.calls[0].body, undefined);
  assert.ok(ui.button("Editar")); assert.equal(ui.refreshes, 0);
  assert.match(ui.text(), /No se pudo publicar/);
  ok = true;
  await ui.button("Publicar").props.onClick(); ui.render();
  assert.equal(ui.button("Editar"), undefined);
  assert.equal(ui.button("Publicar"), undefined);
  assert.match(ui.text(), /Publicado/); assert.equal(ui.refreshes, 1);
});

test("S2: deletion requires confirmation; cancellation and failures preserve rows", async () => {
  let ok = false;
  const ui = client([published], "admin", { fetch: async () => ({ ok, json: async () => ({ ok, error: "No se pudo eliminar." }) }) });
  const open = () => { ui.find((node) => node.props["aria-label"] === `Eliminar acuerdo ${published.title}`).props.onClick(); ui.render(); };
  open(); assert.equal(ui.calls.length, 0);
  assert.match(ui.text(), /Esta acción no se puede deshacer/);
  ui.button("Cancelar").props.onClick(); ui.render(); assert.equal(ui.calls.length, 0);
  open(); await ui.button("Eliminar definitivamente").props.onClick(); ui.render();
  assert.equal(ui.calls[0].url, "/api/teacher-follow-up-agreements/agreement%2F1");
  assert.equal(ui.calls[0].method, "DELETE");
  assert.match(ui.text(), /Plan docente/); assert.equal(ui.refreshes, 0);
  assert.match(ui.text(), /No se pudo eliminar/);
  ok = true;
  await ui.button("Eliminar definitivamente").props.onClick(); ui.render();
  assert.match(ui.text(), /Todavía no hay acuerdos/); assert.equal(ui.refreshes, 1);
});

test("S3: recipient only reads published content and consents without synthetic actor/time or admin controls", async () => {
  let ok = false;
  const ui = client([draft, { ...published, id: "published/2" }], "recipient", { fetch: async () => ({ ok, json: async () => ({ ok, error: "No se pudo registrar." }) }) });
  assert.equal(ui.all().filter((node) => node.type === "TableRow").length, 2);
  for (const action of ["Nuevo acuerdo", "Editar", "Publicar", "Eliminar definitivamente"]) assert.equal(ui.button(action), undefined);
  assert.equal(ui.find((node) => node.props["aria-label"] === `Eliminar acuerdo ${draft.title}`), undefined);
  await ui.button("Dar conformidad").props.onClick(); ui.render();
  assert.equal(ui.calls[0].url, "/api/teacher-follow-up-agreements/published%2F2/consent");
  assert.equal(ui.calls[0].method, "POST"); assert.equal(ui.calls[0].body, undefined);
  assert.equal(ui.refreshes, 0); assert.match(ui.text(), /No se pudo registrar/);
  assert.equal(ui.button("Dar conformidad").props.disabled, false);
  ok = true;
  await ui.button("Dar conformidad").props.onClick(); ui.render();
  assert.equal(ui.refreshes, 1);
  assert.equal(ui.button("Dar conformidad").props.disabled, true);
  const accepted = client([{ ...published, acceptedAt: "2026-04-03T12:00:00.000Z", acceptedByName: "Ana Pérez" }], "recipient");
  assert.match(accepted.text(), /Ana Pérez/); assert.match(accepted.text(), /3\/4\/2026/);
  assert.equal(accepted.button("Dar conformidad"), undefined);
  assert.equal(accepted.calls.length, 0);
});

test("S2: create/edit uses only exact multipart fields, preserves absent attachment, accepts supported formats and size boundary", async () => {
  for (const extension of [null, "pdf", "DOC", "docx", "jpg", "jpeg", "png", "webp"]) {
    const ui = form();
    const values = extension ? { file: new File([extension === "pdf" ? new Uint8Array(10 * 1024 * 1024) : "data"], `plan.${extension}`) } : {};
    await submit(ui, { ...values, studentIds: '["not-allowed"]', familyId: "not-allowed", authorId: "not-allowed" });
    assert.equal(ui.calls.length, 1, String(extension));
    const call = ui.calls[0];
    assert.equal(call.url, "/api/teacher-follow-up-agreements"); assert.equal(call.method, "POST");
    assert.deepEqual([...call.body.keys()].sort(), ["body", ...(extension ? ["file"] : []), "teacherId", "title"].sort());
    assert.equal(call.body.get("teacherId"), teacher.id);
    assert.equal(call.body.get("title"), "Plan docente"); assert.equal(call.body.get("body"), "Texto acordado");
    assert.equal(ui.refreshes, 1); assert.equal(ui.saved, 1);
  }
  const edit = form(draft);
  await submit(edit, { file: new File([], "") });
  assert.equal(edit.calls[0].url, "/api/teacher-follow-up-agreements/agreement%2F1");
  assert.equal(edit.calls[0].method, "PATCH");
  assert.deepEqual([...edit.calls[0].body.keys()].sort(), ["body", "title"]);
  assert.equal(edit.refreshes, 1);
  const replacement = form(draft);
  await submit(replacement, { title: "OK", body: "x".repeat(10000), file: new File(["replacement"], "nuevo.png") });
  assert.equal(replacement.calls[0].method, "PATCH");
  assert.deepEqual([...replacement.calls[0].body.keys()].sort(), ["body", "file", "title"]);
  assert.equal(replacement.calls[0].body.get("file").name, "nuevo.png");
  assert.equal(replacement.calls[0].body.get("body").length, 10000);
  assert.equal(replacement.refreshes, 1);
  const longestTitle = form();
  await submit(longestTitle, { title: "x".repeat(160) });
  assert.equal(longestTitle.calls[0].body.get("title").length, 160);
  assert.equal(longestTitle.refreshes, 1);
});

test("S2: invalid input, published forms, malformed success and network errors leave data/counters unchanged", async () => {
  for (const values of [
    { title: " " }, { title: "x" }, { title: "x".repeat(161) }, { body: " " }, { body: "x".repeat(10001) },
    { file: new File(["data"], "plan.exe") }, { file: new File([new Uint8Array(10 * 1024 * 1024 + 1)], "plan.pdf") },
  ]) {
    const ui = form(); await submit(ui, values);
    assert.equal(ui.calls.length, 0); assert.equal(ui.refreshes, 0); assert.equal(ui.saved, 0);
    assert.ok(ui.find((node) => node.props.role === "alert"));
  }
  const frozen = form(published);
  assert.equal(frozen.find((node) => node.type === "form"), undefined);
  for (const response of [
    async () => ({ ok: false, json: async () => ({ error: "No pudimos guardar." }) }),
    async () => ({ ok: true, json: async () => ({}) }),
    async () => { throw new Error("Sin conexión"); },
  ]) {
    const ui = form(draft, { fetch: response }); await submit(ui);
    assert.equal(ui.calls.length, 1); assert.equal(ui.refreshes, 0); assert.equal(ui.saved, 0);
    assert.ok(ui.find((node) => node.props.role === "alert"));
    assert.equal(ui.find((node) => node.type === "Button" && node.props.type === "submit").props.disabled, false);
  }
});
