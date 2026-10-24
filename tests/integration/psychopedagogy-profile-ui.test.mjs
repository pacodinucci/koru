import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const student = { id: "student-2", firstName: "Bruno", lastName: "Gómez", group: { name: "Grupo B" } };
const emptyProfile = () => ({ learningStyleAndTemperament: "", observations: [], accompaniments: [], interventions: [], instruments: [] });
const labels = ["Estilo de aprendizaje y temperamento", "Seguimientos realizados", "Intervenciones realizadas", "Instrumentos psicopedagógicos aplicados"];
const keys = ["learning", "followups", "interventions", "instruments"];
const text = (node) => typeof node === "string" || typeof node === "number" ? String(node)
  : Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : "";

// Component instances own hook slots and effect cleanup, including conditional unmounts.
function harness({ component = "PsychopedagogyProfileSection", props = {}, respond = () => ({ profile: emptyProfile() }) } = {}) {
  const instances = new Map();
  const calls = [];
  const toasts = [];
  let current;
  let seen;
  let effects = [];
  const react = {
    ...React,
    useState(initial) {
      const instance = current;
      const index = instance.cursor++;
      if (!(index in instance.slots)) instance.slots[index] = typeof initial === "function" ? initial() : initial;
      return [instance.slots[index], (value) => {
        instance.slots[index] = typeof value === "function" ? value(instance.slots[index]) : value;
      }];
    },
    useRef(initial) {
      const instance = current;
      const index = instance.cursor++;
      return instance.slots[index] ??= { current: initial };
    },
    useEffect(fn, deps) {
      const instance = current;
      const index = instance.cursor++;
      const previous = instance.slots[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        previous?.cleanup?.();
        instance.slots[index] = { deps };
        effects.push(() => { instance.slots[index].cleanup = fn(); });
      }
    },
  };
  const pass = ({ children, ...props }) => React.createElement("div", props, children);
  const cache = new Map();
  async function learningAction(studentId, description, save = false) {
    const url = save ? "server-action:saveLearningReport" : "server-action:readLearningReport";
    const options = save ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "learning", description }) } : {};
    calls.push({ url, options, transport: "server-action", studentId });
    const value = await respond(url, options);
    if (value instanceof Response) return { ok: false, error: "El servidor devolvió una respuesta inesperada. Intentá nuevamente." };
    if (value.error) return { ok: false, error: value.error };
    return save ? { ok: value.ok === true } : { ok: true, description: value.profile.learningStyleAndTemperament };
  }
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    const source = readFileSync(new URL(`../../src/modules/psychopedagogy/components/${name}.tsx`, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    cache.set(name, module.exports);
    vm.runInNewContext(compiled, {
      module, exports: module.exports, AbortController, Error,
      FormData: class {
        constructor(form) { this.values = form.values; }
        get(key) { return this.values[key] ?? null; }
      },
      fetch: async (url, options) => {
        calls.push({ url, options });
        const value = await respond(url, options);
        if (value instanceof Response) return value;
        return { ok: !value.error, headers: new Headers({ "Content-Type": "application/json" }), json: async () => value };
      },
      require(id) {
        if (id === "@/components/ui/toast") return { useToast: () => ({ toast: (message, type) => toasts.push({ message, type }) }) };
        if (id === "@/modules/psychopedagogy/server/learning-report.actions") return {
          readLearningReportAction: (id) => learningAction(id),
          saveLearningReportAction: (id, description) => learningAction(id, description, true),
        };
        if (id === "../lib/profile-contract") {
          const contract = { exports: {} };
          const source = readFileSync(new URL("../../src/modules/psychopedagogy/lib/profile-contract.ts", import.meta.url), "utf8");
          vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: contract, exports: contract.exports });
          return contract.exports;
        }
        if (id === "react") return react;
        if (id === "react/jsx-runtime") return require(id);
        if (id.startsWith("./")) return load(id.slice(2));
        if (id === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
        if (id === "lucide-react") return new Proxy({}, { get: (_, name) => (props) => React.createElement("svg", { ...props, "data-icon": name }) });
        if (id.endsWith("ui/button")) return { Button: ({ variant, size, ...props }) => React.createElement("button", props) };
        if (id.endsWith("ui/input")) return { Input: (props) => React.createElement("input", props) };
        if (id.endsWith("ui/label")) return { Label: (props) => React.createElement("label", props) };
        if (id.endsWith("ui/table")) return Object.fromEntries(Object.entries({
          Table: "table", TableBody: "tbody", TableCell: "td", TableHead: "th", TableHeader: "thead", TableRow: "tr",
        }).map(([name, tag]) => [name, (props) => React.createElement(tag, props)]));
        if (id.endsWith("ui/responsive-dialog")) return {
          ResponsiveDialog: ({ open, children, onOpenChange }) => open ? React.createElement("div", { role: "dialog", onOpenChange }, children) : null,
          ResponsiveDialogContent: pass, ResponsiveDialogBody: pass, ResponsiveDialogHeader: pass,
          ResponsiveDialogFooter: pass, ResponsiveDialogTitle: pass, ResponsiveDialogDescription: pass,
        };
        if (id.endsWith("ui/tabs")) return {
          Tabs: pass, TabsList: ({ children, ...props }) => React.createElement("div", { ...props, role: "tablist" }, children),
          TabsTrigger: ({ children, value, ...props }) => React.createElement("button", { ...props, role: "tab" }, children),
          TabsContent: pass,
        };
        if (id.endsWith("ui/accordion")) return {
          Accordion: pass, AccordionItem: pass, AccordionContent: pass,
          AccordionTrigger: (props) => React.createElement("button", props),
        };
        throw new Error(`Unmocked import: ${id}`);
      },
    });
    return module.exports;
  }
  const exports = load(component === "PsychopedagogyClient" ? "psychopedagogy-client" : "psychopedagogy-profile");
  const root = exports[component];
  function expand(node, path = "root") {
    if (node == null || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map((child, i) => expand(child, `${path}/${child?.key ?? i}`));
    if (typeof node.type === "function") {
      const identity = `${path}:${node.key ?? ""}:${node.type.name}`;
      seen.add(identity);
      const instance = instances.get(identity) ?? { slots: [] };
      instances.set(identity, instance);
      instance.cursor = 0;
      const previous = current;
      current = instance;
      const rendered = node.type(node.props);
      current = previous;
      const expanded = expand(rendered, identity);
      return node.key != null && React.isValidElement(expanded) ? React.cloneElement(expanded, { key: node.key }) : expanded;
    }
    return React.cloneElement(node, {}, ...React.Children.toArray(node.props.children).map((child, i) => expand(child, `${path}/${child?.key ?? i}`)));
  }
  function nodes(node) {
    return !node || typeof node !== "object" ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props.children)];
  }
  const ui = {
    calls,
    toasts,
    formResets: 0,
    props: { student, readOnly: false, section: "followups", ...props },
    render() {
      seen = new Set();
      const tree = expand(React.createElement(root, ui.props));
      for (const [key, instance] of instances) {
        if (seen.has(key)) continue;
        for (const slot of instance.slots) slot?.cleanup?.();
        instances.delete(key);
      }
      return tree;
    },
    html() { return renderToStaticMarkup(ui.render()); },
    find(predicate) { return nodes(ui.render()).find(predicate); },
    button(label) {
      const found = ui.find((node) => node.type === "button" && (node.props["aria-label"] === label || text(node) === label));
      assert.ok(found, `Missing button: ${label}`);
      return found;
    },
    async click(label) { await ui.button(label).props.onClick(); await ui.ready(); },
    async ready() {
      ui.render();
      for (let round = 0; round < 5; round++) {
        const pending = effects;
        effects = [];
        for (const effect of pending) effect();
        for (let i = 0; i < 12; i++) await Promise.resolve();
        ui.render();
      }
    },
    async submit(values) {
      const form = ui.find((node) => node.type === "form");
      assert.ok(form, "Missing section form");
      await form.props.onSubmit({ preventDefault() {}, currentTarget: { values, reset() { ui.formResets++; } } });
      ui.render();
    },
    changeStudent(next) { ui.props.student = next; ui.render(); },
  };
  return ui;
}

