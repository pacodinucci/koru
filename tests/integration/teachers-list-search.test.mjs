import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import React from "react";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness(canManageReports = true) {
  let cursor = 0;
  const state = [];
  const fields = [];
  const primitive = (name) => function MockPrimitive(props) { return React.createElement(name, props, props.children); };
  const primitives = new Proxy({}, { get: (_, name) => primitive(name) });
  const mocks = {
    react: { ...React, useMemo: (fn) => fn(), useTransition: () => [false, () => {}], useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], (value) => { state[i] = value; }]; } },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "react-hook-form": { useForm: () => ({ control: {}, handleSubmit: (fn) => fn, reset: (value) => fields.push(value) }) },
    "@hookform/resolvers/zod": { zodResolver: () => ({}) },
  };
  const output = ts.transpileModule(readFileSync("src/modules/teachers/components/dashboard-teachers-client.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(output, { module: loaded, exports: loaded.exports, require: (id) => mocks[id] ?? (["react/jsx-runtime"].includes(id) ? require(id) : primitives) });
  const groups = [{ id: "a", name: "Esporas", ageRange: "4-6" }, { id: "b", name: "Helechos", ageRange: "7-9" }];
  const teachers = [
    { id: "one", displayName: "Ana Pérez", email: "ana@example.com", groups: [groups[0]], isActive: true },
    { id: "two", displayName: "Ana Gómez", email: null, user: { email: "gomez@example.com", name: "Ana Gómez", id: "u2", role: "TEACHER" }, groups: groups, isActive: true },
    { id: "three", displayName: "Juan Díaz", email: "juan@example.com", groups: [groups[1]], isActive: false },
    { id: "four", displayName: "Sin grupo", email: null, groups: [], isActive: true },
  ].map((teacher) => ({ user: null, studentsCount: 2, phone: null, bio: null, position: null, organizationGroup: null, ...teacher }));
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!React.isValidElement(node)) return [];
    if (typeof node.type === "function") return nodes(node.type(node.props));
    return [node, ...nodes(node.props.children), ...nodes(node.props.render)];
  }
  const render = (data = teachers) => { cursor = 0; return nodes(loaded.exports.DashboardTeachersClient({ teachers: data, groups, canManageReports })); };
  return { render, fields, teachers };
}
const rows = (nodes) => nodes.filter((node) => node.type === "TableRow").slice(1);
const search = (nodes) => nodes.find((node) => node.type === "Input" && node.props.id === "teachers-search");
const groupTabs = (nodes) => nodes.find((node) => node.type === "Tabs");

test("teachers use the full Alumnos search/group toolbar and combine both filters", () => {
  const h = harness(); let all = h.render();
  assert.ok(search(all), "Docentes must have a labelled live-search input");
  assert.equal(search(all).props.type, "search");
  assert.ok(all.some((node) => node.type === "label" && node.props.htmlFor === "teachers-search" && node.props.children === "Buscar"));
  assert.ok(groupTabs(all), "Docentes must expose group tabs just like Alumnos");
  const tabsList = all.find((node) => node.type === "TabsList");
  assert.match(tabsList.props.className, /var\(--brand-600\)_14%,white/);
  assert.deepEqual(all.filter((node) => node.type === "TabsTrigger").map((node) => node.props.value), ["", "a", "b"]);
  assert.equal(rows(all).length, 4);
  search(all).props.onChange({ target: { value: " ANA " } }); all = h.render(); assert.equal(rows(all).length, 2);
  groupTabs(all).props.onValueChange("b"); all = h.render(); assert.equal(rows(all).length, 1);
  assert.ok(all.some((node) => node.type === "TableCell" && node.props.children === "Ana Gómez"));
  groupTabs(all).props.onValueChange(""); all = h.render(); assert.equal(rows(all).length, 2);
  search(all).props.onChange({ target: { value: "gomez@example.com" } }); all = h.render(); assert.equal(rows(all).length, 1);
  search(all).props.onChange({ target: { value: "" } }); all = h.render(); assert.equal(rows(all).length, 4);
});

test("teachers distinguish no matches from no records and retain invitation/edit/report actions", () => {
  const h = harness(); let all = h.render();
  assert.ok(search(all));
  assert.ok(all.some((node) => node.type === "TeacherInvitationActions"));
  assert.equal(all.filter((node) => node.type === "DropdownMenuItem" && node.props.children === "Reportes").length, 4);
  all.find((node) => node.type === "DropdownMenuItem" && node.props.children === "Editar perfil").props.onClick();
  all = h.render();
  assert.equal(h.fields[0].id, "one");
  assert.ok(all.some((node) => node.type === "ResponsiveDialog" && node.props.open));
  search(all).props.onChange({ target: { value: "nadie" } }); all = h.render();
  assert.ok(all.some((node) => node.type === "TableCell" && node.props.colSpan === 7 && node.props.children === "No encontramos docentes para estos filtros."));
  all = h.render([]);
  assert.ok(all.some((node) => node.type === "TableCell" && node.props.children === "Todavía no hay usuarios con rol docente."));
  const restricted = harness(false).render();
  assert.equal(restricted.filter((node) => node.type === "DropdownMenuItem" && node.props.children === "Reportes").length, 0);
});
