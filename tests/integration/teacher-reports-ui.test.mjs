import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = "modules/teachers/";
const pagePath = "app/(dashboard)/dashboard/teachers/[teacherId]/reports/page.tsx";
const primitive = (name) => (props) => React.createElement(name, props, props.children);
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
    if (id.endsWith("student-report-rich-text")) return { RICH_REPORT_PREFIX: "koru-report-rich-v1:" };
    return primitives;
  } });
  return mod.exports;
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!React.isValidElement(tree)) return [];
  if (typeof tree.type === "function") return nodes(tree.type(tree.props));
  const rendered = React.isValidElement(tree.props.render)
    ? React.cloneElement(tree.props.render, {}, tree.props.children ?? tree.props.render.props.children)
    : null;
  return [tree, ...nodes(tree.props.children), ...nodes(rendered)];
}
const text = (tree) => {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (!React.isValidElement(tree)) return typeof tree === "string" ? tree : "";
  return typeof tree.type === "function" ? text(tree.type(tree.props)) : text(tree.props.children);
};
function harness(path, exported, props, extra = {}) {
  const states = [];
  let cursor = 0;
  const calls = [];
  const routes = [];
  let refreshes = 0;
  const resets = [];
  const transitions = [];
  const form = { reset: (value) => resets.push(value), handleSubmit: (fn) => fn, control: {} };
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useRef: (value) => ({ current: value }),
    useMemo: (fn) => fn(),
    useEffect() {},
    useTransition: () => [false, (fn) => { transitions.push(fn()); }],
  };
  const component = load(path, {
    react: hooks,
    "next/navigation": { useRouter: () => ({ refresh: () => refreshes++, push: (url) => routes.push(url) }) },
    "react-hook-form": { useForm: () => form },
    "@hookform/resolvers/zod": { zodResolver: () => ({}) },
    ...extra.overrides,
  }, {
    File, FormData,
    fetch: async (url, init) => {
      calls.push({ url, ...init });
      return extra.fetch ? extra.fetch(url, init) : { ok: true, json: async () => ({ ok: true }) };
    },
  })[exported];
  let tree;
  const ui = {
    render() { cursor = 0; tree = component(props); return tree; },
    all: () => nodes(tree),
    find: (predicate) => nodes(tree).find(predicate),
    button: (label) => nodes(tree).find((node) => node.props.onClick && text(node) === label),
    text: () => text(tree), calls, routes, resets,
    settle: () => Promise.all(transitions),
    get refreshes() { return refreshes; },
  };
  ui.render();
  return ui;
}
const teacher = { id: "teacher/1", displayName: "Ana Pérez", email: "ana@example.test", phone: "123", bio: "Notas", position: "Docente", organizationGroup: "Inicial", isActive: true, user: null, groups: [{ id: "g1", name: "Sala A", ageRange: "3 años" }], studentsCount: 2 };
const row = { id: "report/1", title: "Seguimiento", content: "Texto del reporte", fileName: null, fileMimeType: null, hasFile: false, createdAt: "2026-04-01T12:00:00.000Z", visibleToTeacher: false, authorName: "Dirección" };
const table = (reports = [row], extra = {}) => harness(`${root}components/teacher-profile-reports-table.tsx`, "TeacherProfileReportsTable", { reports, teacherName: teacher.displayName }, extra);
const dialog = (extra = {}) => harness(`${root}components/create-teacher-report-dialog.tsx`, "CreateTeacherReportDialog", { teacherId: teacher.id }, extra);
const submit = (ui, data = new FormData()) => ui.find((node) => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: data });
// FormData accepts a real form in browsers; this adapter preserves the multipart public contract in Node.
class BrowserFormData extends FormData {
  constructor(form) { super(); if (form instanceof FormData) for (const [key, value] of form) this.append(key, value); }
}
// Use the adapter only for dialogs; no DOM library or dependency installation is required.
function createDialog(extra = {}) {
  const original = globalThis.FormData;
  globalThis.FormData = BrowserFormData;
  try { return dialog(extra); } finally { globalThis.FormData = original; }
}