for (const [index, section] of keys.entries()) test(`${section}: table opens only the chosen student's section and closes without inline content`, async () => {
  const otherStudent = { ...student, id: "student-1", firstName: "Ana", lastName: "Pérez" };
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [otherStudent, student] } });
  await ui.ready();
  assert.equal(ui.calls.length, 0);
  await ui.click(`Ver ${labels[index].toLocaleLowerCase("es")} de Bruno Gómez`);
  await ui.ready();
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.calls[0].url, section === "learning" ? "server-action:readLearningReport" : "/api/teacher/students/student-2/psychopedagogy/profile");
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  const dialog = ui.find((node) => node.props.role === "dialog");
  assert.ok(dialog);
  assert.match(text(dialog), new RegExp(labels[index]));
  assert.match(renderToStaticMarkup(dialog), /font-montserrat/);
  for (const [other, action] of [["learning", "Editar descripción"], ["followups", "Nuevo acompañamiento"], ["interventions", "Nueva intervención"], ["instruments", "Registrar instrumento"]]) {
    if (other !== section) assert.ok(!text(dialog).includes(action));
  }
  await ui.click("Cerrar");
  assert.equal(ui.find((node) => node.props.role === "dialog"), undefined);
  assert.doesNotMatch(ui.html(), /<article|<form|<textarea/);
  assert.equal(ui.calls.length, 1);
});

test("followups modal separates multiple observations and accompaniments into tabbed tables", async () => {
  const profile = { ...emptyProfile(),
    observations: [1, 2].map((id) => ({ id: `o${id}`, entryDate: "2026-09-19", title: `Bitácora ${id}`, body: `Observación ${id}` })),
    accompaniments: ["INDIVIDUAL", "FAMILY"].map((kind) => ({ id: kind, kind, entryDate: "2026-09-20", title: `Encuentro ${kind}`, body: `Detalle ${kind}` })),
  };
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student] }, respond: () => ({ profile }) });
  await ui.ready();
  await ui.click("Ver seguimientos realizados de Bruno Gómez");
  await ui.ready();
  assert.match(ui.html(), /role="tablist"/);
  const footer = ui.find((node) => node.props["data-followup-actions"] === true);
  assert.ok(footer, "Creation and close controls must share the modal footer");
  assert.match(text(footer), /Nueva bitácora/); assert.match(text(footer), /Cerrar/);
  assert.match(footer.props.className, /flex/);
  assert.match(ui.html(), /Bitácora 1/); assert.match(ui.html(), /Bitácora 2/);
  assert.match(ui.html(), /<th[^>]*>Fecha/); assert.match(ui.html(), /<th[^>]*>Título/);
  assert.doesNotMatch(ui.html(), /Encuentro INDIVIDUAL|Nuevo acompañamiento|Situaciones reportadas|<th[^>]*>Texto|Observación 1/);
  const tab = ui.button("Bitácoras de observación");
  assert.match(tab.props.className, /data-\[active\]:border-primary/);
  const panel = ui.find((node) => node.props.className?.includes("md:p-0"));
  assert.ok(panel, "Tab panel must not pad the table");
  const tableWrapper = ui.find((node) => node.props.className?.includes("overflow-x-auto") && node.props.className?.includes("mx-6"));
  assert.ok(tableWrapper, "Followup table must align with the modal title's 1.5rem horizontal inset");
  await ui.click("Bitácora 1");
  assert.match(ui.html(), /Observación 1/);
  assert.doesNotMatch(ui.html(), /Observación 2/);
  await ui.click("Volver a la tabla");
  assert.doesNotMatch(ui.html(), /Observación 1/);
  await ui.click("Acompañamientos");
  assert.match(ui.html(), /Encuentro INDIVIDUAL/); assert.match(ui.html(), /Encuentro FAMILY/);
  assert.match(ui.html(), /Individual/); assert.match(ui.html(), /Familiar/);
  assert.doesNotMatch(ui.html(), /Bitácora 1|Agregar observación/);
  await ui.click("Nuevo acompañamiento");
  assert.ok(ui.find((node) => node.type === "form"));
  await ui.click("Bitácoras de observación");
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  assert.equal(ui.calls.length, 1);
});

test("followup tabs append multiple records, retain both kinds, and respect readonly mode", async () => {
  const profile = emptyProfile();
  const ui = harness({ props: { section: "followups", followupsTabs: true }, respond: (url, options) => {
    if (options?.method === "POST") {
      const payload = JSON.parse(options.body);
      const entry = { ...payload, id: `entry-${profile.observations.length + profile.accompaniments.length}`, entryDate: payload.date };
      (payload.section === "accompaniment" ? profile.accompaniments : profile.observations).push(entry);
      return { ok: true };
    }
    return { profile };
  } });
  await ui.ready();
  assert.match(ui.html(), /Este alumno todavía no tiene observaciones/);
  for (const title of ["Primera bitácora", "Segunda bitácora"]) {
    await ui.click("Nueva bitácora");
    const dialog = ui.find((node) => node.props.role === "dialog");
    assert.ok(dialog, "Creation must open a responsive dialog");
    assert.match(text(dialog), /Nueva bitácora/);
    await ui.submit({ date: "2026-09-19", title, body: "Comunicación familiar" });
    await ui.ready();
    assert.match(ui.html(), new RegExp(title));
  }
  await ui.click("Acompañamientos");
  assert.match(ui.html(), /Todavía no hay acompañamientos registrados/);
  for (const kind of ["INDIVIDUAL", "FAMILY"]) {
    await ui.click("Nuevo acompañamiento");
    const dialog = ui.find((node) => node.props.role === "dialog");
    assert.ok(dialog, "Accompaniment creation must open a responsive dialog");
    const select = ui.find((node) => node.type === "select" && node.props.name === "kind");
    assert.ok(select); assert.equal(select.props.required, true);
    assert.match(text(select), /IndividualFamiliar/);
    await ui.submit({ date: "2026-09-20", kind, title: kind, body: "Encuentro registrado" });
    await ui.ready();
    assert.match(ui.html(), new RegExp(kind));
    assert.equal(ui.find((node) => node.props.role === "dialog"), undefined, "Saved dialog must close");
  }
  assert.equal(profile.observations.length, 2); assert.equal(profile.accompaniments.length, 2);
  assert.deepEqual(ui.toasts, [
    { message: "Bitácora guardada correctamente.", type: "success" },
    { message: "Bitácora guardada correctamente.", type: "success" },
    { message: "Acompañamiento guardado correctamente.", type: "success" },
    { message: "Acompañamiento guardado correctamente.", type: "success" },
  ]);
  assert.doesNotMatch(ui.html(), /Seguimiento guardado correctamente/);
  await ui.click("Bitácoras de observación");
  assert.match(ui.html(), /Primera bitácora/); assert.match(ui.html(), /Segunda bitácora/);
  const readonly = harness({ props: { section: "followups", followupsTabs: true, readOnly: true }, respond: () => ({ profile }) });
  await readonly.ready();
  assert.doesNotMatch(readonly.html(), /Nueva bitácora|Agregar observación|Nuevo acompañamiento|<form/);
  await readonly.click("Acompañamientos");
  assert.doesNotMatch(readonly.html(), /Encuentro registrado/);
  await readonly.click("FAMILY");
  assert.match(readonly.html(), /Encuentro registrado/);
  assert.doesNotMatch(readonly.html(), /Agregar observación|Nuevo acompañamiento|<form/);
  assert.equal(readonly.calls.length, 1);
});

