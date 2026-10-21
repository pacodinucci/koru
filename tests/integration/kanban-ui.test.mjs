import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const pass = ({ children }) => React.createElement("div", null, children);
function load(path, overrides = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, Error,
    FormData: class { constructor(form) { this.values = form.values; } get(key) { return this.values[key] ?? null; } },
    require: (id) => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (["react", "react/jsx-runtime"].includes(id)) return require(id);
      if (id === "next/navigation") return { usePathname: () => "/dashboard/kanban/equipo", useSearchParams: () => new URLSearchParams() };
      if (id === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
      if (id === "next/image") return { __esModule: true, default: () => null };
      if (id.endsWith("content-page-config")) return { getCmsContentNavigation: () => [] };
      if (id.endsWith("auth/roles")) return { isAdminRole: (role) => ["ADMIN", "ADMIN_TEACHER", "SUPERADMIN"].includes(role), isSuperAdminRole: (role) => role === "SUPERADMIN" };
      if (id.endsWith("dashboard-editor-panel")) return { DashboardEditorPanelProvider: pass, DashboardEditorPanelLayout: pass, useDashboardEditorPanel: () => ({ open: false, setOpen() {} }) };
      if (id.endsWith("ui/sidebar")) return new Proxy({}, { get: (_, name) => name === "SidebarMenuButton" ? ({ render, isActive, hidden, children }) => hidden ? null : React.cloneElement(render ?? React.createElement("button"), { "data-active": String(Boolean(isActive)) }, children) : pass });
      if (id === "./kanban-editor") return load("modules/kanban/components/kanban-editor.tsx", overrides);
      if (id.endsWith("ui/responsive-dialog")) return {
        ResponsiveDialog: ({ open, onOpenChange, children }) => open ? React.createElement("div", { "data-dialog-root": true }, children, React.createElement("button", { "aria-label": "Cerrar diálogo", onClick: () => onOpenChange(false) }, "Cerrar")) : null,
        ResponsiveDialogContent: ({ children, ...props }) => React.createElement("div", { ...props, role: "dialog", "data-slot": "responsive-dialog-content" }, children),
        ResponsiveDialogHeader: pass,
        ResponsiveDialogBody: ({ children, ...props }) => React.createElement("div", props, children),
        ResponsiveDialogTitle: ({ children, ...props }) => React.createElement("h2", props, children),
        ResponsiveDialogDescription: ({ children, ...props }) => React.createElement("p", props, children),
      };
      if (id.endsWith("ui/button")) return { Button: ({ variant, size, ...props }) => React.createElement("button", props) };
      if (id.endsWith("ui/input")) return { Input: (props) => React.createElement("input", props) };
      if (id.endsWith("ui/label")) return { Label: (props) => React.createElement("label", props) };
      return new Proxy({}, { get: () => pass });
    },
  });
  return mod.exports;
}
const initialBoard = () => ({ id: "b1", name: "Equipo", description: "Trabajo compartido", statuses: [
  { id: "s1", name: "Pendiente", color: "#334455", position: 0, cards: [
    { id: "c1", title: "Preparar reunión", description: "Agenda", assigneeId: "u1", dueDate: "2026-04-10T00:00:00.000Z", position: 0 },
  ] },
  { id: "s2", name: "Hecho", color: "#22aa66", position: 1, cards: [] },
] });
const plain = (value) => JSON.parse(JSON.stringify(value));
function harness(options = {}) {
  let board = initialBoard(); let cursor = 0; let tree; let effects = [];
  const slots = []; const calls = [];
  const actions = {};
  for (const name of ["listBoards", "getBoard", "listAssignees", "createBoard", "updateBoard", "deleteBoard", "createStatus", "updateStatus", "reorderStatuses", "deleteStatus", "createCard", "updateCard", "deleteCard", "moveCard"]) {
    actions[`${name}Action`] = async (value) => {
      calls.push([name, plain(value ?? null)]);
      if (options[name]) return options[name](value);
      if (name === "listBoards") return [{ id: "b1", name: "Equipo", description: "Trabajo compartido", cardCount: 1 }, { id: "b2", name: "Otro equipo", description: null, cardCount: 0 }];
      if (name === "getBoard") return { ...board, id: value };
      if (name === "listAssignees") return [{ id: "u1", name: "Ana" }];
      if (name === "createBoard") return { id: "b2" };
    };
  }
  function state(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
  }
  const { KanbanWorkspace } = load("modules/kanban/components/kanban-workspace.tsx", {
    react: { ...React, useState: state, useRef: (value) => state(() => ({ current: value }))[0], useEffect: (fn, deps) => {
      const index = cursor++; const previous = slots[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        previous?.cleanup?.(); slots[index] = { deps }; effects.push(() => { slots[index].cleanup = fn(); });
      }
    } },
    "@/modules/kanban/server/kanban.actions": actions,
  });
  function expand(node) {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) return React.Children.toArray(node.map(expand));
    if (typeof node.type === "function") return expand(node.type(node.props));
    const children = node.props.children;
    return React.cloneElement(node, {}, ...(Array.isArray(children) ? children.map(expand) : [expand(children)]));
  }
  function nodes(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap((child) => nodes(child));
    return [node, ...nodes(node.props.children)];
  }
  const text = (node) => typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : "";
  const ui = {
    calls,
    render() { cursor = 0; tree = expand(KanbanWorkspace()); return tree; },
    html() { ui.render(); return renderToStaticMarkup(tree); },
    find(predicate) { ui.render(); return nodes(tree).find(predicate); },
    button(label) { const result = ui.find((node) => node.type === "button" && (node.props["aria-label"] === label || text(node) === label)); assert.ok(result, `Missing button: ${label}`); return result; },
    async click(label) { await ui.button(label).props.onClick(); ui.render(); },
    async submit(label, values) { const form = ui.find((node) => node.type === "form" && node.props["aria-label"] === label); assert.ok(form, `Missing form: ${label}`); await form.props.onSubmit({ preventDefault() {}, currentTarget: { values } }); ui.render(); },
    async ready() { ui.render(); for (const effect of effects.splice(0)) effect(); for (let i = 0; i < 12; i++) await Promise.resolve(); ui.render(); },
    setBoard(value) { board = value; },
  };
  ui.render(); return ui;
}

