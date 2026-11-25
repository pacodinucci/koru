import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(path, dependencies = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require(name) { if (!(name in dependencies)) throw Error(name); return dependencies[name]; } });
  return module.exports;
}
const rules = () => load("src/modules/family-dashboard/lib/admission-prefill.ts");
const origin = { childName: "Ana María López", guardianNames: "Lucía López", phone: "+52 12345678", email: "lucia@example.test", answers: { birthDate: "2017-04-02", city: "Puebla", relationships: "Juega en grupo", dailyRhythm: "Rutina tranquila", supportNeeds: "Sin necesidades", childDescription: "Curiosa" } };

test("initial identity and contact data are prefilled without inventing medical facts", () => {
  const prefill = rules().buildAdmissionPrefill(origin);
  assert.equal(prefill.identity.firstName, "Ana María");
  assert.equal(prefill.identity.lastName, "López");
  assert.equal(prefill.identity.birthDate, "2017-04-02");
  assert.equal(prefill.identity.primaryFullName, "Lucía López");
  assert.equal(prefill.identity.primaryPhone, "+52 12345678");
  assert.equal(prefill.identity.cityAndState, "Puebla");
  assert.equal(prefill.answers.relationships, "Juega en grupo");
  assert.equal(prefill.answers.dailyRhythms, "Rutina tranquila");
  assert.equal(prefill.answers.supportNeeds, "Sin necesidades");
  assert.equal(prefill.answers.allergiesAndDiet, undefined);
  assert.equal(prefill.originalAnswers.childDescription, "Curiosa");
});

test("saved edits including intentionally blank answers override initial suggestions", () => {
  const { buildAdmissionPrefill, mergeAdmissionAnswers } = rules();
  const result = mergeAdmissionAnswers(buildAdmissionPrefill(origin).answers, { relationships: "Actualizado", supportNeeds: "" });
  assert.equal(result.relationships, "Actualizado");
  assert.equal(result.supportNeeds, "");
  assert.equal(result.dailyRhythms, "Rutina tranquila");
});

test("student matching excludes siblings and accepts normalized names", () => {
  const { matchesAdmissionStudent } = rules();
  assert.equal(matchesAdmissionStudent(origin, { firstName: "ANA MARIA", lastName: "LOPEZ", birthDate: new Date("2017-04-02T00:00:00Z") }), true);
  assert.equal(matchesAdmissionStudent(origin, { firstName: "Juan", lastName: "López", birthDate: new Date("2017-04-02T00:00:00Z") }), false);
  assert.equal(matchesAdmissionStudent(origin, { firstName: "Ana María", lastName: "López", birthDate: new Date("2019-04-02T00:00:00Z") }), false);
});

test("unlinked ordinary families keep empty prefill and historical answers", () => {
  assert.equal(rules().buildAdmissionPrefill(null), null);
  assert.equal(rules().mergeAdmissionAnswers({}, { relationships: "Existente" }).relationships, "Existente");
});

test("server lookup is family-scoped and rejects a different child", async () => {
  const calls = [];
  const service = load("src/modules/family-dashboard/server/admission-prefill.repository.ts", {
    "server-only": {},
    "@/modules/family-dashboard/lib/admission-prefill": rules(),
    "@/lib/prisma": { prisma: { family: { async findUnique(query) { calls.push(query); return { admissionInquiry: origin }; } } } },
  });
  assert.equal(await service.getAdmissionPrefill(null), null);
  assert.equal(calls.length, 0);
  assert.equal(await service.getAdmissionPrefill("family-1", { firstName: "Juan", lastName: "López", birthDate: new Date("2017-04-02") }), null);
  assert.equal(calls[0].where.id, "family-1");
  const result = await service.getAdmissionPrefill("family-1");
  assert.equal(result.identity.primaryPhone, origin.phone);
});

const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx, Fragment: "fragment" };
function descendants(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(descendants);
  return [node, ...descendants(node.props?.children)];
}