test("followup creation dialog preserves errors and cancels without writing", async () => {
  const ui = harness({ props: { section: "followups", followupsTabs: true }, respond: (_url, options) =>
    options?.method === "POST" ? { error: "No pudimos guardar la bitácora." } : { profile: emptyProfile() } });
  await ui.ready();
  await ui.click("Nueva bitácora");
  assert.equal(ui.find((node) => node.type === "select" && node.props.name === "kind"), undefined);
  await ui.click("Cancelar");
  assert.equal(ui.find((node) => node.props.role === "dialog"), undefined);
  assert.equal(ui.calls.length, 1);
  await ui.click("Nueva bitácora");
  await ui.submit({ date: "2026-09-20", title: "Bitácora", body: "Texto conservado" });
  assert.match(ui.html(), /No pudimos guardar la bitácora/);
  assert.ok(ui.find((node) => node.props.role === "dialog"));
  assert.ok(ui.find((node) => node.type === "form"));
  assert.equal(ui.calls[1].url, "/api/teacher/students/student-2/psychopedagogy");
  assert.deepEqual(JSON.parse(ui.calls[1].options.body), { date: "2026-09-20", title: "Bitácora", body: "Texto conservado" });
  const dialog = ui.find((node) => node.props.role === "dialog");
  dialog.props.onOpenChange(false);
  assert.equal(ui.find((node) => node.props.role === "dialog"), undefined);
  assert.equal(ui.calls.length, 2);
  assert.deepEqual(ui.toasts, []);
});

test("Superadmin followup exception exposes creation dialogs without unlocking interventions or instruments", async () => {
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student], readOnly: true, canEditLearning: true, canEditFollowups: true } });
  await ui.ready();
  await ui.click("Ver seguimientos realizados de Bruno Gómez"); await ui.ready();
  assert.doesNotMatch(ui.html(), /Solo lectura/);
  await ui.click("Nueva bitácora");
  assert.ok(ui.find((node) => node.type === "form"));
  await ui.click("Cancelar");
  await ui.click("Acompañamientos");
  await ui.click("Nuevo acompañamiento");
  assert.ok(ui.find((node) => node.type === "select" && node.props.name === "kind"));
  await ui.click("Cancelar"); await ui.click("Cerrar");
  for (const label of labels.slice(2)) {
    await ui.click(`Ver ${label.toLocaleLowerCase("es")} de Bruno Gómez`); await ui.ready();
    assert.match(ui.html(), /Solo lectura/);
    assert.doesNotMatch(ui.html(), /Nueva intervención|Registrar instrumento|<form/);
    await ui.click("Cerrar");
  }
});

test("Superadmin learning exception edits and saves from table while other sections remain readonly", async () => {
  let description = "";
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student], readOnly: true, canEditLearning: true },
    respond: (_url, options) => {
      if (options?.method === "POST") { description = JSON.parse(options.body).description; return { ok: true }; }
      return { profile: { ...emptyProfile(), learningStyleAndTemperament: description } };
    } });
  await ui.ready();
  await ui.click("Ver estilo de aprendizaje y temperamento de Bruno Gómez"); await ui.ready();
  assert.doesNotMatch(ui.html(), /Solo lectura/);
  await ui.click("Editar descripción");
  await ui.submit({ description: "Aprende con ejemplos visuales" }); await ui.ready();
  assert.match(ui.html(), /Aprende con ejemplos visuales/);
  assert.equal(ui.calls.filter((call) => call.options?.method === "POST").length, 1);
  await ui.click("Cerrar");
  for (const label of labels.slice(1)) {
    await ui.click(`Ver ${label.toLocaleLowerCase("es")} de Bruno Gómez`); await ui.ready();
    assert.match(ui.html(), /Solo lectura/);
    assert.doesNotMatch(ui.html(), /Agregar observación|Nuevo acompañamiento|Nueva intervención|Registrar instrumento|<form/);
    await ui.click("Cerrar");
  }
});

test("learning modal shows the saved report, edits prefilled text and confirms a persisted save without REST", async () => {
  let description = "Se concentra mejor trabajando con material concreto.";
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student], readOnly: true, canEditLearning: true }, respond: (_name, options) => {
    if (options?.method === "POST") { description = JSON.parse(options.body).description.trim(); return { ok: true }; }
    return { profile: { ...emptyProfile(), learningStyleAndTemperament: description } };
  } });
  await ui.ready();
  await ui.click("Ver estilo de aprendizaje y temperamento de Bruno Gómez"); await ui.ready();
  assert.match(ui.html(), /Reporte del alumno/);
  assert.match(ui.html(), /Se concentra mejor trabajando con material concreto/);
  await ui.click("Editar descripción");
  assert.equal(ui.find((node) => node.type === "textarea").props.defaultValue, description);
  await ui.submit({ description: "Aprende explorando y necesita anticipar los cambios." }); await ui.ready();
  assert.match(ui.html(), /Reporte guardado correctamente/);
  assert.match(ui.html(), /Aprende explorando y necesita anticipar los cambios/);
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  assert.ok(ui.calls.every((call) => call.transport === "server-action"));
  assert.ok(ui.calls.every((call) => call.studentId === student.id));
  await ui.click("Cerrar");
  await ui.click("Ver estilo de aprendizaje y temperamento de Bruno Gómez"); await ui.ready();
  await ui.click("Editar descripción");
  assert.equal(ui.find((node) => node.type === "textarea").props.defaultValue, description);
});

