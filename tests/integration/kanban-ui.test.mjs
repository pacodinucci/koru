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
    FormData: class { constructor(form) { this.values = { ...form.values }; } get(key) { return this.values[key] ?? null; } },
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
      if (["./kanban-editor", "./kanban-column-menu", "./kanban-panels"].includes(id)) return load(`modules/kanban/components/${id.slice(2)}.tsx`, overrides);
      if (id.endsWith("ui/dropdown-menu")) return {
        DropdownMenu: ({ open, onOpenChange, children }) => React.Children.map(children, (child) => child?.type?.menuTrigger
          ? React.cloneElement(child, { onClick: () => onOpenChange(!open) }) : open ? child : null),
        DropdownMenuTrigger: Object.assign(({ render, children, ...props }) => React.cloneElement(render ?? React.createElement("button"), props, React.Children.toArray(children)), { menuTrigger: true }),
        DropdownMenuContent: ({ children }) => React.createElement("div", { role: "menu" }, children),
        DropdownMenuItem: ({ children, variant, ...props }) => React.createElement("button", { ...props, role: "menuitem" }, children),
        DropdownMenuSub: ({ open, onOpenChange, children }) => React.Children.map(children, (child) => child?.type?.subTrigger
          ? React.cloneElement(child, { onClick: () => onOpenChange(!open) }) : open ? child : null),
        DropdownMenuSubTrigger: Object.assign(({ children, ...props }) => React.createElement("button", props, children), { subTrigger: true }),
        DropdownMenuSubContent: pass, DropdownMenuRadioGroup: pass,
        DropdownMenuRadioItem: ({ children, value, ...props }) => React.createElement("button", { ...props, role: "menuitemradio" }, React.Children.toArray(children)),
        DropdownMenuSeparator: () => React.createElement("hr"),
      };
      if (id.endsWith("ui/responsive-dialog")) return {
        ResponsiveDialog: ({ open, onOpenChange, children }) => open ? React.createElement("div", { "data-dialog-root": true }, children, React.createElement("button", { "aria-label": "Cerrar diálogo", onClick: () => onOpenChange(false) }, "Cerrar")) : null,
        ResponsiveDialogContent: ({ children, showCloseButton, ...props }) => React.createElement("div", { ...props, role: "dialog", "data-slot": "responsive-dialog-content" }, children),
        ResponsiveDialogHeader: pass,
        ResponsiveDialogBody: ({ children, ...props }) => React.createElement("div", props, children),
        ResponsiveDialogTitle: ({ children, ...props }) => React.createElement("h2", props, children),
        ResponsiveDialogDescription: ({ children, ...props }) => React.createElement("p", props, children),
      };
      if (id.endsWith("ui/button")) return { Button: ({ variant, size, children, ...props }) => React.createElement("button", props, React.Children.toArray(children)) };
      if (id.endsWith("ui/input")) return { Input: (props) => React.createElement("input", props) };
      if (id.endsWith("ui/label")) return { Label: (props) => React.createElement("label", props) };
      return new Proxy({}, { get: () => pass });
    },
  });
  return mod.exports;
}
const initialBoard = () => ({ id: "b1", name: "Equipo", description: "Trabajo compartido", statuses: [
  { id: "s1", name: "Pendiente", color: "#334455", position: 0, archivedAt: null, trashedAt: null, holdEnabled: false, watching: false, watchers: [], cards: [
    { id: "c1", title: "Preparar reunión", description: "Agenda", assigneeId: "u1", dueDate: "2026-04-10T00:00:00.000Z", position: 0, onHold: false },
  ] },
  { id: "s2", name: "Hecho", color: "#22aa66", position: 1, archivedAt: null, trashedAt: null, holdEnabled: false, watching: false, watchers: [], cards: [] },
] });
const plain = (value) => JSON.parse(JSON.stringify(value));
function harness(options = {}) {
  let board = initialBoard(); let cursor = 0; let tree; let effects = [];
  const slots = []; const calls = []; const toasts = [];
  const actions = {};
  for (const name of ["listBoards", "getBoard", "listAssignees", "createBoard", "updateBoard", "deleteBoard", "createStatus", "updateStatus", "reorderStatuses", "deleteStatus", "createCard", "updateCard", "deleteCard", "moveCard", "setStatusWatching", "setStatusHoldEnabled", "setCardOnHold", "setStatusLifecycle", "permanentlyDeleteStatus", "listKanbanNotifications", "markKanbanNotificationRead"]) {
    actions[`${name}Action`] = async (value) => {
      calls.push([name, plain(value ?? null)]);
      if (options[name]) return options[name](value);
      if (name === "listBoards") return [{ id: "b1", name: "Equipo", description: "Trabajo compartido", cardCount: 1 }, { id: "b2", name: "Otro equipo", description: null, cardCount: 0 }];
      if (name === "getBoard") return plain({ ...board, id: value });
      if (name === "listAssignees") return [{ id: "u1", name: "Ana" }];
      if (name === "listKanbanNotifications") return [];
      if (name === "createBoard") return { id: "b2" };
      const status = board.statuses.find((status) => status.id === value?.id);
      if (name === "setStatusWatching") { status.watching = value.watching; status.watchers = value.watching ? [{ id: "u1", name: "Ana" }] : []; }
      if (name === "setStatusHoldEnabled") status.holdEnabled = value.enabled;
      if (name === "setStatusLifecycle") { status.archivedAt = value.state === "archived" ? "2026-04-10" : null; status.trashedAt = value.state === "trashed" ? "2026-04-10" : null; }
      if (name === "permanentlyDeleteStatus") board.statuses = board.statuses.filter((status) => status.id !== value.id);
      if (name === "setCardOnHold") board.statuses.flatMap((status) => status.cards).find((card) => card.id === value.id).onHold = value.onHold;
      if (name === "updateStatus") Object.assign(status, { name: value.name, color: value.color });
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
    "@/components/ui/toast": { useToast: () => ({ toast: (message, type) => toasts.push([message, type]) }) },
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
    calls, toasts,
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
  assert.deepEqual(ui.calls.map(([name]) => name), ["listBoards", "listAssignees", "listKanbanNotifications", "getBoard"]);
  await ui.click("Abrir Otro equipo"); assert.deepEqual(ui.calls.at(-1), ["getBoard", "b2"]);
});

test("all creation editors use responsive dialogs with explicit Montserrat and cancel without persisting", async () => {
  const ui = harness(); await ui.ready();
  for (const label of ["Nuevo tablero", "Nueva columna", "Agregar tarjeta"]) {
    if (label === "Agregar tarjeta") await ui.click("Opciones de Pendiente");
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

test("columns retain creation colors and rename metadata after drag ordering", async () => {
  const ui = harness(); await ui.ready(); await ui.click("Nueva columna");
  await ui.submit("Crear columna", { name: "En curso", color: "#123456" });
  assert.deepEqual(ui.calls.find(([name]) => name === "createStatus"), ["createStatus", { boardId: "b1", name: "En curso", color: "#123456" }]);
  await dragColumn(ui, "Pendiente", "Hecho");
  assert.ok(ui.calls.some(([name, value]) => name === "reorderStatuses" && JSON.stringify(value.statusIds) === '["s2","s1"]'));
  await ui.click("Opciones de Pendiente"); await ui.click("Cambiar nombre");
  await ui.submit("Cambiar nombre de columna", { name: "Por hacer" });
  assert.deepEqual(ui.calls.find(([name]) => name === "updateStatus"), ["updateStatus", { boardId: "b1", id: "s1", name: "Por hacer", color: "#334455" }]);
  assert.match(ui.html(), /Por hacer/); assert.match(ui.html(), /Preparar reunión/);
});

test("cards create/edit optional assignment and ISO date defaults, delete and accessible move", async () => {
  const ui = harness(); await ui.ready(); await ui.click("Opciones de Pendiente"); await ui.click("Agregar tarjeta");
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
  const card = ui.find((node) => node.type === "article" && node.props.draggable === true); card.props.onDragStart({ dataTransfer: transfer });
  const target = ui.find((node) => node.props["aria-label"] === "Columna Hecho");
  await target.props.onDrop({ preventDefault() {}, dataTransfer: transfer });
  assert.ok(ui.calls.some(([name, value]) => name === "moveCard" && value.id === "c1" && value.statusId === "s2" && value.position === 0));
  const before = ui.calls.length; data.clear(); await target.props.onDrop({ preventDefault() {}, dataTransfer: transfer }); assert.equal(ui.calls.length, before);
});

test("drop moves immediately, keeps controls enabled during refresh, and ignores the same destination", async () => {
  let resolveMove, resolveRefresh;
  let reads = 0;
  const board = initialBoard();
  const saved = initialBoard();
  saved.statuses[1].cards.push(...saved.statuses[0].cards);
  saved.statuses[0].cards = [];
  const ui = harness({
    moveCard: () => new Promise((done) => { resolveMove = done; }),
    getBoard: () => ++reads === 1 ? board : new Promise((done) => { resolveRefresh = done; }),
  });
  await ui.ready();
  const before = ui.calls.length;
  const select = ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión");
  const target = ui.find((node) => node.props["aria-label"] === "Columna Hecho");
  const pending = target.props.onDrop({ preventDefault() {}, dataTransfer: { getData: () => "c1" } });
  const assertMoved = () => {
    assert.equal(ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión").props.value, "s2");
    assert.match(ui.html(), /Pendiente <span[^>]*>\(0\)/);
    assert.match(ui.html(), /Hecho <span[^>]*>\(1\)/);
    assert.equal((ui.html().match(/<h4[^>]*>Preparar reunión<\/h4>/g) ?? []).length, 1);
  };
  assertMoved();
  assert.doesNotMatch(ui.html(), /Guardando/);
  assert.ok(ui.toasts.some(([message, type]) => message === "Guardando…" && type === "info"));
  assert.equal(ui.button("Nuevo tablero").props.disabled, false);
  assert.equal(ui.calls.length, before + 1);
  assert.deepEqual(ui.calls.at(-1), ["moveCard", { boardId: "b1", id: "c1", statusId: "s2", position: 0 }]);
  await select.props.onChange({ target: { value: "s2" } });
  assert.equal(ui.calls.length, before + 1);
  resolveMove();
  for (let i = 0; i < 12; i++) await Promise.resolve();
  assert.equal(reads, 2);
  assertMoved();
  resolveRefresh(saved); await pending;
  assertMoved();
  assert.ok(ui.toasts.some(([message, type]) => message === "Cambios guardados." && type === "success"));
  assert.equal(ui.button("Nuevo tablero").props.disabled, false);
  assert.equal(board.statuses[0].cards.length, 1);
  assert.equal(board.statuses[1].cards.length, 0);
});

test("accessible move appends immediately and a rejected write restores exact card order and counts", async () => {
  let reject;
  const ui = harness({ moveCard: () => new Promise((_, fail) => { reject = fail; }) });
  const board = initialBoard();
  board.statuses[0].cards.push({ ...board.statuses[0].cards[0], id: "c2", title: "Segunda tarea", position: 1 });
  board.statuses[1].cards.push({ ...board.statuses[0].cards[0], id: "c3", title: "Terminada", position: 0 });
  ui.setBoard(board); await ui.ready();
  const before = ui.html();
  const calls = ui.calls.length;
  const select = ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión");
  const pending = select.props.onChange({ target: { value: "s2" } });
  assert.equal(ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión").props.value, "s2");
  const html = ui.html();
  assert.match(html, /Pendiente <span[^>]*>\(1\)/);
  assert.match(html, /Hecho <span[^>]*>\(2\)/);
  assert.ok(html.indexOf(">Terminada</h4>") < html.indexOf(">Preparar reunión</h4>"));
  assert.deepEqual(ui.calls.at(-1), ["moveCard", { boardId: "b1", id: "c1", statusId: "s2", position: 1 }]);
  reject(new Error("No se pudo mover la tarjeta.")); await pending;
  assert.equal(ui.calls.length, calls + 1);
  assert.match(ui.html(), /role="alert"[^>]*>No se pudo mover la tarjeta\./);
  const boardMarkup = (html) => html.slice(html.indexOf('<section aria-label="Tablero Equipo"'));
  assert.equal(boardMarkup(ui.html()), boardMarkup(before));
  assert.equal(ui.button("Nuevo tablero").props.disabled, false);
});

test("confirmed move is not rolled back when refreshing fails and retry only reads", async () => {
  let failRead = false;
  const saved = initialBoard();
  saved.statuses[1].cards.push(...saved.statuses[0].cards);
  saved.statuses[0].cards = [];
  const ui = harness({
    moveCard: async () => { failRead = true; },
    getBoard: async () => { if (failRead) throw new Error("Sin conexión"); return saved; },
  });
  saved.statuses[0].cards.push(...saved.statuses[1].cards);
  saved.statuses[1].cards = [];
  await ui.ready();
  await ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión").props.onChange({ target: { value: "s2" } });
  assert.equal(ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión").props.value, "s2");
  assert.match(ui.html(), /Los cambios se guardaron, pero no pudimos actualizar la vista/);
  saved.statuses[1].cards.push(...saved.statuses[0].cards);
  saved.statuses[0].cards = [];
  failRead = false; await ui.click("Reintentar");
  assert.equal(ui.calls.filter(([name]) => name === "moveCard").length, 1);
  assert.equal(ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión").props.value, "s2");
});

test("card editing still waits for persistence before changing rendered content", async () => {
  let resolve;
  const ui = harness({ updateCard: () => new Promise((done) => { resolve = done; }) });
  await ui.ready(); await ui.click("Editar tarjeta Preparar reunión");
  const before = ui.calls.length;
  const pending = ui.submit("Editar tarjeta", { title: "Cambio", assigneeId: "", dueDate: "" });
  assert.match(ui.html(), /<h4[^>]*>Preparar reunión<\/h4>/);
  assert.doesNotMatch(ui.html(), /Guardando/);
  assert.ok(ui.toasts.some(([message, type]) => message === "Guardando…" && type === "info"));
  assert.equal(ui.button("Nuevo tablero").props.disabled, false);
  assert.equal(ui.calls.length, before + 1);
  resolve(); await pending;
  assert.ok(ui.calls.slice(before + 1).some(([name]) => name === "getBoard"));
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

const flushQueue = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
const moveSelect = (ui) => ui.find((node) => node.type === "select" && node.props["aria-label"] === "Mover Preparar reunión");

test("New column click queues behind a move without freezing any workspace controls", async () => {
  let finish;
  const ui = harness({ moveCard: () => new Promise((done) => { finish = done; }) });
  await ui.ready();
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  for (const label of ["Nueva columna", "Actualizar", "Abrir Otro equipo", "Editar tablero", "Eliminar tablero"]) {
    assert.equal(ui.button(label).props.disabled, false, label);
  }
  assert.equal(ui.find((node) => node.type === "article").props.draggable, true);
  assert.equal(moveSelect(ui).props.disabled, false);
  const opening = ui.click("Nueva columna");
  assert.equal(ui.find((node) => node.type === "form" && node.props["aria-label"] === "Crear columna"), undefined);
  assert.ok(ui.toasts.some(([message, type]) => message === "Guardando…" && type === "info"));
  finish(); await moving; await opening;
  assert.ok(ui.find((node) => node.type === "form" && node.props["aria-label"] === "Crear columna"));
  assert.equal(ui.calls.filter(([name]) => name === "moveCard").length, 1);
});

test("consecutive moves render immediately and persist FIFO without stale refresh undoing the latest drop", async () => {
  const finishes = [];
  let stored = initialBoard();
  const ui = harness({
    getBoard: () => plain(stored),
    moveCard: (input) => new Promise((done) => { finishes.push(() => {
      const card = stored.statuses.flatMap((status) => status.cards).find((card) => card.id === input.id);
      stored.statuses.forEach((status) => { status.cards = status.cards.filter((card) => card.id !== input.id); });
      stored.statuses.find((status) => status.id === input.statusId).cards.push({ ...card, position: input.position });
      done();
    }); }),
  });
  await ui.ready();
  const first = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const second = moveSelect(ui).props.onChange({ target: { value: "s1" } });
  assert.equal(moveSelect(ui).props.value, "s1");
  assert.equal(ui.calls.filter(([name]) => name === "moveCard").length, 1);
  finishes[0](); await first; await flushQueue();
  assert.equal(moveSelect(ui).props.value, "s1");
  assert.equal(ui.calls.filter(([name]) => name === "moveCard").length, 2);
  assert.deepEqual(ui.calls.filter(([name]) => name === "moveCard").map(([, input]) => input.statusId), ["s2", "s1"]);
  finishes[1](); await second;
  assert.equal(moveSelect(ui).props.value, "s1");
  assert.equal((ui.html().match(/<h4[^>]*>Preparar reunión<\/h4>/g) ?? []).length, 1);
});

test("a failed move rolls back and still executes the next queued button, preserving the error", async () => {
  let fail;
  const ui = harness({ moveCard: () => new Promise((_, reject) => { fail = reject; }) });
  await ui.ready();
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const opening = ui.click("Nueva columna");
  fail(new Error("Movimiento rechazado")); await moving; await opening;
  assert.equal(moveSelect(ui).props.value, "s1");
  assert.ok(ui.find((node) => node.type === "form" && node.props["aria-label"] === "Crear columna"));
  assert.match(ui.html(), /Movimiento rechazado/);
  assert.equal(ui.calls.filter(([name]) => name === "getBoard").length, 1);
});

test("queued navigation precedes an old-board editor click and never opens it against the new board", async () => {
  let finish;
  const ui = harness({ moveCard: () => new Promise((done) => { finish = done; }) });
  await ui.ready();
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const navigating = ui.click("Abrir Otro equipo");
  const opening = ui.click("Nueva columna");
  finish(); await moving; await navigating; await opening;
  assert.deepEqual(ui.calls.at(-1), ["getBoard", "b2"]);
  assert.equal(ui.find((node) => node.type === "form" && node.props["aria-label"] === "Crear columna"), undefined);
  assert.match(ui.html(), /role="alert"/);
});

test("queued editor resolves fresh card data after a move rather than its old column", async () => {
  let finish;
  const stored = initialBoard();
  const ui = harness({ getBoard: () => plain(stored), moveCard: () => new Promise((done) => { finish = () => {
    stored.statuses[1].cards.push(...stored.statuses[0].cards);
    stored.statuses[0].cards = [];
    stored.statuses[1].cards[0].title = "Título actualizado";
    done();
  }; }) });
  await ui.ready();
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const opening = ui.click("Editar tarjeta Preparar reunión");
  finish(); await moving; await opening;
  const title = ui.find((node) => node.type === "input" && node.props.name === "title");
  assert.equal(title.props.defaultValue, "Título actualizado");
});

test("cancel queues behind a submitted form and repeated submit does not duplicate creation", async () => {
  let finish;
  const ui = harness({ createStatus: () => new Promise((done) => { finish = done; }) });
  await ui.ready(); await ui.click("Nueva columna");
  const submitting = ui.submit("Crear columna", { name: "En curso", color: "#123456" });
  assert.equal(ui.button("Cancelar").props.disabled, false);
  assert.equal(ui.button("Guardar").props.disabled, false);
  await ui.submit("Crear columna", { name: "En curso", color: "#123456" });
  const cancelling = ui.click("Cancelar");
  assert.ok(ui.find((node) => node.type === "form" && node.props["aria-label"] === "Crear columna"));
  finish(); await submitting; await cancelling;
  assert.equal(ui.calls.filter(([name]) => name === "createStatus").length, 1);
  assert.equal(ui.find((node) => node.type === "form" && node.props["aria-label"] === "Crear columna"), undefined);
});

const menu = async (ui, name = "Pendiente") => ui.click(`Opciones de ${name}`);
const mutations = (ui) => ui.calls.filter(([name]) => !["listBoards", "getBoard", "listAssignees", "listKanbanNotifications"].includes(name));

test("three-dot menu exposes all seven options and palette selection including no color", async () => {
  const ui = harness(); await ui.ready();
  assert.equal(ui.find((node) => node.props.role === "menu"), undefined);
  await menu(ui);
  for (const label of ["Seguir esta columna", "Color de la columna", "Agregar tarjeta", "Habilitar tareas en espera", "Cambiar nombre", "Archivar columna", "Mover a la papelera"]) ui.button(label);
  await ui.click("Color de la columna"); await ui.click("Sin color");
  assert.deepEqual(mutations(ui).at(-1), ["updateStatus", { boardId: "b1", id: "s1", name: "Pendiente", color: "" }]);
  await menu(ui); await ui.click("Color de la columna");
  assert.equal(ui.button("Sin color").props["aria-checked"], true);
  await ui.click("Azul");
  await menu(ui); await ui.click("Color de la columna");
  assert.equal(ui.button("Azul").props["aria-checked"], true);
  assert.equal(ui.button("Sin color").props["aria-checked"], false);
  const column = ui.find((node) => node.props["aria-label"] === "Columna Pendiente");
  assert.equal(column.props.style.borderTopColor, "#3b82f6");
  assert.ok(column.props.style.backgroundColor);
  await ui.click("Agregar tarjeta");
  assert.ok(ui.find((node) => node.props.role === "dialog"));
  await ui.submit("Crear tarjeta", { title: "En su columna" });
  assert.equal(mutations(ui).at(-1)[1].statusId, "s1");
});

test("personal follow toggles and displays followers without client identity", async () => {
  const ui = harness(); await ui.ready(); await menu(ui); await ui.click("Seguir esta columna");
  assert.deepEqual(mutations(ui).at(-1), ["setStatusWatching", { boardId: "b1", id: "s1", watching: true }]);
  assert.match(ui.html(), /Seguidores: Ana/);
  await menu(ui); await ui.click("Dejar de seguir esta columna");
  assert.deepEqual(mutations(ui).at(-1), ["setStatusWatching", { boardId: "b1", id: "s1", watching: false }]);
  assert.doesNotMatch(ui.html(), /Seguidores: Ana/);
});

test("enabling hold does not pause all cards and card toggles preserve metadata", async () => {
  const ui = harness(); await ui.ready(); await menu(ui); await ui.click("Habilitar tareas en espera");
  assert.deepEqual(mutations(ui), [["setStatusHoldEnabled", { boardId: "b1", id: "s1", enabled: true }]]);
  assert.doesNotMatch(ui.html(), /<span[^>]*>En espera<\/span>/);
  await ui.click("Poner en espera Preparar reunión");
  assert.deepEqual(mutations(ui).at(-1), ["setCardOnHold", { boardId: "b1", id: "c1", onHold: true }]);
  assert.match(ui.html(), /<span[^>]*>En espera<\/span>/);
  for (const text of ["Preparar reunión", "Agenda", "Ana", "10/04/2026"]) assert.ok(ui.html().includes(text));
  assert.equal(moveSelect(ui).props.value, "s1");
  await ui.click("Quitar espera de Preparar reunión");
  assert.deepEqual(mutations(ui).at(-1), ["setCardOnHold", { boardId: "b1", id: "c1", onHold: false }]);
});

test("archive and trash hide cards, exclude move targets and restore settings; permanent deletion is separate and confirmed", async () => {
  const ui = harness(); await ui.ready(); await menu(ui); await ui.click("Habilitar tareas en espera");
  await ui.click("Poner en espera Preparar reunión");
  await menu(ui); await ui.click("Archivar columna");
  assert.deepEqual(mutations(ui).at(-1), ["setStatusLifecycle", { boardId: "b1", id: "s1", state: "archived" }]);
  assert.equal(ui.find((node) => node.props["aria-label"] === "Columna Pendiente"), undefined);
  assert.doesNotMatch(ui.html(), /Preparar reunión/);
  await ui.click("Archivados"); await ui.click("Restaurar Pendiente");
  assert.equal(moveSelect(ui).props.value, "s1"); assert.match(ui.html(), /En espera/); assert.match(ui.html(), /#334455/);
  await menu(ui); await ui.click("Mover a la papelera");
  assert.match(ui.find((node) => node.props.role === "dialog").props.className, /montserrat/);
  const before = mutations(ui).length; await ui.click("Cancelar"); assert.equal(mutations(ui).length, before);
  await menu(ui); await ui.click("Mover a la papelera"); await ui.submit("Mover columna a la papelera", {});
  assert.deepEqual(mutations(ui).at(-1), ["setStatusLifecycle", { boardId: "b1", id: "s1", state: "trashed" }]);
  assert.equal(moveSelect(ui), undefined);
  await ui.click("Papelera"); await ui.click("Restaurar Pendiente");
  assert.equal(moveSelect(ui).props.value, "s1"); assert.match(ui.html(), /Agenda/); assert.match(ui.html(), /10\/04\/2026/);
  await menu(ui); await ui.click("Mover a la papelera"); await ui.submit("Mover columna a la papelera", {});
  await ui.click("Papelera"); await ui.click("Eliminar definitivamente Pendiente");
  assert.match(ui.html(), /no se puede deshacer/); await ui.click("Cancelar");
  assert.equal(mutations(ui).filter(([name]) => name === "permanentlyDeleteStatus").length, 0);
  await ui.click("Eliminar definitivamente Pendiente"); await ui.submit("Eliminar columna definitivamente", {});
  assert.deepEqual(mutations(ui).at(-1), ["permanentlyDeleteStatus", { boardId: "b1", id: "s1" }]);
  assert.doesNotMatch(ui.html(), /Restaurar Pendiente/);
  assert.equal(mutations(ui).filter(([name]) => name === "deleteStatus").length, 0);
});

test("initial archived and trashed columns never appear as move targets or normal columns", async () => {
  const ui = harness(); const board = initialBoard();
  board.statuses.push({ ...board.statuses[1], id: "s3", name: "Archivo", archivedAt: "2026-01-01" });
  board.statuses.push({ ...board.statuses[1], id: "s4", name: "Basura", trashedAt: "2026-01-01" });
  ui.setBoard(board); await ui.ready();
  const select = moveSelect(ui);
  assert.doesNotMatch(renderToStaticMarkup(select), /Archivo|Basura/);
  assert.equal(ui.find((node) => node.props["aria-label"] === "Columna Archivo"), undefined);
  const before = mutations(ui).length;
  await select.props.onChange({ target: { value: "s3" } });
  await select.props.onChange({ target: { value: "s4" } });
  assert.equal(mutations(ui).length, before); assert.equal(moveSelect(ui).props.value, "s1");
});

test("persistent personal notifications display unread count and mark read using only notification id", async () => {
  const notices = [{ id: "n1", boardId: "deleted-board", statusId: "deleted-column", cardId: "deleted-card", message: "Se agregó una tarjeta en Pendiente", createdAt: "2026-04-10T00:00:00.000Z", readAt: null }];
  const ui = harness({ listKanbanNotifications: () => plain(notices), markKanbanNotificationRead: ({ id }) => { notices.find((notice) => notice.id === id).readAt = "2026-04-10T01:00:00.000Z"; } });
  await ui.ready(); await ui.click("Mis avisos (1 sin leer)");
  assert.match(ui.html(), /Se agregó una tarjeta en Pendiente/); assert.match(ui.html(), /Sin leer/);
  await ui.click("Marcar aviso como leído");
  assert.deepEqual(mutations(ui).at(-1), ["markKanbanNotificationRead", { id: "n1" }]);
  ui.button("Mis avisos (0 sin leer)"); assert.match(ui.html(), /Leído/);
});

test("queued follow and hold toggles resolve latest state instead of overwriting repeated clicks", async () => {
  let finish;
  const ui = harness({ moveCard: () => new Promise((done) => { finish = done; }) });
  await ui.ready(); await menu(ui);
  const follow = ui.button("Seguir esta columna"); const hold = ui.button("Habilitar tareas en espera");
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const clicks = [follow.props.onClick(), follow.props.onClick(), hold.props.onClick(), hold.props.onClick()];
  assert.equal(mutations(ui).length, 1); finish(); await moving; await Promise.all(clicks);
  assert.deepEqual(mutations(ui).filter(([name]) => name === "setStatusWatching").map(([, input]) => input.watching), [true, false]);
  assert.deepEqual(mutations(ui).filter(([name]) => name === "setStatusHoldEnabled").map(([, input]) => input.enabled), [true, false]);
});

test("queued old-board menu and color clicks reject stale entities without writes", async () => {
  let finish;
  const ui = harness({ moveCard: () => new Promise((done) => { finish = done; }) });
  await ui.ready(); await menu(ui);
  await ui.click("Color de la columna");
  const follow = ui.button("Seguir esta columna"); const color = ui.button("Sin color");
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const navigating = ui.click("Abrir Otro equipo");
  const stale = [follow.props.onClick(), color.props.onClick()];
  finish(); await moving; await navigating; await Promise.all(stale);
  assert.equal(mutations(ui).length, 1); assert.match(ui.html(), /El tablero cambió/);
});

test("queued archive invalidates late card editor, menu mutation and move without changing hidden data", async () => {
  let finish;
  const stored = initialBoard();
  const ui = harness({ getBoard: () => plain(stored), setStatusLifecycle: (input) => new Promise((done) => { finish = () => { stored.statuses[0].archivedAt = "2026-04-10"; done(); }; }) });
  await ui.ready(); await menu(ui);
  const follow = ui.button("Seguir esta columna"); const edit = ui.button("Editar tarjeta Preparar reunión"); const move = moveSelect(ui);
  const archive = ui.click("Archivar columna");
  const late = [follow.props.onClick(), edit.props.onClick(), move.props.onChange({ target: { value: "s2" } })];
  finish(); await archive; await Promise.all(late);
  assert.deepEqual(mutations(ui), [["setStatusLifecycle", { boardId: "b1", id: "s1", state: "archived" }]]);
  assert.equal(ui.find((node) => node.props["aria-label"] === "Editar tarjeta"), undefined);
  assert.match(ui.html(), /ya no está disponible|ya no están disponibles/);
  await ui.click("Archivados");
  assert.match(ui.html(), /1 tarjeta/);
});

test("legacy DTOs default to active, not followed and no hold without crashing", async () => {
  const ui = harness(); const board = initialBoard();
  for (const status of board.statuses) {
    for (const field of ["archivedAt", "trashedAt", "watching", "watchers", "holdEnabled"]) delete status[field];
    status.cards.forEach((card) => { delete card.onHold; });
  }
  ui.setBoard(board); await ui.ready(); await menu(ui);
  ui.button("Seguir esta columna"); ui.button("Habilitar tareas en espera");
  assert.match(ui.html(), /Seguidores: Nadie todavía/); assert.ok(moveSelect(ui));
});

test("active reorder omits archived and trashed columns from the backend permutation", async () => {
  const ui = harness(); const board = initialBoard();
  board.statuses[1].position = 3;
  board.statuses.push({ ...board.statuses[1], id: "s3", name: "Archivo", position: 1, archivedAt: "2026-01-01" });
  board.statuses.push({ ...board.statuses[1], id: "s4", name: "Basura", position: 2, trashedAt: "2026-01-01" });
  ui.setBoard(board); await ui.ready(); await dragColumn(ui, "Pendiente", "Hecho");
  assert.deepEqual(mutations(ui), [["reorderStatuses", { boardId: "b1", statusIds: ["s2", "s1"] }]]);
});

test("queued palette reads fresh name and rename preserves the latest queued color", async () => {
  let finish; const stored = initialBoard();
  const ui = harness({ getBoard: () => plain(stored), moveCard: () => new Promise((done) => { finish = () => { stored.statuses[0].name = "Nombre actualizado"; done(); }; }),
    updateStatus: (input) => Object.assign(stored.statuses[0], { name: input.name, color: input.color }),
  });
  await ui.ready(); await menu(ui);
  await ui.click("Color de la columna");
  const color = ui.button("Azul"); const rename = ui.button("Cambiar nombre");
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const coloring = color.props.onClick(); const renaming = rename.props.onClick();
  finish(); await moving; await coloring; await renaming;
  assert.deepEqual(mutations(ui).at(-1), ["updateStatus", { boardId: "b1", id: "s1", name: "Nombre actualizado", color: "#3b82f6" }]);
  await ui.submit("Cambiar nombre de columna", { name: "Nombre final", color: "stale color" });
  assert.deepEqual(mutations(ui).at(-1), ["updateStatus", { boardId: "b1", id: "s1", name: "Nombre final", color: "#3b82f6" }]);
  assert.match(ui.html(), /Nombre final/);
});

test("repeated card hold clicks toggle fresh state and disabled column hold still allows clearing a mark", async () => {
  let finish;
  const ui = harness({ moveCard: () => new Promise((done) => { finish = done; }) });
  await ui.ready(); await menu(ui); await ui.click("Habilitar tareas en espera");
  const hold = ui.button("Poner en espera Preparar reunión");
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const clicks = [hold.props.onClick(), hold.props.onClick()];
  finish(); await moving; await Promise.all(clicks);
  assert.deepEqual(mutations(ui).filter(([name]) => name === "setCardOnHold").map(([, input]) => input.onHold), [true, false]);
  await ui.click("Poner en espera Preparar reunión");
  await menu(ui); await ui.click("Deshabilitar tareas en espera");
  assert.match(ui.html(), /<span[^>]*>En espera<\/span>/);
  await ui.click("Quitar espera de Preparar reunión");
  assert.doesNotMatch(ui.html(), /<span[^>]*>En espera<\/span>/);
  assert.equal(ui.find((node) => node.props["aria-label"] === "Poner en espera Preparar reunión"), undefined);
});

test("restoring before a queued permanent confirmation prevents deletion of the now-active column", async () => {
  let finish; const ui = harness({ moveCard: () => new Promise((done) => { finish = done; }) });
  const board = initialBoard(); board.statuses[1].trashedAt = "2026-04-10";
  board.statuses.push({ ...board.statuses[1], id: "s3", name: "Activa", trashedAt: null });
  ui.setBoard(board); await ui.ready(); await ui.click("Papelera");
  const restore = ui.button("Restaurar Hecho");
  await ui.click("Eliminar definitivamente Hecho");
  const moving = moveSelect(ui).props.onChange({ target: { value: "s3" } });
  const restoring = restore.props.onClick(); const confirming = ui.submit("Eliminar columna definitivamente", {});
  finish(); await moving; await restoring; await confirming;
  assert.equal(mutations(ui).filter(([name]) => name === "permanentlyDeleteStatus").length, 0);
  assert.match(ui.html(), /ya no está disponible para esta acción/);
  assert.ok(ui.find((node) => node.props["aria-label"] === "Columna Hecho"));
});

test("queue rejects disappeared cards and late recovery events after navigation without writes", async () => {
  let finish; const stored = initialBoard(); stored.statuses[1].trashedAt = "2026-04-10";
  const ui = harness({ getBoard: (id) => plain({ ...stored, id }), updateBoard: () => new Promise((done) => { finish = () => { stored.statuses[0].cards = []; done(); }; }) });
  await ui.ready(); await ui.click("Papelera");
  const restore = ui.button("Restaurar Hecho"); const cardEdit = ui.button("Editar tarjeta Preparar reunión");
  await ui.click("Editar tablero");
  const saving = ui.submit("Editar tablero", { name: "Equipo" });
  const editing = cardEdit.props.onClick(); const navigating = ui.click("Abrir Otro equipo"); const restoring = restore.props.onClick();
  finish(); await saving; await editing; await navigating; await restoring;
  assert.deepEqual(mutations(ui), [["updateBoard", { id: "b1", name: "Equipo", description: "" }]]);
  assert.match(ui.html(), /La tarjeta ya no está disponible/); assert.match(ui.html(), /El tablero cambió/);
});

test("notification reads are idempotent across queued double clicks and reject a disappeared personal notice", async () => {
  let finish; let notices = [{ id: "n1", boardId: "b1", statusId: "s1", cardId: null, message: "Aviso personal", createdAt: "2026-04-10", readAt: null }];
  const ui = harness({ listKanbanNotifications: () => plain(notices), markKanbanNotificationRead: () => { notices[0].readAt = "2026-04-10"; }, moveCard: () => new Promise((done) => { finish = done; }) });
  await ui.ready(); await ui.click("Mis avisos (1 sin leer)"); const read = ui.button("Marcar aviso como leído");
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const reads = [read.props.onClick(), read.props.onClick()]; finish(); await moving; await Promise.all(reads);
  assert.equal(mutations(ui).filter(([name]) => name === "markKanbanNotificationRead").length, 1);
  notices = []; await ui.click("Actualizar");
  const before = mutations(ui).length; await read.props.onClick();
  assert.equal(mutations(ui).length, before); assert.match(ui.html(), /El aviso ya no está disponible/);
});

test("a submitted form snapshots values and an old form cannot submit or cancel a newer editor", async () => {
  let finish; const ui = harness({ moveCard: () => new Promise((done) => { finish = done; }) });
  await ui.ready(); await ui.click("Nueva columna");
  const oldForm = ui.find((node) => node.type === "form"); const oldCancel = ui.button("Cancelar");
  const values = { name: "Capturado", color: "#123456" };
  const moving = moveSelect(ui).props.onChange({ target: { value: "s2" } });
  const submitting = oldForm.props.onSubmit({ preventDefault() {}, currentTarget: { values } });
  values.name = "Modificado después";
  finish(); await moving; await submitting;
  assert.deepEqual(mutations(ui).at(-1), ["createStatus", { boardId: "b1", name: "Capturado", color: "#123456" }]);
  await ui.click("Nuevo tablero"); const before = mutations(ui).length;
  await oldForm.props.onSubmit({ preventDefault() {}, currentTarget: { values } }); await oldCancel.props.onClick();
  assert.equal(mutations(ui).length, before); assert.ok(ui.find((node) => node.props["aria-label"] === "Crear tablero"));
});

test("queued navigation to a removed board rejects instead of silently selecting another board", async () => {
  let finish; let boards = [{ id: "b1", name: "Equipo", cardCount: 1 }, { id: "b2", name: "Otro equipo", cardCount: 0 }];
  const ui = harness({ listBoards: () => plain(boards), updateBoard: () => new Promise((done) => { finish = () => { boards = boards.slice(0, 1); done(); }; }) });
  await ui.ready(); await ui.click("Editar tablero");
  const saving = ui.submit("Editar tablero", { name: "Equipo" }); const navigating = ui.click("Abrir Otro equipo");
  finish(); await saving; await navigating;
  assert.match(ui.html(), /El tablero ya no está disponible/);
  assert.equal(ui.calls.filter(([name, id]) => name === "getBoard" && id === "b2").length, 0);
  assert.ok(ui.find((node) => node.props["aria-label"] === "Tablero Equipo"));
});

test("compact cards keep metadata visible, collapse secondary controls and omit column add buttons", async () => {
  const ui = harness(); await ui.ready();
  const card = ui.find((node) => node.type === "article");
  assert.match(card.props.className, /p-2/);
  assert.doesNotMatch(card.props.className, /space-y-3/);
  const details = ui.find((node) => node.type === "details" && node.props["aria-label"] === "Opciones de Preparar reunión");
  assert.ok(details);
  assert.notEqual(details.props.open, true);
  assert.ok(ui.find((node) => node.type === "summary" && node.props["aria-label"] === "Opciones de Preparar reunión"));
  assert.doesNotMatch(ui.html(), /Nueva tarjeta/);
  const column = ui.find((node) => node.type === "section" && node.props["aria-label"] === "Columna Pendiente");
  assert.match(column.props.className, /p-2/);
  assert.doesNotMatch(column.props.className, /min-h-/);
  await ui.click("Opciones de Hecho"); await ui.click("Agregar tarjeta");
  await ui.submit("Crear tarjeta", { title: "Nueva tarea", description: "", assigneeId: "", dueDate: "" });
  assert.deepEqual(ui.calls.find(([name]) => name === "createCard"), ["createCard", { boardId: "b1", statusId: "s2", title: "Nueva tarea", description: "", assigneeId: null, dueDate: null }]);
});

function startCardDrag(ui) {
  const values = new Map();
  const transfer = { setData: (key, value) => values.set(key, value), getData: (key) => values.get(key) ?? "", effectAllowed: "", dropEffect: "" };
  ui.find((node) => node.type === "article").props.onDragStart({ dataTransfer: transfer });
  return transfer;
}

test("internal drag previews a lifted card in the destination without moving data or counts", async () => {
  const ui = harness(); await ui.ready();
  const before = ui.calls.length;
  const transfer = startCardDrag(ui);
  assert.equal(transfer.effectAllowed, "move");
  await ui.find((node) => node.props["aria-label"] === "Columna Hecho").props.onDragOver({ preventDefault() {}, dataTransfer: transfer });
  const preview = ui.find((node) => node.props["data-kanban-drop-preview"] === true);
  assert.ok(preview);
  assert.equal(preview.props["aria-hidden"], true);
  assert.equal(preview.props.className.includes("pointer-events-none"), true);
  assert.match(ui.html(), /shadow-lg/);
  assert.match(ui.html(), /-translate-y-1/);
  assert.match(ui.html(), /border-dashed/);
  assert.match(ui.html(), /Pendiente <span[^>]*>\(1\)/);
  assert.match(ui.html(), /Hecho <span[^>]*>\(0\)/);
  assert.equal(ui.calls.length, before);
  assert.equal(ui.find((node) => node.props["aria-label"] === "Mover Preparar reunión").props.value, "s1");
  assert.equal(transfer.dropEffect, "move");
  const target = ui.find((node) => node.props["aria-label"] === "Columna Hecho");
  target.props.onDragLeave({ currentTarget: { contains: () => true }, relatedTarget: {} });
  assert.ok(ui.find((node) => node.props["data-kanban-drop-preview"]));
  target.props.onDragLeave({ currentTarget: { contains: () => false }, relatedTarget: null });
  assert.equal(ui.find((node) => node.props["data-kanban-drop-preview"]), undefined);
  await ui.find((node) => node.props["aria-label"] === "Columna Hecho").props.onDragOver({ preventDefault() {}, dataTransfer: transfer });
  await ui.find((node) => node.props["aria-label"] === "Columna Pendiente").props.onDragOver({ preventDefault() {}, dataTransfer: transfer });
  assert.equal(ui.find((node) => node.props["data-kanban-drop-preview"]), undefined);
  ui.find((node) => node.type === "article").props.onDragEnd();
  assert.equal(ui.calls.length, before);
});

test("cancelled drag removes all preview styling and external drag never creates a preview", async () => {
  const ui = harness(); await ui.ready();
  const before = ui.html(); const calls = ui.calls.length;
  const transfer = startCardDrag(ui);
  ui.find((node) => node.props["aria-label"] === "Columna Hecho").props.onDragOver({ preventDefault() {}, dataTransfer: transfer });
  ui.find((node) => node.type === "article").props.onDragEnd();
  assert.equal(ui.html(), before);
  const external = { getData: () => "", dropEffect: "" };
  ui.find((node) => node.props["aria-label"] === "Columna Hecho").props.onDragOver({ preventDefault() {}, dataTransfer: external });
  assert.equal(ui.find((node) => node.props["data-kanban-drop-preview"]), undefined);
  assert.equal(ui.calls.length, calls);
});

test("dropping clears the preview immediately and persists exactly one optimistic move", async () => {
  let finish;
  const ui = harness({ moveCard: () => new Promise((resolve) => { finish = resolve; }) }); await ui.ready();
  const transfer = startCardDrag(ui);
  ui.find((node) => node.props["aria-label"] === "Columna Hecho").props.onDragOver({ preventDefault() {}, dataTransfer: transfer });
  const pending = ui.find((node) => node.props["aria-label"] === "Columna Hecho").props.onDrop({ preventDefault() {}, dataTransfer: transfer });
  assert.equal(ui.find((node) => node.props["data-kanban-drop-preview"]), undefined);
  assert.equal(ui.find((node) => node.props["aria-label"] === "Mover Preparar reunión").props.value, "s2");
  assert.deepEqual(ui.calls.filter(([name]) => name === "moveCard"), [["moveCard", { boardId: "b1", id: "c1", statusId: "s2", position: 0 }]]);
  finish(); await pending;
});

test("empty columns show a compact dashed slot with screen-reader-only text and retain drag preview", async () => {
  const ui = harness(); await ui.ready();
  const emptyMarkup = () => renderToStaticMarkup(ui.find((node) => node.props["aria-label"] === "Columna Hecho"));
  assert.doesNotMatch(emptyMarkup(), /\bh-16\b/);
  assert.match(emptyMarkup(), /class="relative rounded p-2"/);
  assert.match(emptyMarkup(), /class="[^"]*absolute inset-0[^"]*border-dashed/);
  assert.match(emptyMarkup(), /aria-hidden="true" class="block h-5"/);
  assert.match(emptyMarkup(), /aria-hidden="true" class="mt-0.5 block h-4"/);
  const card = ui.find((node) => node.type === "article");
  assert.match(card.props.className, /\bp-2\b/);
  const title = ui.find((node) => node.type === "h4");
  assert.match(title.props.className, /\bleading-5\b/);
  assert.match(renderToStaticMarkup(card), /mt-0.5[^\"]*leading-4/);
  assert.match(emptyMarkup(), /<span class="sr-only">Sin tarjetas\.<\/span>/);
  const occupied = renderToStaticMarkup(ui.find((node) => node.props["aria-label"] === "Columna Pendiente"));
  assert.doesNotMatch(occupied, /Sin tarjetas/);
  const before = ui.calls.length;
  const transfer = startCardDrag(ui);
  ui.find((node) => node.props["aria-label"] === "Columna Hecho").props.onDragOver({ preventDefault() {}, dataTransfer: transfer });
  assert.ok(ui.find((node) => node.props["data-kanban-drop-preview"]));
  assert.doesNotMatch(emptyMarkup(), /Sin tarjetas/);
  ui.find((node) => node.type === "article").props.onDragEnd();
  assert.match(emptyMarkup(), /<span class="sr-only">Sin tarjetas\.<\/span>/);
  assert.equal(ui.calls.length, before);
});

function columnNames(ui) {
  return [...ui.html().matchAll(/<section aria-label="Columna ([^"]+)"/g)].map((match) => match[1]);
}
function startColumnDrag(ui, name) {
  const values = new Map();
  const transfer = { setData: (key, value) => values.set(key, value), getData: (key) => values.get(key) ?? "", effectAllowed: "", dropEffect: "" };
  ui.button(`Arrastrar columna ${name}`).props.onDragStart({ dataTransfer: transfer });
  return transfer;
}
function hoverColumn(ui, name, transfer, clientX = 250) {
  ui.find((node) => node.props["aria-label"] === `Columna ${name}`).props.onDragOver({
    preventDefault() {}, dataTransfer: transfer, clientX,
    currentTarget: { getBoundingClientRect: () => ({ left: 0, width: 300 }) },
  });
}
async function dragColumn(ui, source, target) {
  const transfer = startColumnDrag(ui, source);
  hoverColumn(ui, target, transfer);
  await ui.find((node) => node.props["aria-label"] === `Columna ${target}`).props.onDrop({ preventDefault() {}, dataTransfer: transfer });
}

test("column drag removes arrows, previews order before release and uses a dashed outline", async () => {
  const ui = harness(); await ui.ready();
  const before = ui.calls.length;
  assert.doesNotMatch(ui.html(), /Mover (Pendiente|Hecho) a la (izquierda|derecha)|←|→/);
  const transfer = startColumnDrag(ui, "Pendiente");
  assert.equal(transfer.effectAllowed, "move");
  hoverColumn(ui, "Hecho", transfer, 50);
  assert.deepEqual(columnNames(ui), ["Pendiente", "Hecho"]);
  hoverColumn(ui, "Hecho", transfer);
  assert.deepEqual(columnNames(ui), ["Hecho", "Pendiente"]);
  assert.match(ui.find((node) => node.props["aria-label"] === "Columna Pendiente").props.className, /outline-dashed/);
  assert.equal(ui.find((node) => node.props["data-kanban-drop-preview"]), undefined);
  assert.equal(ui.calls.length, before);
  hoverColumn(ui, "Hecho", transfer);
  assert.deepEqual(columnNames(ui), ["Hecho", "Pendiente"], "repeated hover must not oscillate");
  ui.button("Arrastrar columna Pendiente").props.onDragEnd();
  assert.deepEqual(columnNames(ui), ["Pendiente", "Hecho"]);
  assert.doesNotMatch(ui.find((node) => node.props["aria-label"] === "Columna Pendiente").props.className, /outline-dashed/);
  assert.equal(ui.calls.length, before);
});

test("column drop persists once and retains its preview during save; rejection restores original order", async () => {
  let reject;
  const ui = harness({ reorderStatuses: () => new Promise((_, fail) => { reject = fail; }) }); await ui.ready();
  const transfer = startColumnDrag(ui, "Pendiente"); hoverColumn(ui, "Hecho", transfer);
  const drop = ui.find((node) => node.props["aria-label"] === "Columna Hecho").props.onDrop({ preventDefault() {}, dataTransfer: transfer });
  ui.button("Arrastrar columna Pendiente").props.onDragEnd();
  assert.deepEqual(columnNames(ui), ["Hecho", "Pendiente"]);
  assert.deepEqual(ui.calls.filter(([name]) => name === "reorderStatuses"), [["reorderStatuses", { boardId: "b1", statusIds: ["s2", "s1"] }]]);
  assert.equal(ui.button("Nueva columna").props.disabled, false);
  reject(new Error("No se pudo reordenar.")); await drop;
  assert.deepEqual(columnNames(ui), ["Pendiente", "Hecho"]);
  assert.match(ui.html(), /role="alert"[^>]*>No se pudo reordenar\./);
});

test("column drop confirms the preview after refresh and an unchanged drop never writes", async () => {
  const saved = initialBoard();
  const ui = harness({ getBoard: () => plain(saved), reorderStatuses: ({ statusIds }) => {
    saved.statuses.forEach((status) => { status.position = statusIds.indexOf(status.id); });
  } }); await ui.ready();
  const transfer = startColumnDrag(ui, "Pendiente");
  await ui.find((node) => node.props["aria-label"] === "Columna Pendiente").props.onDrop({ preventDefault() {}, dataTransfer: transfer });
  assert.equal(ui.calls.filter(([name]) => name === "reorderStatuses").length, 0);
  await dragColumn(ui, "Pendiente", "Hecho");
  assert.deepEqual(columnNames(ui), ["Hecho", "Pendiente"]);
  assert.equal(ui.calls.filter(([name]) => name === "reorderStatuses").length, 1);
  assert.equal(ui.calls.filter(([name]) => name === "moveCard").length, 0);
});

test("column drag previews insertion across multiple columns in both directions", async () => {
  const ui = harness(); const board = initialBoard();
  board.statuses.push({ ...board.statuses[1], id: "s3", name: "Tercera", position: 2 });
  ui.setBoard(board); await ui.ready(); const before = ui.calls.length;
  const transfer = startColumnDrag(ui, "Pendiente");
  hoverColumn(ui, "Tercera", transfer);
  assert.deepEqual(columnNames(ui), ["Hecho", "Tercera", "Pendiente"]);
  hoverColumn(ui, "Hecho", transfer, 50);
  assert.deepEqual(columnNames(ui), ["Pendiente", "Hecho", "Tercera"]);
  ui.button("Arrastrar columna Pendiente").props.onDragEnd();
  assert.equal(ui.calls.length, before);
});

test("column heading supports keyboard preview, cancel and explicit confirmation without arrow buttons", async () => {
  const saved = initialBoard();
  const ui = harness({ getBoard: () => plain(saved), reorderStatuses: ({ statusIds }) => {
    saved.statuses.forEach((status) => { status.position = statusIds.indexOf(status.id); });
  } }); await ui.ready();
  const key = (value) => ui.button("Arrastrar columna Pendiente").props.onKeyDown({ key: value, preventDefault() {} });
  key(" "); key("ArrowLeft");
  assert.deepEqual(columnNames(ui), ["Pendiente", "Hecho"]);
  key("ArrowRight");
  assert.deepEqual(columnNames(ui), ["Hecho", "Pendiente"]);
  assert.equal(ui.calls.filter(([name]) => name === "reorderStatuses").length, 0);
  key("Escape");
  assert.deepEqual(columnNames(ui), ["Pendiente", "Hecho"]);
  key(" "); key("ArrowRight"); key("Enter");
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.deepEqual(columnNames(ui), ["Hecho", "Pendiente"]);
  assert.deepEqual(ui.calls.filter(([name]) => name === "reorderStatuses"), [["reorderStatuses", { boardId: "b1", statusIds: ["s2", "s1"] }]]);
});
