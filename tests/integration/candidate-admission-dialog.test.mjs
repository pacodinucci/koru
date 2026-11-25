import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const jsx = (type, props) => ({ type, props });
function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
function text(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node !== "object") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  return text(node.props?.children);
}
function harness({ empty = false, loadFails = false, creationStatus = "success" } = {}) {
  let cursor = 0;
  const states = [];
  const pending = [];
  const calls = { loads: 0, creations: [] };
  let linked = false;
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    react: {
      useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial; return [states[i], value => { states[i] = typeof value === "function" ? value(states[i]) : value; }]; },
      useTransition() { return [false, callback => pending.push(Promise.resolve(callback()))]; },
      useActionState(action, initial) { return [initial, action]; },
    },
    "react-dom": { useFormStatus: () => ({ pending: false }) },
    "lucide-react": { PlusIcon: "plus", UserRoundPlusIcon: "candidate-icon", UsersRoundIcon: "family-icon" },
    "@/modules/families/server/families.actions": { async createFamilyAction(_previous, data) { calls.creations.push(data); if (creationStatus === "success" || creationStatus === "warning") linked = true; return { status: creationStatus, message: "Resultado" }; } },
    "@/modules/families/server/candidate-admissions.actions": { async listCandidateAdmissionsAction() {
      calls.loads++;
      if (loadFails) throw Error("unavailable");
      return empty || linked ? [] : [{ id: "inquiry-1", childName: "Ana López", guardianNames: "Lucía López", email: "lucia@example.test" }];
    } },
  };
  for (const [path, names] of Object.entries({
    "@/components/ui/button": ["Button"], "@/components/ui/input": ["Input"],
    "@/components/ui/dropdown-menu": ["DropdownMenu", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuTrigger"],
    "@/components/ui/responsive-dialog": ["ResponsiveDialog", "ResponsiveDialogBody", "ResponsiveDialogContent", "ResponsiveDialogDescription", "ResponsiveDialogHeader", "ResponsiveDialogTitle"],
  })) dependencies[path] = Object.fromEntries(names.map(name => [name, name]));
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync("src/modules/families/components/create-family-dialog.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports,
    require(name) { if (!(name in dependencies)) throw Error(name); return dependencies[name]; },
  });
  function render(props = {}) { cursor = 0; return module.exports.CreateFamilyDialog(props); }
  async function openCandidate() {
    const option = nodes(render()).find(node => node.type === "DropdownMenuItem" && text(node).includes("Familia candidata"));
    option.props.onClick();
    await Promise.all(pending.splice(0));
    return render();
  }
  return { render, openCandidate, calls, flush: () => Promise.all(pending.splice(0)), states };
}

test("candidate option opens existing responsive dialog with initial inquiries instead of a manual form", async () => {
  const h = harness();
  const tree = await h.openCandidate();
  assert.equal(nodes(tree).find(node => node.type === "ResponsiveDialog").props.open, true);
  assert.equal(h.calls.loads, 1);
  assert.match(text(tree), /Ana López/);
  assert.match(text(tree), /Lucía López/);
  assert.match(text(tree), /lucia@example.test/);
  assert.equal(nodes(tree).some(node => typeof node.type === "function" && node.type.name === "FamilyCreationForm"), false);
  assert.equal(h.calls.creations.length, 0);
});

test("selecting inquiry passes its ID and existing identity to the invitation form", async () => {
  const h = harness();
  const tree = await h.openCandidate();
  const choice = nodes(tree).find(node => node.type === "Button" && text(node).includes("Ana López"));
  choice.props.onClick();
  const form = nodes(h.render()).find(node => typeof node.type === "function" && node.type.name === "FamilyCreationForm");
  assert.equal(form.props.admissionInquiryId, "inquiry-1");
  assert.equal(form.props.initialName, "Lucía López");
  assert.equal(form.props.initialEmail, "lucia@example.test");
  assert.equal(form.props.kind, "CANDIDATE");
});

test("empty and failed loads are distinct and never fall back to unlinked manual candidate creation", async () => {
  for (const options of [{ empty: true }, { loadFails: true }]) {
    const h = harness(options);
    const tree = await h.openCandidate();
    assert.equal(nodes(tree).some(node => typeof node.type === "function" && node.type.name === "FamilyCreationForm"), false);
    assert.match(text(tree), options.empty ? /No hay solicitudes/ : /No pudimos cargar/);
  }
});

test("ordinary family and direct Contact admission entry preserve existing behavior", () => {
  const h = harness();
  const tree = h.render();
  assert.equal(h.calls.loads, 0);
  const regular = nodes(tree).find(node => typeof node.type === "function" && node.type.name === "FamilyCreationForm");
  assert.equal(regular.props.kind, "FAMILY");
  const contact = nodes(h.render({ admissionInquiryId: "contact-origin", initialName: "Familia origen", initialEmail: "origen@example.test" })).find(node => typeof node.type === "function" && node.type.name === "FamilyCreationForm");
  assert.equal(contact.props.admissionInquiryId, "contact-origin");
  assert.equal(contact.props.initialEmail, "origen@example.test");
  assert.equal(h.calls.loads, 0);
});

for (const creationStatus of ["success", "warning", "error"]) {
  test(`returning to selection after ${creationStatus} reflects whether the source was linked`, async () => {
    const h = harness({ creationStatus });
    const tree = await h.openCandidate();
    nodes(tree).find(node => node.type === "Button" && text(node).includes("Ana López")).props.onClick();
    const form = nodes(h.render()).find(node => typeof node.type === "function" && node.type.name === "FamilyCreationForm");
    const renderedForm = form.type(form.props);
    const result = await renderedForm.props.action({ status: "idle", message: null }, new FormData());
    assert.equal(result.status, creationStatus);
    assert.equal(h.calls.creations.length, 1);
    form.props.onBack();
    await h.flush();
    const selector = h.render();
    if (creationStatus === "error") assert.match(text(selector), /Ana López/);
    else assert.match(text(selector), /No hay solicitudes/);
    assert.equal(h.calls.loads, 2);
  });
}