test("learning modal matches the report panel with an edit icon in its upper-right corner", async () => {
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student] },
    respond: () => ({ profile: { ...emptyProfile(), learningStyleAndTemperament: "Reporte guardado del alumno" } }) });
  await ui.ready();
  await ui.click("Ver estilo de aprendizaje y temperamento de Bruno Gómez"); await ui.ready();
  const article = ui.find((node) => node.type === "article");
  assert.ok(article);
  assert.match(article.props.className, /relative/);
  assert.match(article.props.className, /min-h-/);
  const html = renderToStaticMarkup(article);
  assert.match(html, /Reporte guardado del alumno/);
  assert.match(html, /aria-label="Editar descripción"/);
  assert.match(html, /data-icon="Pencil"/);
  assert.match(html, /absolute[^\"]*right-3[^\"]*top-3/);
  const edit = ui.button("Editar descripción");
  assert.equal(text(edit), "");
  await ui.click("Editar descripción");
  await ui.ready();
  const textarea = ui.find((node) => node.type === "textarea");
  assert.equal(textarea.props.defaultValue, "Reporte guardado del alumno");
  assert.equal(ui.find((node) => node.type === "article"), undefined, "the textarea replaces the panel, not a nested editor");
  for (const utility of ["min-h-[20rem]", "sm:min-h-[24rem]", "rounded-xl", "border-primary/40", "p-5"]) {
    assert.ok(article.props.className.includes(utility));
    assert.ok(textarea.props.className.includes(utility));
  }
  const save = ui.button("Guardar descripción");
  const form = ui.find((node) => node.type === "form");
  assert.equal(save.props.type, "submit");
  assert.equal(save.props.form, form.props.id);
  assert.equal(ui.find((node) => node.type === "button" && text(node) === "Cerrar"), undefined);
  assert.doesNotMatch(ui.html(), /<h3[^>]*>Editar descripción|Descripción del estilo de aprendizaje|Cancelar/);
  ui.find((node) => node.props.role === "dialog").props.onOpenChange(false);
  await ui.ready();
  await ui.click("Ver estilo de aprendizaje y temperamento de Bruno Gómez"); await ui.ready();
  assert.ok(ui.button("Cerrar"));
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  assert.match(ui.html(), /Reporte guardado del alumno/);
});

test("Superadmin learning exception reaches student profile without enabling other editors", async () => {
  const ui = harness({ component: "PsychopedagogyProfile", props: { student, readOnly: true, canEditLearning: true, initialSection: "learning" } });
  await ui.ready();
  await ui.click("Editar descripción");
  assert.match(ui.html(), /<textarea/);
  assert.doesNotMatch(ui.html(), /Nuevo acompañamiento|Nueva intervención|Registrar instrumento/);
});

test("HTML route errors show a useful message instead of a raw JSON parser failure", async () => {
  const ui = harness({ respond: () => new Response("<!DOCTYPE html><html>Not found</html>", {
    status: 404, headers: { "Content-Type": "text/html" },
  }) });
  await ui.ready();
  assert.match(ui.html(), /La API del perfil psicopedagógico no está disponible/);
  assert.doesNotMatch(ui.html(), /Unexpected token|DOCTYPE|not valid JSON|<form/);
  assert.equal(ui.calls.length, 1);
  assert.ok(ui.button("Reintentar"));
});

test("non-JSON save failures keep the editor open without raw parser messages", async () => {
  const ui = harness({ props: { section: "learning" }, respond: (_url, options) => options?.method === "POST"
    ? new Response("<!DOCTYPE html><html>Error</html>", { status: 500, headers: { "Content-Type": "text/html" } })
    : { profile: emptyProfile() } });
  await ui.ready(); await ui.click("Editar descripción");
  await ui.submit({ description: "Aprendizaje visual" });
  assert.match(ui.html(), /El servidor devolvió una respuesta inesperada/);
  assert.doesNotMatch(ui.html(), /Unexpected token|DOCTYPE|not valid JSON/);
  assert.ok(ui.find((node) => node.type === "form"));
  assert.equal(ui.calls.length, 2);
});

const interventionValues = {
  date: "2026-09-19", title: "Plan", observationAnalysis: "Observación", strategyFeedback: "Estrategia",
  workPlan: "Trabajo", implementation: "Implementación", evaluationResults: "Resultados",
};
test("interventions modal matches followups with table, full report, nested creation and success refresh", async () => {
  const old = { id: "old", entryDate: "2026-09-18T00:00:00.000Z", title: "Informe anterior",
    observationAnalysis: "Análisis anterior", strategyFeedback: "Estrategia anterior", workPlan: "Plan anterior",
    implementation: "Implementación anterior", evaluationResults: "Resultados anteriores" };
  let entries = [old];
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student], readOnly: true, canEditInterventions: true },
    respond: (_url, options) => {
      if (options?.method === "POST") {
        const payload = JSON.parse(options.body);
        entries = [...entries, { ...payload, id: "new", entryDate: payload.date }];
        return { ok: true };
      }
      return { profile: { ...emptyProfile(), interventions: entries } };
    } });
  await ui.ready();
  await ui.click("Ver intervenciones realizadas de Bruno Gómez"); await ui.ready();
  assert.doesNotMatch(ui.html(), /Solo lectura|role="tablist"|Análisis anterior|<form/);
  assert.match(ui.html(), /<th[^>]*>Fecha/); assert.match(ui.html(), /<th[^>]*>Título/);
  assert.match(ui.html(), /18\/09\/2026/);
  assert.ok(ui.find((node) => node.props.className?.includes("overflow-x-auto") && node.props.className?.includes("mx-6")));
  const footer = ui.find((node) => node.props["data-intervention-actions"] === true);
  assert.ok(footer); assert.match(text(footer), /Nueva intervenciónCerrar/);
  assert.match(footer.props.className, /flex flex-nowrap/);
  assert.ok(ui.find((node) => node.props.className === "px-0 pt-3 pb-6"));
  assert.ok(ui.find((node) => node.props.className === "px-6 pt-6 pb-3"));
  assert.ok(ui.find((node) => node.props.className?.includes("44rem")));
  await ui.click(old.title);
  assert.match(ui.html(), /Informe psicopedagógico/);
  for (const label of ["Observación y análisis", "Retroalimentación y diseño de estrategia", "Plan de trabajo", "Implementación", "Evaluación y resultados"]) assert.ok(ui.html().includes(label));
  for (const value of [old.observationAnalysis, old.strategyFeedback, old.workPlan, old.implementation, old.evaluationResults]) assert.ok(ui.html().includes(value));
  await ui.click("Volver a la tabla"); assert.doesNotMatch(ui.html(), /Análisis anterior/);
  await ui.click("Nueva intervención");
  const dialogs = [];
  ui.find((node) => { if (node.props.role === "dialog") dialogs.push(node); return false; });
  assert.equal(dialogs.length, 2);
  const form = ui.find((node) => node.type === "form");
  assert.equal(ui.button("Guardar intervención").props.form, form.props.id);
  assert.equal(ui.button("Guardar intervención").props.type, "submit");
  assert.doesNotMatch(ui.html(), /name="teacherId"|name="authorId"|name="userId"/);
  for (const name of Object.keys(interventionValues)) {
    const field = ui.find((node) => node.props.name === name);
    assert.ok(field); assert.equal(field.props.required, true);
  }
  await ui.submit(interventionValues); await ui.ready();
  assert.equal(ui.calls.length, 3);
  assert.equal(ui.calls[1].url, "/api/teacher/students/student-2/psychopedagogy/profile");
  assert.deepEqual(JSON.parse(ui.calls[1].options.body), { section: "intervention", ...interventionValues });
  assert.equal(ui.calls[2].url, ui.calls[0].url);
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  assert.deepEqual(ui.toasts, [{ message: "Intervención guardada correctamente.", type: "success" }]);
  assert.ok(ui.button("Cerrar")); assert.ok(ui.button(old.title));
  await ui.click(interventionValues.title);
  for (const name of Object.keys(interventionValues).slice(2)) assert.ok(ui.html().includes(interventionValues[name]));
  await ui.click("Volver a la tabla"); await ui.click("Cerrar");
  assert.equal(ui.find((node) => node.props.role === "dialog"), undefined);
});