test("S2: accessible vertical menu navigates per teacher only when authorized; profile editing is preserved", async () => {
  const saved = [];
  for (const canManageReports of [true, false]) {
    const ui = harness(`${root}components/dashboard-teachers-client.tsx`, "DashboardTeachersClient", { teachers: [teacher], groups: teacher.groups, canManageReports }, {
      overrides: { "@/modules/teachers/server/teacher.actions": { updateTeacherProfileAction: async (values) => { saved.push(values); return { ok: true }; } } },
    });
    const actionHeader = ui.all().filter((node) => node.type === "TableHead").at(-1);
    assert.equal(text(actionHeader), "", "actions column has no visible title");
    assert.equal(actionHeader.props["aria-label"], "Acciones");
    assert.ok(ui.find((node) => node.props["aria-label"] === `Acciones para ${teacher.displayName}`));
    assert.ok(ui.find((node) => node.type === "EllipsisVertical"));
    const reports = ui.find((node) => node.type === "a" && text(node) === "Reportes");
    assert.equal(Boolean(reports), canManageReports);
    if (reports) assert.equal(reports.props.href, "/dashboard/teachers/teacher%2F1/reports");
    ui.button("Editar perfil").props.onClick();
    ui.render();
    assert.equal(ui.find((node) => node.type === "ResponsiveDialog").props.open, true);
    assert.deepEqual(JSON.parse(JSON.stringify(ui.resets.at(-1))), { id: teacher.id, phone: "123", bio: "Notas", position: "Docente", organizationGroup: "Inicial", isActive: true, groupIds: ["g1"] });
    assert.match(ui.text(), /Editar perfil docente/);
    ui.find((node) => node.type === "form").props.onSubmit(ui.resets.at(-1));
    await ui.settle();
    ui.render();
    assert.equal(saved.at(-1).id, teacher.id);
    assert.equal(ui.refreshes, 1);
    assert.equal(ui.find((node) => node.type === "ResponsiveDialog").props.open, false);
  }
});