test("questionnaire route passes inherited answers and saved edits only for an owned matching child", async () => {
  const queries = [];
  let owned = true;
  const form = "questionnaire-form";
  const page = load("src/app/(family-dashboard)/family-dashboard/cuestionario-ingreso/[studentId]/page.tsx", {
    "react/jsx-runtime": runtime,
    "next/link": { default: "link" },
    "next/navigation": { notFound() { throw Error("not_found"); } },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/card": { Card: "card", CardHeader: "header", CardTitle: "title", CardContent: "content" },
    "@/components/ui/sidebar": { SidebarInset: "inset", SidebarProvider: "provider" },
    "@/lib/prisma": { prisma: { student: { async findFirst(query) {
      queries.push(query);
      return owned ? { id: "student-1", firstName: "Ana María", lastName: "López", birthDate: new Date("2017-04-02"), guardians: [], family: null, admissionQuestionnaire: { answers: { relationships: "Editado", supportNeeds: "" }, submittedAt: null } } : null;
    } } } },
    "@/modules/family-dashboard/components/family-dashboard-header": { FamilyDashboardHeader: "header" },
    "@/modules/family-dashboard/components/family-sidebar": { FamilySidebar: "sidebar" },
    "@/modules/family-dashboard/lib/admission-questionnaire": load("src/modules/family-dashboard/lib/admission-questionnaire.ts"),
    "@/modules/family-dashboard/lib/admission-prefill": rules(),
    "@/modules/family-dashboard/server/admission-prefill.repository": { async getAdmissionPrefill(familyId, student) {
      assert.equal(familyId, "family-1");
      assert.equal(student.id, "student-1");
      return rules().buildAdmissionPrefill(origin);
    } },
    "@/modules/family-dashboard/server/family-dashboard-access": { async requireFamilyDashboardAccess() { return { viewer: { name: "Lucía", email: origin.email }, familyUser: { familyId: "family-1" } }; } },
    "@/modules/family-dashboard/views/admission-questionnaire-form": { AdmissionQuestionnaireForm: form },
  }).default;
  const tree = await page({ params: Promise.resolve({ studentId: "student-1" }) });
  const props = descendants(tree).find(node => node.type === form).props;
  assert.equal(queries[0].where.familyId, "family-1");
  assert.equal(props.initialAnswers.relationships, "Editado");
  assert.equal(props.initialAnswers.supportNeeds, "");
  assert.equal(props.initialAnswers.dailyRhythms, "Rutina tranquila");
  assert.equal(props.originalAnswers.childDescription, "Curiosa");
  owned = false;
  await assert.rejects(page({ params: Promise.resolve({ studentId: "foreign" }) }), /not_found/);
});

test("new student persists canonical guardian contact, while ordinary creation keeps prior defaults", async () => {
  let prefill = rules().buildAdmissionPrefill(origin);
  const writes = [];
  const repository = load("src/modules/family-dashboard/server/family-student-record.repository.ts", {
    "server-only": {},
    "@prisma/client": { Prisma: {} },
    "@/modules/families/lib/family-student-access-policy": { canAccessFamilyStudent: () => true },
    "@/modules/family-dashboard/server/admission-prefill.repository": { async getAdmissionPrefill() { return prefill; } },
    "@/lib/prisma": { prisma: {
      studentGroup: { async findFirst() { return { id: "group" }; } },
      student: { async create(query) { writes.push(query.data); return { id: "created" }; } },
    } },
  });
  const input = { firstName: "Ana María", lastName: "López", birthDate: "2017-04-02", documentType: "CURP", documentNumber: "", groupId: "group" };
  const user = { id: "parent", name: "Lucía", email: origin.email, familyId: "family-1" };
  assert.equal((await repository.saveFamilyStudentIdentity(input, user)).id, "created");
  assert.equal(writes[0].guardians.create.phone, origin.phone);
  assert.equal(writes[0].guardians.create.fullName, origin.guardianNames);
  prefill = null;
  await repository.saveFamilyStudentIdentity(input, user);
  assert.equal(writes[1].guardians.create.fullName, user.name);
  assert.equal(writes[1].guardians.create.phone, null);
});

test("clearing the saved family city does not resurrect admission data", async () => {
  let family = { streetAndNumber: null, neighborhood: null, cityAndState: null, postalCode: null };
  const repository = load("src/modules/family-dashboard/server/family-profile.repository.ts", {
    "server-only": {},
    "@/lib/prisma": { prisma: {
      user: { async findUnique() { return { familyId: "family-1", family, familyProfile: null }; } },
      family: { async update({ where, data }) { assert.equal(where.id, "family-1"); family = { ...family, ...data }; return family; } },
    } },
    "@/modules/family-dashboard/server/admission-prefill.repository": { async getAdmissionPrefill(familyId) {
      assert.equal(familyId, "family-1"); return { identity: { cityAndState: "Puebla" } };
    } },
  });
  assert.equal((await repository.getFamilyProfile("owner")).cityAndState, "Puebla");
  const input = { streetAndNumber: "", neighborhood: "", cityAndState: "Ciudad corregida", postalCode: "" };
  await repository.saveFamilyProfile("owner", input);
  assert.equal((await repository.getFamilyProfile("owner")).cityAndState, "Ciudad corregida");
  await repository.saveFamilyProfile("owner", { ...input, cityAndState: "" });
  assert.equal((await repository.getFamilyProfile("owner")).cityAndState ?? "", "", "An explicitly cleared city must remain blank");
});