test("interventions cancel without writing and retain editor and validation or transport errors", async () => {
  for (const failure of [{ error: "Revisá el plan de trabajo." }, new Response("<html>Error</html>", { status: 500, headers: { "Content-Type": "text/html" } })]) {
    const ui = harness({ props: { section: "interventions" }, respond: (_url, options) => options?.method === "POST" ? failure : { profile: emptyProfile() } });
    await ui.ready(); assert.match(ui.html(), /Todavía no hay intervenciones registradas/);
    await ui.click("Nueva intervención"); await ui.click("Cancelar");
    assert.equal(ui.calls.length, 1); assert.equal(ui.find((node) => node.type === "form"), undefined);
    await ui.click("Nueva intervención");
    const fieldIds = Object.keys(interventionValues).map((name) => ui.find((node) => node.props.name === name).props.id);
    await ui.submit(interventionValues); await ui.ready();
    assert.ok(ui.find((node) => node.props.role === "dialog"));
    assert.ok(ui.find((node) => node.type === "form"));
    assert.match(ui.html(), failure instanceof Response ? /El servidor devolvió una respuesta inesperada/ : /Revisá el plan de trabajo/);
    assert.doesNotMatch(ui.html(), /Unexpected token|<html>Error/);
    assert.deepEqual(Object.keys(interventionValues).map((name) => ui.find((node) => node.props.name === name).props.id), fieldIds);
    assert.equal(ui.formResets, 0); assert.equal(ui.calls.length, 2); assert.deepEqual(ui.toasts, []);
    ui.find((node) => node.props.role === "dialog").props.onOpenChange(false);
    await ui.ready(); assert.equal(ui.find((node) => node.type === "form"), undefined);
    assert.equal(ui.calls.length, 2);
  }
});

test("intervention capability is opt-in and never unlocks instruments or student detail", async () => {
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student], readOnly: true, canEditInterventions: true } });
  await ui.ready(); await ui.click("Ver intervenciones realizadas de Bruno Gómez"); await ui.ready();
  await ui.click("Nueva intervención"); assert.ok(ui.find((node) => node.type === "form"));
  await ui.click("Cancelar"); await ui.click("Cerrar");
  for (const label of [labels[0], labels[1], labels[3]]) {
    await ui.click(`Ver ${label.toLocaleLowerCase("es")} de Bruno Gómez`); await ui.ready();
    assert.match(ui.html(), /Solo lectura/); assert.doesNotMatch(ui.html(), /Editar descripción|Nueva bitácora|Registrar instrumento|<form/);
    await ui.click("Cerrar");
  }
  const readonly = harness({ component: "PsychopedagogyClient", props: { students: [student], readOnly: true } });
  await readonly.ready(); await readonly.click("Ver intervenciones realizadas de Bruno Gómez"); await readonly.ready();
  assert.match(readonly.html(), /Solo lectura/); assert.doesNotMatch(readonly.html(), /Nueva intervención|<form/);
  const detail = harness({ component: "PsychopedagogyProfile", props: { readOnly: true, initialSection: "interventions" } });
  await detail.ready(); assert.doesNotMatch(detail.html(), /Nueva intervención|Registrar instrumento|<form/);
  assert.equal(detail.calls.length, 1);
});

const instrumentValues = { date: "2026-09-19", kind: "ASSESSMENT", name: "Prueba aplicada", body: "Resultados del instrumento" };

test("instruments match intervention modal layout, table/detail types and nested creation for Superadmin", async () => {
  let entries = [
    { id: "old", entryDate: "2026-09-18", name: "Legado sin tipo", body: "Texto legado" },
    { id: "null", entryDate: "2026-09-18", kind: null, name: "Legado nulo", body: "Texto nulo" },
    ...[["QUESTIONNAIRE", "Cuestionario"], ["ASSESSMENT", "Prueba"], ["INTERVIEW", "Entrevista"], ["TEST", "Test"], ["OTHER", "Otro"]]
      .map(([kind, label]) => ({ id: kind, entryDate: "2026-09-19", kind, name: `Nombre ${label}`, body: `Texto ${label}` })),
  ];
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student], readOnly: true, canEditInstruments: true },
    respond: (_url, options) => {
      if (options?.method === "POST") {
        const payload = JSON.parse(options.body);
        entries = [...entries, { ...payload, id: "new", entryDate: payload.date }];
        return { ok: true };
      }
      return { profile: { ...emptyProfile(), instruments: entries } };
    } });
  await ui.ready(); await ui.click("Ver instrumentos psicopedagógicos aplicados de Bruno Gómez"); await ui.ready();
  assert.doesNotMatch(ui.html(), /Solo lectura|role="tablist"|Texto legado|<form/);
  for (const label of ["Fecha", "Tipo", "Nombre"]) assert.match(ui.html(), new RegExp(`<th[^>]*>${label}`));
  assert.equal((ui.html().match(/Sin clasificar/g) ?? []).length, 2);
  assert.ok(ui.find((node) => node.props.className?.includes("overflow-x-auto") && node.props.className?.includes("mx-6")));
  assert.ok(ui.find((node) => node.props.className === "px-0 pt-3 pb-6"));
  assert.ok(ui.find((node) => node.props.className === "px-6 pt-6 pb-3"));
  assert.ok(ui.find((node) => node.props.className?.includes("44rem")));
  const footer = ui.find((node) => node.props["data-instrument-actions"] === true);
  assert.ok(footer); assert.equal(text(footer), "Registrar instrumentoCerrar");
  assert.match(footer.props.className, /flex flex-nowrap/);
  for (const entry of entries) {
    await ui.click(entry.name);
    const detail = ui.find((node) => node.type === "article");
    assert.ok(detail); assert.match(text(detail), new RegExp(entry.body));
    assert.match(text(detail), entry.kind ? new RegExp(entry.name.slice(7)) : /Sin clasificar/);
    if (!entry.kind) assert.doesNotMatch(text(detail), /Otro/);
    assert.ok(ui.find((node) => node.type === "time" && node.props.dateTime === entry.entryDate));
    await ui.click("Volver a la tabla"); assert.doesNotMatch(ui.html(), new RegExp(entry.body));
  }
  await ui.click("Registrar instrumento");
  let dialogs = 0; ui.find((node) => { if (node.props.role === "dialog") dialogs++; return false; });
  assert.equal(dialogs, 2);
  const form = ui.find((node) => node.type === "form");
  assert.equal(ui.button("Guardar instrumento").props.form, form.props.id);
  assert.equal(ui.button("Guardar instrumento").props.type, "submit");
  assert.doesNotMatch(ui.html(), /name="teacherId"|name="authorId"|name="userId"/);
  await ui.submit(instrumentValues); await ui.ready();
  assert.deepEqual(JSON.parse(ui.calls[1].options.body), { section: "instrument", ...instrumentValues });
  assert.equal(ui.calls.length, 3); assert.equal(ui.calls[2].url, ui.calls[0].url);
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  assert.deepEqual(ui.toasts, [{ message: "Instrumento guardado correctamente.", type: "success" }]);
  await ui.click(instrumentValues.name); assert.match(ui.html(), /Resultados del instrumento/);
  await ui.click("Volver a la tabla"); await ui.click("Cerrar");
  for (const label of labels.slice(0, 3)) {
    await ui.click(`Ver ${label.toLocaleLowerCase("es")} de Bruno Gómez`); await ui.ready();
    assert.match(ui.html(), /Solo lectura/);
    assert.doesNotMatch(ui.html(), /Editar descripción|Nueva bitácora|Nueva intervención|Registrar instrumento|<form/);
    await ui.click("Cerrar");
  }
  const detail = harness({ component: "PsychopedagogyProfile", props: { readOnly: true, initialSection: "instruments" } });
  await detail.ready(); assert.doesNotMatch(detail.html(), /Registrar instrumento|<form/);
});