test("S1/S3: page rejects every non-superadmin before any data and handles missing teachers", async () => {
  for (const role of ["TEACHER", "ADMIN_TEACHER", "PARENT", "ADMIN", "SUPERADMIN"]) {
    const events = [];
    const { default: Page } = load(pagePath, {
      "@/modules/auth/server/auth-guards": { requireRole: async (roles) => { events.push("guard"); assert.deepEqual(Array.from(roles), ["SUPERADMIN"]); if (!roles.includes(role)) throw new Error("forbidden"); return { role, email: "admin@example.test", permissionKeys: [] }; } },
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
  let cmsReads = 0;
  const { default: MissingPage } = load(pagePath, {
    "@/modules/auth/server/auth-guards": { requireRole: async () => ({ role: "SUPERADMIN" }) },
    "@/lib/prisma": { prisma: { teacherProfile: { findUnique: async () => null } } },
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND"); } },
    "@/modules/dashboard/server/cms-pages.repository": { discoverPagesGroupRoutes: async () => { cmsReads++; return []; } },
  });
  await assert.rejects(MissingPage({ params: Promise.resolve({ teacherId: "missing" }) }), /NOT_FOUND/);
  assert.equal(cmsReads, 0);
});

test("teacher reports return link uses the shared ghost button with a left arrow", async () => {
  const { DashboardTeacherReportsView } = load(`${root}views/dashboard-teacher-reports-view.tsx`, {
    "@/modules/teachers/server/teacher-reports.repository": { listTeacherReports: async () => [] },
  });
  const result = await DashboardTeacherReportsView({ teacherId: teacher.id, teacherName: teacher.displayName });
  const back = nodes(result).find((node) => node.type === "Button" && text(node).trim() === "Volver a docentes");
  assert.ok(back, "return navigation uses the same button as other detail pages");
  assert.equal(back.props.variant, "ghost");
  assert.equal(back.props.size, "sm");
  assert.equal(back.props.nativeButton, false);
  assert.equal(back.props.render.props.href, "/dashboard/teachers");
  const arrow = nodes(back.props.children).find((node) => node.type === "ArrowLeft");
  assert.ok(arrow, "left arrow is visible before the return label");
  assert.equal(arrow.props["aria-hidden"], true);
});

test("S1/S3: view explicitly serializes repository rows without private URLs and offers a safe load error", async () => {
  const report = { ...row, createdAt: new Date(row.createdAt), fileUrl: "https://private.example.test/secret", author: { name: "Dirección", privateData: "hidden" }, internalField: "hidden" };
  const { DashboardTeacherReportsView } = load(`${root}views/dashboard-teacher-reports-view.tsx`, {
    "@/modules/teachers/server/teacher-reports.repository": { listTeacherReports: async (id) => { assert.equal(id, teacher.id); return [report]; } },
  });
  const result = await DashboardTeacherReportsView({ teacherId: teacher.id, teacherName: teacher.displayName });
  const props = nodes(result).find((node) => Array.isArray(node.props.reports)).props;
  assert.deepEqual(JSON.parse(JSON.stringify(props.reports)), [{ ...row, hasFile: true }]);
  assert.doesNotMatch(JSON.stringify(result), /secret|privateData|internalField|fileUrl/);
  assert.match(text(result), /solo superadmin|Solo superadmin/i);
  const { DashboardTeacherReportsView: FailedView } = load(`${root}views/dashboard-teacher-reports-view.tsx`, {
    "@/modules/teachers/server/teacher-reports.repository": { listTeacherReports: async () => { throw new Error("private backend error"); } },
  });
  const failed = await FailedView({ teacherId: teacher.id, teacherName: teacher.displayName });
  assert.match(text(failed), /No pudimos cargar los reportes/);
  assert.doesNotMatch(text(failed), /private backend/);
  assert.ok(nodes(failed).some((node) => node.type === "a" && text(node) === "Reintentar"));
});

test("S1: table exposes empty state, content reader, authenticated download and future-only visibility", async () => {
  assert.match(table([]).text(), /Todavía no hay reportes de este docente/);
  const ui = table([row, { ...row, id: "file/2", content: null, fileName: "informe.docx", fileMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", hasFile: true }]);
  assert.match(ui.text(), /Seguimiento/);
  assert.match(ui.text(), /Dirección/);
  assert.ok(ui.find((node) => node.type === "StudentReportBody" && node.props.body === row.content));
  assert.equal(ui.find((node) => node.type === "a" && text(node).includes("Descargar")).props.href, "/api/teacher-reports/file%2F2/download");
  assert.match(ui.text(), /futur|más adelante/i);
  const toggle = ui.find((node) => node.type === "Switch");
  assert.equal(toggle.props.checked, false);
  assert.match(toggle.props["aria-label"], /Seguimiento/);
  await toggle.props.onCheckedChange(true);
  assert.equal(ui.calls[0].url, "/api/teacher-reports/report%2F1/visibility");
  assert.equal(ui.calls[0].method, "PATCH");
  assert.equal(ui.calls[0].headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(ui.calls[0].body), { visibleToTeacher: true });
  ui.render();
  assert.equal(ui.find((node) => node.type === "Switch").props.checked, true);
  assert.equal(ui.refreshes, 1);
});

test("S1: failed visibility/deletion leaves rows unchanged; deletion requires confirmation and refreshes on success", async () => {
  let ok = false;
  const ui = table([row], { fetch: async () => ({ ok, json: async () => ({ ok, error: "No se pudo guardar." }) }) });
  await ui.find((node) => node.type === "Switch").props.onCheckedChange(true);
  ui.render();
  assert.equal(ui.find((node) => node.type === "Switch").props.checked, false);
  assert.match(ui.text(), /No se pudo guardar/);
  assert.equal(ui.refreshes, 0);
  ui.find((node) => node.props["aria-label"] === `Eliminar reporte ${row.title}`).props.onClick();
  ui.render();
  assert.equal(ui.calls.length, 1, "opening confirmation must not delete");
  assert.match(ui.text(), /Esta acción no se puede deshacer/);
  await ui.button("Eliminar definitivamente").props.onClick();
  ui.render();
  assert.equal(ui.calls[1].method, "DELETE");
  assert.equal(ui.calls[1].url, "/api/teacher-reports/report%2F1");
  assert.ok(ui.find((node) => node.type === "Switch"));
  assert.equal(ui.refreshes, 0);
  ok = true;
  await ui.button("Eliminar definitivamente").props.onClick();
  ui.render();
  assert.match(ui.text(), /Todavía no hay reportes de este docente/);
  assert.equal(ui.refreshes, 1);
});

test("S1: creation accepts rich text OR PDF/DOC/DOCX using the exact multipart API", async () => {
  for (const extension of [null, "pdf", "DOC", "docx"]) {
    const ui = createDialog();
    assert.equal(ui.find((node) => node.props.name === "reportFile").props.accept, ".pdf,.doc,.docx");
    assert.equal(ui.find((node) => node.props.name === "title").props.maxLength, 160);
    const data = new FormData();
    data.set("title", "Informe docente");
    if (extension) data.set("reportFile", new File(["data"], `informe.${extension}`));
    else {
      ui.find((node) => node.type === "StudentReportRichEditor").props.onChange({ json: '{"type":"doc","content":[]}', text: "Texto" });
      ui.render();
    }
    await submit(ui, data);
    assert.equal(ui.calls.length, 1);
    assert.equal(ui.calls[0].url, "/api/teachers/teacher%2F1/reports");
    assert.equal(ui.calls[0].method, "POST");
    assert.equal(ui.calls[0].body.get("title"), "Informe docente");
    assert.equal(ui.calls[0].body.get("content"), extension ? null : 'koru-report-rich-v1:{"type":"doc","content":[]}');
    assert.equal(ui.calls[0].body.has("file"), false);
    assert.equal(ui.refreshes, 1);
    ui.render();
    assert.equal(ui.find((node) => node.type === "ResponsiveDialog").props.open, false);
  }
});

test("S1: invalid or failed creation never refreshes or sends rejected input", async () => {
  for (const invalid of ["empty", "both", "extension", "oversized-file", "oversized-text"]) {
    const ui = createDialog();
    const data = new FormData();
    data.set("title", "Informe docente");
    if (["both", "extension", "oversized-file"].includes(invalid)) data.set("reportFile", new File([invalid === "oversized-file" ? new Uint8Array(10 * 1024 * 1024 + 1) : "data"], invalid === "extension" ? "mal.exe" : "reporte.pdf"));
    if (["both", "oversized-text"].includes(invalid)) {
      ui.find((node) => node.type === "StudentReportRichEditor").props.onChange({ json: invalid === "oversized-text" ? "x".repeat(10001) : "{}", text: "Texto" });
      ui.render();
    }
    await submit(ui, data);
    ui.render();
    assert.equal(ui.calls.length, 0, invalid);
    assert.equal(ui.refreshes, 0, invalid);
    assert.ok(ui.find((node) => node.props.role === "alert"), invalid);
  }
  const ui = createDialog({ fetch: async () => ({ ok: false, json: async () => ({ error: "No pudimos guardar el reporte." }) }) });
  const data = new FormData();
  data.set("title", "Informe docente");
  data.set("reportFile", new File(["data"], "reporte.pdf"));
  await submit(ui, data);
  ui.render();
  assert.match(ui.text(), /No pudimos guardar el reporte/);
  assert.equal(ui.refreshes, 0);
});
