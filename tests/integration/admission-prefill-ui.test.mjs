import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx, Fragment: "fragment" };
function nodes(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
function loadOnboarding() {
  const module = { exports: {} };
  const dependencies = {
    "react/jsx-runtime": runtime,
    react: { useState: value => [typeof value === "function" ? value() : value, () => {}], useTransition: () => [false, () => {}] },
    "next/navigation": { useRouter: () => ({}) },
    "next/link": { default: "link" },
    "lucide-react": { CheckCircle2: "check", Plus: "plus", Settings2: "settings" },
    "@/hooks/use-mobile": { useIsMobile: () => false },
    "@/modules/family-dashboard/server/family-student-record.actions": {},
  };
  const components = {
    "@/components/ui/badge": ["Badge"], "@/components/ui/button": ["Button"],
    "@/components/ui/card": ["Card", "CardContent"],
    "@/modules/family-dashboard/components/koru-id-card": ["KoruIdCard"],
    "@/components/ui/drawer": ["Drawer", "DrawerContent", "DrawerHeader", "DrawerTitle", "DrawerTrigger"],
    "@/components/ui/dropdown-menu": ["DropdownMenu", "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuTrigger"],
    "@/components/ui/input": ["Input"], "@/components/ui/label": ["Label"], "@/components/ui/textarea": ["Textarea"],
  };
  for (const [path, names] of Object.entries(components)) dependencies[path] = Object.fromEntries(names.map(name => [name, name]));
  vm.runInNewContext(ts.transpileModule(readFileSync("src/modules/family-dashboard/views/family-student-onboarding.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText, { module, exports: module.exports, require(name) { if (!(name in dependencies)) throw Error(name); return dependencies[name]; } });
  return module.exports.FamilyStudentOnboarding;
}
const prefill = { identity: { firstName: "Ana María", lastName: "López", birthDate: "2017-04-02", primaryFullName: "Lucía", primaryPhone: "123456", cityAndState: "Puebla" }, answers: {}, originalAnswers: {} };
const base = { students: [], groups: [], userName: "Lucía", familyLastName: "Familia López", admissionPrefill: prefill };
function fields(tree) {
  return Object.fromEntries(nodes(tree).filter(node => typeof node.props?.label === "string").map(node => [node.props.label, node.props.children.props.value]));
}

test("first registration visibly starts with the initial child's name and birth date", () => {
  const values = fields(loadOnboarding()(base));
  assert.equal(values["Nombre(s) del aprendiz"], "Ana María");
  assert.equal(values.Apellidos, "López");
  assert.equal(values["Fecha de nacimiento"], "2017-04-02");
});

test("existing draft identity is never replaced by initial admission data", () => {
  const student = { id: "student", firstName: "Nombre corregido", lastName: "Apellido corregido", birthDate: "2018-01-03T00:00:00Z", groupId: "group", recordStatus: "DRAFT", recordStep: 1, guardians: [], address: null, medicalProfile: null };
  const values = fields(loadOnboarding()({ ...base, students: [student] }));
  assert.equal(values["Nombre(s) del aprendiz"], student.firstName);
  assert.equal(values.Apellidos, student.lastName);
  assert.equal(values["Fecha de nacimiento"], "2018-01-03");
});

test("ordinary registration without an admission keeps historical empty defaults", () => {
  const values = fields(loadOnboarding()({ ...base, admissionPrefill: null }));
  assert.equal(values["Nombre(s) del aprendiz"], "");
  assert.equal(values.Apellidos, base.familyLastName);
  assert.equal(values["Fecha de nacimiento"], "");
});