test("instrument errors retain editor and fields; cancel does not write or toast", async () => {
  for (const failure of [{ error: "Revisá el instrumento." }, new Response("<html>Error</html>", { status: 500, headers: { "Content-Type": "text/html" } })]) {
    const ui = harness({ props: { section: "instruments" }, respond: (_url, options) => options?.method === "POST" ? failure : { profile: emptyProfile() } });
    await ui.ready(); assert.match(ui.html(), /Todavía no hay instrumentos registrados/);
    await ui.click("Registrar instrumento"); await ui.click("Cancelar");
    assert.equal(ui.calls.length, 1); assert.equal(ui.find((node) => node.type === "form"), undefined);
    await ui.click("Registrar instrumento");
    const fields = Object.keys(instrumentValues).map((name) => ui.find((node) => node.props.name === name));
    await ui.submit(instrumentValues); await ui.ready();
    assert.ok(ui.find((node) => node.props.role === "dialog"));
    assert.ok(ui.find((node) => node.type === "form"));
    assert.match(ui.html(), failure instanceof Response ? /El servidor devolvió una respuesta inesperada/ : /Revisá el instrumento/);
    for (const field of fields) assert.equal(ui.find((node) => node.props.name === field.props.name).props.id, field.props.id);
    assert.equal(ui.formResets, 0); assert.equal(ui.calls.length, 2); assert.deepEqual(ui.toasts, []);
    ui.find((node) => node.props.role === "dialog").props.onOpenChange(false);
    await ui.ready(); assert.equal(ui.find((node) => node.type === "form"), undefined);
    assert.equal(ui.calls.length, 2);
  }
});

test("instrument pending saves prevent duplicates and ignore completion after cancel or student switch", async () => {
  for (const finish of ["cancel", "student"]) {
    let resolvePost;
    const ui = harness({ props: { section: "instruments" }, respond: (_url, options) => options?.method === "POST"
      ? new Promise((done) => { resolvePost = done; }) : { profile: emptyProfile() } });
    await ui.ready(); await ui.click("Registrar instrumento");
    const pending = ui.submit(instrumentValues); await Promise.resolve();
    const post = ui.calls.at(-1);
    assert.equal(ui.button("Guardando…").props.disabled, true);
    for (const name of Object.keys(instrumentValues)) assert.equal(ui.find((node) => node.props.name === name).props.disabled, true);
    await ui.submit(instrumentValues); assert.equal(ui.calls.length, 2);
    if (finish === "cancel") await ui.click("Cancelar");
    else { ui.changeStudent({ ...student, id: "student-3" }); await ui.ready(); }
    assert.equal(post.options.signal.aborted, true);
    const count = ui.calls.length;
    resolvePost({ ok: true }); await pending; await ui.ready();
    assert.equal(ui.calls.length, count); assert.deepEqual(ui.toasts, []);
    assert.doesNotMatch(ui.html(), /<form|Resultados del instrumento/);
  }
});

test("switching instrument students aborts a pending read and ignores legacy data from the prior student", async () => {
  let resolveGet;
  const ui = harness({ props: { section: "instruments" }, respond: (url) => url.includes("student-2")
    ? new Promise((done) => { resolveGet = done; }) : { profile: emptyProfile() } });
  await ui.ready(); const signal = ui.calls[0].options.signal;
  ui.changeStudent({ ...student, id: "student-3" }); await ui.ready();
  assert.equal(signal.aborted, true);
  resolveGet({ profile: { ...emptyProfile(), instruments: [{ id: "old", entryDate: "2026-09-19", name: "Registro obsoleto", body: "Texto viejo" }] } });
  await ui.ready(); assert.doesNotMatch(ui.html(), /Registro obsoleto|Texto viejo/);
  assert.equal(ui.calls.length, 2); assert.deepEqual(ui.toasts, []);
});

const writes = [
  ["learning", "Editar descripción", "Guardar descripción", { description: "Aprende con ejemplos" }, { section: "learning", description: "Aprende con ejemplos" }],
  ["followups", "Agregar observación", "Guardar reporte", { date: "2026-09-19", title: "Entrevista", body: "Comunicación familiar" }, { date: "2026-09-19", title: "Entrevista", body: "Comunicación familiar" }],
  ...["INDIVIDUAL", "FAMILY"].map((kind) => [
    "followups", "Nuevo acompañamiento", "Guardar acompañamiento",
    { date: "2026-09-19", kind, title: "Encuentro", body: "Acompañamiento" },
    { section: "accompaniment", date: "2026-09-19", kind, title: "Encuentro", body: "Acompañamiento" },
  ]),
  ["interventions", "Nueva intervención", "Guardar intervención", interventionValues, { section: "intervention", ...interventionValues }],
  ...["QUESTIONNAIRE", "ASSESSMENT", "INTERVIEW", "TEST", "OTHER"].map((kind) => [
    "instruments", "Registrar instrumento", "Guardar instrumento",
    { date: "2026-09-19", kind, name: "Instrumento aplicado", body: "Resultados" },
    { section: "instrument", date: "2026-09-19", kind, name: "Instrumento aplicado", body: "Resultados" },
  ]),
];
for (const [section, action, save, values, expected] of writes) test(`${section} ${values.kind ?? action}: submits exact payload and refreshes the selected student`, async () => {
  const profile = emptyProfile();
  profile.learningStyleAndTemperament = "Descripción anterior";
  const ui = harness({
    props: { section },
    respond: (_url, options) => {
      if (options?.method !== "POST") return { profile };
      if (section === "learning") profile.learningStyleAndTemperament = values.description;
      else {
        const entry = { id: "saved-entry", entryDate: values.date, ...values };
        if (expected.section === "accompaniment") profile.accompaniments.push(entry);
        else if (section === "followups") profile.observations.push(entry);
        else if (section === "interventions") profile.interventions.push(entry);
        else profile.instruments.push(entry);
      }
      return { ok: true };
    },
  });
  await ui.ready();
  await ui.click(action);
  const html = ui.html();
  assert.match(html, new RegExp(save));
  for (const name of Object.keys(values)) {
    const input = ui.find((node) => ["input", "textarea", "select"].includes(node.type) && node.props.name === name);
    assert.ok(input, `Missing field ${name}`);
    assert.equal(input.props.required, true);
    if (name === "date") assert.equal(input.props.type, "date");
    else if (name !== "kind") assert.equal(input.props.maxLength, ["title", "name"].includes(name) ? 160 : 10000);
  }
  if (section === "learning") assert.match(html, /Descripción anterior/);
  if (values.kind && section === "followups") { assert.match(html, /Individual/); assert.match(html, /Familiar/); }
  if (section === "instruments") {
    const select = ui.find((node) => node.type === "select" && node.props.name === "kind");
    assert.equal(select.props.defaultValue, "");
    assert.match(html, new RegExp(`for="${select.props.id}">Tipo de instrumento`));
    const options = React.Children.toArray(select.props.children);
    assert.deepEqual(options.map((option) => [option.props.value, text(option)]), [
      ["", "Seleccioná un tipo"], ["QUESTIONNAIRE", "Cuestionario"], ["ASSESSMENT", "Prueba"],
      ["INTERVIEW", "Entrevista"], ["TEST", "Test"], ["OTHER", "Otro"],
    ]);
  }
  assert.doesNotMatch(html, /type="file"|contentEditable|diagnóstico/);
  await ui.submit(values);
  await ui.ready();
  assert.equal(ui.calls.length, 3);
  const post = ui.calls[1];
  assert.equal(post.url, section === "learning" ? "server-action:saveLearningReport" : `/api/teacher/students/student-2/psychopedagogy${action === "Agregar observación" ? "" : "/profile"}`);
  assert.equal(post.options.method, "POST");
  assert.equal(post.options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(post.options.body), expected);
  assert.equal(ui.calls[2].url, section === "learning" ? "server-action:readLearningReport" : "/api/teacher/students/student-2/psychopedagogy/profile");
  assert.deepEqual(ui.toasts, section === "instruments" ? [{ message: "Instrumento guardado correctamente.", type: "success" }] : section === "interventions" ? [{ message: "Intervención guardada correctamente.", type: "success" }] : section === "followups" ? [{ message: values.kind ? "Acompañamiento guardado correctamente." : "Bitácora guardada correctamente.", type: "success" }] : []);
  assert.doesNotMatch(ui.html(), /Seguimiento guardado correctamente/);
  assert.equal(ui.find((node) => node.type === "form"), undefined);
  if (section === "interventions" || section === "followups") await ui.click(values.title);
  if (section === "instruments") await ui.click(values.name);
  for (const value of Object.values(values)) {
    if (value !== values.date && value !== values.kind) assert.ok(ui.html().includes(value), `Missing persisted value: ${value}`);
  }
});