test("Kanban navigation follows dashboard.access for every role and preserves prior teacher links", () => {
  const { DashboardShell } = load("modules/dashboard/components/dashboard-shell.tsx");
  for (const role of ["ADMIN", "SUPERADMIN", "TEACHER", "ADMIN_TEACHER", "PARENT"]) {
    const html = renderToStaticMarkup(React.createElement(DashboardShell, { userEmail: "internal@example.test", userRole: role, userPermissions: ["dashboard.access"] }));
    assert.match(html, /href="\/dashboard\/kanban" data-active="true"[^>]*>.*?Kanban/);
    assert.equal((html.match(/href="\/dashboard\/kanban"/g) ?? []).length, 1);
    if (role === "TEACHER") for (const route of ["reportes", "acuerdos-seguimiento", "basecamp"]) assert.ok(html.includes(`/dashboard/${route}`));
  }
  const denied = renderToStaticMarkup(React.createElement(DashboardShell, { userEmail: "none@example.test", userRole: "PARENT", userPermissions: [] }));
  assert.doesNotMatch(denied, /href="\/dashboard\/kanban"/);
});

test("workspace loads shared boards, colored statuses, cards and internal assignees without props", async () => {
  const ui = harness(); assert.match(ui.html(), /Cargando/); await ui.ready();
  const html = ui.html();
  for (const label of ["Equipo", "Otro equipo", "Pendiente", "Hecho", "Preparar reunión", "Agenda", "Ana", "10/04/2026"]) assert.ok(html.includes(label), label);
  assert.match(html, /#334455/); assert.match(html, /draggable="true"/);
  assert.ok(ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión"));
  assert.deepEqual(ui.calls.map(([name]) => name), ["listBoards", "listAssignees", "getBoard"]);
  await ui.click("Abrir Otro equipo"); assert.deepEqual(ui.calls.at(-1), ["getBoard", "b2"]);
});

test("all creation editors use responsive dialogs with explicit Montserrat and cancel without persisting", async () => {
  const ui = harness(); await ui.ready();
  for (const label of ["Nuevo tablero", "Nueva columna", "Nueva tarjeta en Pendiente"]) {
    await ui.click(label);
    const dialog = ui.find((node) => node.props["data-slot"] === "responsive-dialog-content");
    assert.ok(dialog, `${label} must open a responsive dialog`);
    assert.match(dialog.props.className, /\[font-family:var\(--font-montserrat\)\]/);
    assert.match(dialog.props.className, /\[&amp;|\[&_\*\]/);
    const before = ui.calls.length;
    await ui.click("Cancelar");
    assert.equal(ui.calls.length, before);
    assert.equal(ui.find((node) => node.props.role === "dialog"), undefined);
  }
});

test("board create/edit and confirmed deletion use the L5 payloads; cancel never persists", async () => {
  const ui = harness(); await ui.ready(); await ui.click("Nuevo tablero");
  await ui.submit("Crear tablero", { name: "Nuevo", description: "Descripción" });
  assert.ok(ui.calls.some(([name, value]) => name === "createBoard" && value.name === "Nuevo" && value.description === "Descripción"));
  assert.deepEqual(ui.calls.at(-1), ["getBoard", "b2"]);
  await ui.click("Editar tablero"); await ui.submit("Editar tablero", { name: "Renombrado", description: "" });
  assert.ok(ui.calls.some(([name, value]) => name === "updateBoard" && value.id === "b2" && value.name === "Renombrado"));
  await ui.click("Eliminar tablero"); assert.match(ui.html(), /todas sus tarjetas/);
  const before = ui.calls.length; await ui.click("Cancelar"); assert.equal(ui.calls.length, before);
  await ui.click("Eliminar tablero"); await ui.submit("Eliminar tablero", {});
  assert.ok(ui.calls.some(([name, value]) => name === "deleteBoard" && value.id === "b2"));
});

test("statuses create/edit colors, reorder and require an explicit relocation destination", async () => {
  const ui = harness(); await ui.ready(); await ui.click("Nueva columna");
  await ui.submit("Crear columna", { name: "En curso", color: "#123456" });
  assert.ok(ui.calls.some(([name, value]) => name === "createStatus" && JSON.stringify(value) === JSON.stringify({ boardId: "b1", name: "En curso", color: "#123456" })));
  await ui.click("Editar columna Pendiente"); await ui.submit("Editar columna", { name: "Por hacer", color: "#654321" });
  assert.ok(ui.calls.some(([name, value]) => name === "updateStatus" && value.id === "s1" && value.color === "#654321"));
  assert.equal(ui.button("Mover Pendiente a la izquierda").props.disabled, true);
  await ui.click("Mover Pendiente a la derecha");
  assert.ok(ui.calls.some(([name, value]) => name === "reorderStatuses" && JSON.stringify(value.statusIds) === '["s2","s1"]'));
  await ui.click("Eliminar columna Pendiente");
  const select = ui.find((node) => node.type === "select" && node.props.name === "destinationStatusId"); assert.equal(select.props.required, true);
  const before = ui.calls.length;
  for (const destinationStatusId of ["", "s1", "another-board-status"]) {
    await ui.submit("Eliminar columna", { destinationStatusId });
    assert.equal(ui.calls.length, before); assert.match(ui.html(), /Elegí una columna de destino/);
  }
  await ui.submit("Eliminar columna", { destinationStatusId: "s2" });
  assert.ok(ui.calls.some(([name, value]) => name === "deleteStatus" && value.id === "s1" && value.destinationStatusId === "s2"));
  await ui.click("Eliminar columna Hecho"); await ui.submit("Eliminar columna", {});
  assert.ok(ui.calls.some(([name, value]) => name === "deleteStatus" && value.id === "s2" && !("destinationStatusId" in value)));
});

test("last occupied column cannot be deleted without a destination", async () => {
  const ui = harness(); const board = initialBoard(); board.statuses.pop(); ui.setBoard(board); await ui.ready();
  await ui.click("Eliminar columna Pendiente"); assert.match(ui.html(), /Creá otra columna/);
  const before = ui.calls.length; await ui.submit("Eliminar columna", {}); assert.equal(ui.calls.length, before);
});

test("cards create/edit optional assignment and ISO date defaults, delete and accessible move", async () => {
  const ui = harness(); await ui.ready(); await ui.click("Nueva tarjeta en Pendiente");
  await ui.submit("Crear tarjeta", { title: "Llamar", description: "Detalle", assigneeId: "u1", dueDate: "2026-04-11" });
  assert.deepEqual(ui.calls.find(([name]) => name === "createCard"), ["createCard", { boardId: "b1", statusId: "s1", title: "Llamar", description: "Detalle", assigneeId: "u1", dueDate: "2026-04-11" }]);
  await ui.click("Editar tarjeta Preparar reunión");
  assert.match(ui.html(), /type="date"[^>]*value="2026-04-10"/);
  await ui.submit("Editar tarjeta", { title: "Reunión", description: "", assigneeId: "", dueDate: "" });
  assert.ok(ui.calls.some(([name, value]) => name === "updateCard" && value.id === "c1" && value.assigneeId === null && value.dueDate === null));
  const move = ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión");
  await move.props.onChange({ target: { value: "s2" } });
  assert.ok(ui.calls.some(([name, value]) => name === "moveCard" && JSON.stringify(value) === JSON.stringify({ boardId: "b1", id: "c1", statusId: "s2", position: 0 })));
  await ui.click("Eliminar tarjeta Preparar reunión"); await ui.submit("Eliminar tarjeta", {});
  assert.ok(ui.calls.some(([name, value]) => name === "deleteCard" && value.id === "c1"));
});

test("drag/drop persists the destination and ignores unrelated external drops", async () => {
  const ui = harness(); await ui.ready(); const data = new Map();
  const transfer = { setData: (key, value) => data.set(key, value), getData: (key) => data.get(key) ?? "", effectAllowed: "" };
  const card = ui.find((node) => node.props.draggable === true); card.props.onDragStart({ dataTransfer: transfer });
  const target = ui.find((node) => node.props["aria-label"] === "Columna Hecho");
  await target.props.onDrop({ preventDefault() {}, dataTransfer: transfer });
  assert.ok(ui.calls.some(([name, value]) => name === "moveCard" && value.id === "c1" && value.statusId === "s2" && value.position === 0));
  const before = ui.calls.length; data.clear(); await target.props.onDrop({ preventDefault() {}, dataTransfer: transfer }); assert.equal(ui.calls.length, before);
});

test("pending mutation locks controls, does not optimistically change cards, refreshes only after persistence", async () => {
  let resolve; const ui = harness({ moveCard: () => new Promise((done) => { resolve = done; }) }); await ui.ready();
  const before = ui.calls.length;
  const select = ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión");
  const pending = select.props.onChange({ target: { value: "s2" } });
  assert.match(ui.html(), /Guardando/); assert.equal(ui.button("Nuevo tablero").props.disabled, true);
  assert.equal(ui.calls.length, before + 1); assert.equal(ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión").props.value, "s1");
  await select.props.onChange({ target: { value: "s2" } }); assert.equal(ui.calls.length, before + 1);
  resolve(); await pending; assert.ok(ui.calls.slice(before + 1).some(([name]) => name === "getBoard"));
});

test("rejected persistence preserves rendered cards, keeps the editor open, exposes the exact error, and never refreshes", async () => {
  const ui = harness({ updateCard: async () => { throw new Error("No se pudo guardar la tarjeta."); } }); await ui.ready();
  await ui.click("Editar tarjeta Preparar reunión"); const before = ui.calls.length;
  await ui.submit("Editar tarjeta", { title: "Cambio", assigneeId: "", dueDate: "" });
  assert.equal(ui.calls.length, before + 1); assert.match(ui.html(), /role="alert"[^>]*>No se pudo guardar la tarjeta\./);
  assert.match(ui.html(), /Preparar reunión/); assert.ok(ui.find((node) => node.type === "form" && node.props["aria-label"] === "Editar tarjeta"));
});

test("load failure is retryable and empty boards can be created", async () => {
  let fail = true;
  const ui = harness({ listBoards: async () => { if (fail) throw new Error("Sin conexión"); return []; } });
  await ui.ready(); assert.match(ui.html(), /Sin conexión/); fail = false; await ui.click("Reintentar");
  assert.match(ui.html(), /Todavía no hay tableros/); assert.equal(ui.button("Nuevo tablero").props.disabled, false);
});