test("existing observations, both accompaniment kinds, five intervention fields and instruments render separately", async () => {
  const profile = {
    ...emptyProfile(),
    observations: [{ id: "o", entryDate: "2026-09-19T00:00:00.000Z", title: "Anterior", body: "Observación familiar" }],
    accompaniments: ["INDIVIDUAL", "FAMILY"].map((kind) => ({ id: kind, entryDate: "2026-09-19", kind, title: kind, body: "Encuentro" })),
    interventions: [{ id: "i", entryDate: "2026-09-19", title: "Informe", observationAnalysis: "OA", strategyFeedback: "SF", workPlan: "WP", implementation: "IM", evaluationResults: "ER" }],
    instruments: [{ id: "n", entryDate: "2026-09-19", name: "Cuestionario", body: "Aplicación" }],
  };
  for (const section of keys) {
    const ui = harness({ props: { section }, respond: () => ({ profile }) });
    await ui.ready();
    if (section === "interventions") await ui.click("Informe");
    if (section === "instruments") await ui.click("Cuestionario");
    const html = ui.html();
    if (section === "followups") {
      for (const value of ["Anterior", "Individual", "Familiar", "INDIVIDUAL", "FAMILY", "19/09/2026"]) assert.ok(html.includes(value), value);
      assert.doesNotMatch(html, /Observación familiar|Encuentro/);
      for (const [title, body] of [["Anterior", "Observación familiar"], ["INDIVIDUAL", "Encuentro"], ["FAMILY", "Encuentro"]]) {
        await ui.click(title);
        assert.ok(ui.html().includes(body), body);
        await ui.click("Volver a la tabla");
      }
    }
    if (section === "interventions") for (const value of ["OA", "SF", "WP", "IM", "ER"]) assert.ok(html.includes(value), value);
    if (section === "instruments") { assert.match(html, /Cuestionario/); assert.match(html, /Aplicación/); }
    if (section !== "followups") assert.doesNotMatch(html, /Observación familiar/);
  }
});

for (const section of keys) test(`${section}: readonly hides all writes`, async () => {
  const ui = harness({ props: { section, readOnly: true } });
  await ui.ready();
  assert.doesNotMatch(ui.html(), /<form|<textarea|<input|Editar descripción|Agregar observación|Nuevo acompañamiento|Nueva intervención|Registrar instrumento/);
  assert.equal(ui.calls.length, 1);
});

test("followups loading and error states align with the modal title", async () => {
  const ui = harness({ props: { section: "followups", followupsTabs: true }, respond: () => ({ error: "Error de prueba" }) });
  const loading = ui.find((node) => node.props.role === "status");
  assert.match(loading.props.className, /px-6/);
  await ui.ready();
  const alert = ui.find((node) => node.props.role === "alert");
  assert.match(alert.props.className, /px-6/);
  assert.match(text(alert), /Error de prueba/);
  assert.ok(ui.button("Reintentar"));
});

test("load failures preserve server messages and retry only the selected profile", async () => {
  let attempts = 0;
  const ui = harness({ respond: () => ++attempts === 1 ? { error: "Acceso denegado" } : { profile: emptyProfile() } });
  await ui.ready();
  assert.match(ui.html(), /role="alert"/);
  assert.match(ui.html(), /Acceso denegado/);
  await ui.click("Reintentar");
  await ui.ready();
  assert.equal(ui.calls.length, 2);
  assert.doesNotMatch(ui.html(), /Acceso denegado/);
});

test("save failures preserve server errors and form; cancellation performs no write", async () => {
  const ui = harness({ respond: (_url, options) => options?.method === "POST" ? { error: "Validación del servidor" } : { profile: emptyProfile() } });
  await ui.ready();
  await ui.click("Agregar observación");
  await ui.submit({ date: "2026-09-19", title: "Título", body: "Texto" });
  assert.match(ui.html(), /Validación del servidor/);
  assert.ok(ui.find((node) => node.type === "form"));
  await ui.click("Cancelar");
  assert.equal(ui.calls.length, 2);
  assert.doesNotMatch(ui.html(), /<form|Validación del servidor/);
  await ui.click("Agregar observación");
  assert.doesNotMatch(ui.html(), /Validación del servidor/);
});

test("cancel creation and close modal reset selection without POST", async () => {
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student] } });
  await ui.click("Ver seguimientos realizados de Bruno Gómez");
  await ui.ready();
  await ui.click("Nueva bitácora");
  await ui.click("Cancelar");
  await ui.click("Cerrar");
  await ui.click("Ver instrumentos psicopedagógicos aplicados de Bruno Gómez");
  await ui.ready();
  assert.doesNotMatch(ui.html(), /<form|Guardar reporte/);
  assert.equal(ui.calls.length, 2);
  assert.ok(ui.calls.every((call) => !call.options?.method));
});

test("closing a pending profile aborts and ignores its late response", async () => {
  let resolve;
  const ui = harness({ component: "PsychopedagogyClient", props: { students: [student] }, respond: () => new Promise((done) => { resolve = done; }) });
  await ui.click("Ver seguimientos realizados de Bruno Gómez");
  await ui.ready();
  assert.match(ui.html(), /Cargando/);
  const signal = ui.calls[0].options.signal;
  await ui.click("Cerrar");
  assert.equal(signal.aborted, true);
  resolve({ profile: { ...emptyProfile(), observations: [{ id: "old", entryDate: "2026-09-19", title: "Late", body: "Stale" }] } });
  await ui.ready();
  assert.doesNotMatch(ui.html(), /Late|Stale|role="dialog"/);
});

test("student switches abort stale GET and POST without leaking errors or records", async () => {
  let resolveGet;
  let resolvePost;
  const ui = harness({ respond: (url, options) => options?.method === "POST"
    ? new Promise((done) => { resolvePost = done; }) : url.includes("student-2")
      ? new Promise((done) => { resolveGet = done; }) : { profile: emptyProfile() } });
  await ui.ready();
  const firstSignal = ui.calls[0].options.signal;
  ui.changeStudent({ ...student, id: "student-3" });
  await ui.ready();
  assert.equal(firstSignal.aborted, true);
  resolveGet({ error: "Old GET error" });
  await ui.ready();
  assert.doesNotMatch(ui.html(), /Old GET error/);
  await ui.click("Agregar observación");
  const pending = ui.submit({ date: "2026-09-19", title: "Old", body: "Old" });
  await Promise.resolve();
  const post = ui.calls.at(-1);
  assert.match(post.url, /student-3\/psychopedagogy$/);
  ui.changeStudent({ ...student, id: "student-4" });
  await ui.ready();
  assert.equal(post.options.signal.aborted, true);
  resolvePost({ error: "Old POST error" });
  await pending;
  await ui.ready();
  assert.doesNotMatch(ui.html(), /Old POST error|<form/);
  assert.equal(ui.calls.length, 4);
});

test("detail accordion has four sections and fetches only expanded content", async () => {
  const ui = harness({ component: "PsychopedagogyProfile" });
  await ui.ready();
  assert.equal(ui.calls.length, 0);
  for (const label of labels) assert.match(ui.html(), new RegExp(label));
  // The design-system Accordion exposes controlled onValueChange to user triggers.
  const accordion = ui.find((node) => typeof node.props.onValueChange === "function");
  assert.ok(accordion);
  accordion.props.onValueChange(["learning"]);
  await ui.ready();
  assert.equal(ui.calls.length, 1);
  accordion.props.onValueChange([]);
  await ui.ready();
  assert.equal(ui.calls[0].transport, "server-action");
  accordion.props.onValueChange(["instruments"]);
  await ui.ready();
  assert.equal(ui.calls.length, 2);
  assert.match(ui.html(), /Registrar instrumento/);
  assert.doesNotMatch(ui.html(), /Editar descripción/);
});

test("initialSection expands only the requested detail editor", async () => {
  const ui = harness({ component: "PsychopedagogyProfile", props: { initialSection: "instruments" } });
  await ui.ready();
  assert.equal(ui.calls.length, 1);
  assert.match(ui.html(), /Registrar instrumento/);
  assert.doesNotMatch(ui.html(), /Editar descripción|Nueva intervención|Nuevo acompañamiento/);
});

test("pending saves disable fields, reject duplicate submits and ignore completion after cancel", async () => {
  let resolvePost;
  const ui = harness({ respond: (_url, options) => options?.method === "POST"
    ? new Promise((done) => { resolvePost = done; }) : { profile: emptyProfile() } });
  await ui.ready();
  await ui.click("Agregar observación");
  const values = { date: "2026-09-19", title: "Pending", body: "Pending" };
  const pending = ui.submit(values);
  await Promise.resolve();
  const post = ui.calls.at(-1);
  assert.equal(ui.button("Guardando…").props.disabled, true);
  for (const name of Object.keys(values)) assert.equal(ui.find((node) => node.props.name === name).props.disabled, true);
  await ui.submit(values);
  assert.equal(ui.calls.length, 2);
  await ui.click("Cancelar");
  assert.equal(post.options.signal.aborted, true);
  resolvePost({ ok: true });
  await pending;
  await ui.ready();
  assert.equal(ui.calls.length, 2);
  assert.doesNotMatch(ui.html(), /<form|Pending/);
  assert.deepEqual(ui.toasts, []);
});


test("student profile followups render read-only tables with both accompaniment types and navigable details", async () => {
  const profile = { ...emptyProfile(),
    observations: [{ id: "o1", entryDate: "2026-10-23", title: "Bitácora del alumno", body: "Detalle de bitácora" }],
    accompaniments: ["INDIVIDUAL", "FAMILY"].map((kind) => ({ id: kind, kind, entryDate: "2026-10-24", title: `Encuentro ${kind}`, body: `Detalle ${kind}` })),
  };
  const ui = harness({ props: { readOnly: true, section: "followups" }, respond: () => ({ profile }) });
  await ui.ready();
  const html = ui.html();
  assert.equal((html.match(/<table\b/g) ?? []).length, 2);
  assert.match(html, /Bitácoras de observación del alumno/);
  assert.match(html, /Acompañamientos del alumno/);
  assert.match(html, /23\/10\/2026/);
  assert.match(html, /24\/10\/2026/);
  assert.match(html, /<th[^>]*>Tipo/);
  assert.match(html, /Individual/);
  assert.match(html, /Familiar/);
  assert.match(html, /Encuentro INDIVIDUAL/);
  assert.match(html, /Encuentro FAMILY/);
  assert.doesNotMatch(html, /Detalle de bitácora|Detalle INDIVIDUAL|Detalle FAMILY|<form|Nueva bitácora|Nuevo acompañamiento/);
  for (const [title, body] of [["Bitácora del alumno", "Detalle de bitácora"], ["Encuentro INDIVIDUAL", "Detalle INDIVIDUAL"], ["Encuentro FAMILY", "Detalle FAMILY"]]) {
    await ui.click(title);
    assert.ok(ui.html().includes(body));
    await ui.click("Volver a la tabla");
    assert.equal((ui.html().match(/<table\b/g) ?? []).length, 2);
  }
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.calls[0].options.method, undefined);
});

test("student profile followup tables preserve empty states without editing controls", async () => {
  const ui = harness({ props: { readOnly: true, section: "followups" } });
  await ui.ready();
  const html = ui.html();
  assert.equal((html.match(/<table\b/g) ?? []).length, 2);
  assert.match(html, /Este alumno todavía no tiene observaciones/);
  assert.match(html, /Todavía no hay acompañamientos registrados/);
  assert.doesNotMatch(html, /<form|Nuevo acompañamiento|Agregar observación/);
});


test("student profile omits redundant heading and readonly legend while preserving its four sections", async () => {
  const ui = harness({ component: "PsychopedagogyProfile", props: { readOnly: true } });
  await ui.ready();
  const html = ui.html();
  assert.doesNotMatch(html, /<h2|Perfil de solo lectura\./);
  assert.match(html, /aria-label="Perfil psicopedagógico"/);
  for (const label of labels) assert.ok(html.includes(label), label);
  assert.equal(ui.calls.length, 0);
  assert.doesNotMatch(html, /<form|<textarea|<input/);
});
