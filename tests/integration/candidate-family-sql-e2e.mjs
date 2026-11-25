import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import vm from "node:vm";
import pg from "pg";
import ts from "typescript";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Refuse configured databases: this probe owns only the freshly prepared baseline database.
const target = "postgresql://candidate_test@127.0.0.1:55553/candidate_sql";
assert.equal(process.env.TEST_DATABASE_URL, target, "Explicit disposable SQL target required");
const pool = new pg.Pool({ connectionString: target, connectionTimeoutMillis: 3000 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const require = createRequire(import.meta.url);
const permissions = new Set(["families.manage", "contacts.view", "contacts.manage"]);
const actor = { id: "candidate-sql-admin" };
const cache = new Map();
const revalidated = [];
const stubs = {
  "server-only": {},
  "@/lib/prisma": { prisma },
  "@/lib/env": { env: { DATABASE_URL: target, INVITATION_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64") } },
  "next/cache": { revalidatePath(path) { revalidated.push(path); } },
  "@/modules/auth/server/auth-guards": { async requirePermission(key) { if (!permissions.has(key)) throw new Error("test_forbidden"); return actor; } },
  "@/modules/families/server/families.repository": {},
  "@/modules/families/lib/family-financial-summary": {},
  "@/modules/mailing/server/invitation-delivery-worker.service": { async runInvitationDeliveryWorker() {} },
  "@/modules/users/lib/user-invitation-feedback": {},
  "@/modules/users/server/users.repository": {},
};
function load(path) {
  path = resolve(path);
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} };
  cache.set(path, module);
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const localRequire = (name) => {
    if (name in stubs) return stubs[name];
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    if (name.startsWith(".")) return load(resolve(dirname(path), `${name}.ts`));
    return require(name);
  };
  vm.runInThisContext(`(function(exports, require, module) { ${code}\n})`, { filename: path })(module.exports, localRequire, module);
  return module.exports;
}
const actions = load("src/modules/families/server/families.actions.ts");
const imports = load("src/modules/families/server/family-import.service.ts");
const results = [];
async function check(name, run) { await run(); results.push(name); console.log(`PASS ${name}`); }
function form(values) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
const initial = { status: "idle", message: null };
const create = (values) => actions.createFamilyAction(initial, form(values));
async function counters() {
  return Promise.all([prisma.family.count(), prisma.userInvitation.count(), prisma.invitationDeliveryJob.count(), prisma.familyAccountEntry.count()]);
}
async function origin(key) {
  return prisma.admissionInquiry.create({ data: { guardianNames: `Origen ${key}`, childName: "Niña prueba", email: `${key}@example.test`, phone: "1234567890", answers: { childName: "Niña prueba", guardianNames: `Origen ${key}`, email: `${key}@example.test` }, questionnaireVersion: "initial-v1", idempotencyKey: randomUUID(), fingerprint: key } });
}
try {
  await check("additive migration preserves a preexisting regular family", async () => {
    const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='Family' AND column_name='kind'");
    assert.equal(columns.rowCount, 0, "Probe requires the original baseline, not a previously migrated DB");
    await pool.query('INSERT INTO "Family" (id,name,"updatedAt") VALUES ($1,$2,now())', ["historical-family", "Historical family"]);
    await pool.query(readFileSync("prisma/migrations/20261124120000_family_kind_and_admission_origin/migration.sql", "utf8"));
    const family = await prisma.family.findUniqueOrThrow({ where: { id: "historical-family" } });
    assert.equal(family.kind, "FAMILY"); assert.equal(family.name, "Historical family"); assert.equal(family.admissionInquiryId, null); assert.equal(family.status, "ACTIVE");
  });
  await prisma.user.create({ data: { id: actor.id, name: "Synthetic admin", email: "candidate-sql-admin@example.test", role: "ADMIN" } });
  await check("normal family stays FAMILY; manual candidate creates two real invitation jobs", async () => {
    const normal = await create({ name: "Regular SQL family", primaryEmail: "regular-sql@example.test" });
    assert.equal(normal.status, "warning");
    const result = await create({ kind: "CANDIDATE", name: "Manual candidate SQL", primaryEmail: "manual-sql@example.test", secondaryEmail: "manual-second@example.test" });
    assert.equal(result.status, "warning");
    assert.equal((await prisma.family.findFirstOrThrow({ where: { name: "Regular SQL family" } })).kind, "FAMILY");
    const candidate = await prisma.family.findFirstOrThrow({ where: { name: "Manual candidate SQL" }, include: { invitations: true } });
    assert.equal(candidate.kind, "CANDIDATE"); assert.equal(candidate.invitations.length, 2);
    assert.equal(await prisma.invitationDeliveryJob.count({ where: { invitationId: { in: candidate.invitations.map((item) => item.id) } } }), 2);
  });
  let source, family;
  await check("source action accepts edited name and recipient without changing the original inquiry", async () => {
    source = await origin("canonical-sql");
    const result = await create({ admissionInquiryId: source.id, kind: "FAMILY", name: "Edited family", primaryEmail: "edited@example.test", secondaryEmail: "canonical-second@example.test" });
    assert.equal(result.status, "warning");
    family = await prisma.family.findUniqueOrThrow({ where: { admissionInquiryId: source.id }, include: { invitations: true } });
    assert.equal(family.kind, "CANDIDATE"); assert.equal(family.name, "Edited family");
    assert.deepEqual(family.invitations.map((item) => item.email).sort(), ["edited@example.test", "canonical-second@example.test"].sort());
    assert.equal(await prisma.userInvitation.count({ where: { email: source.email } }), 0);
    assert.deepEqual(await prisma.admissionInquiry.findUniqueOrThrow({ where: { id: source.id } }), source);
  });
  await check("denied origin permissions and rejected inputs preserve all counters", async () => {
    const before = await counters();
    const other = await origin("denied-sql");
    permissions.delete("contacts.manage");
    await assert.rejects(create({ admissionInquiryId: other.id, name: "Denied", primaryEmail: other.email }), /test_forbidden/);
    permissions.add("contacts.manage");
    for (const input of [
      { admissionInquiryId: source.id, name: "Duplicate", primaryEmail: source.email },
      { kind: "CANDIDATE", name: "Invalid email", primaryEmail: "a..b@example.com" },
      { kind: "CANDIDATE", name: "Same emails", primaryEmail: "same@example.test", secondaryEmail: "same@example.test" },
    ]) assert.equal((await create(input)).status, "error");
    assert.equal((await actions.confirmFamilyImportAction([{ rowNumber: 1, familyName: "Bypass", motherEmail: "bypass@example.test", admissionInquiryId: other.id }])).status, "error");
    assert.deepEqual(await counters(), before);
  });
  await check("concurrent source creation persists one family and one invitation/job set", async () => {
    const input = await origin("concurrent-sql");
    const values = { admissionInquiryId: input.id, name: input.guardianNames, primaryEmail: input.email };
    const outcomes = await Promise.all([create(values), create(values), create(values)]);
    assert.equal(outcomes.filter((item) => item.status !== "error").length, 1);
    assert.equal(await prisma.family.count({ where: { admissionInquiryId: input.id } }), 1);
    const invitation = await prisma.userInvitation.findUniqueOrThrow({ where: { email: input.email } });
    assert.equal(await prisma.invitationDeliveryJob.count({ where: { invitationId: invitation.id } }), 1);
  });
  await check("forced delivery-job insert failure rolls back family, invitations and origin link", async () => {
    const input = await origin("rollback-sql");
    const before = await counters();
    await pool.query(`CREATE FUNCTION candidate_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'candidate_test_forced_failure'; END $$; CREATE TRIGGER candidate_test_failure BEFORE INSERT ON "InvitationDeliveryJob" FOR EACH ROW EXECUTE FUNCTION candidate_test_failure()`);
    try {
      const result = await create({ admissionInquiryId: input.id, name: input.guardianNames, primaryEmail: input.email });
      assert.equal(result.status, "error");
      assert.deepEqual(await counters(), before);
      assert.equal(await prisma.family.count({ where: { admissionInquiryId: input.id } }), 0);
    } finally { await pool.query('DROP TRIGGER candidate_test_failure ON "InvitationDeliveryJob"; DROP FUNCTION candidate_test_failure()'); }
  });
  await check("conversion preserves identity, students, users, invitations and ledger; second conversion is no-op", async () => {
    const group = await prisma.studentGroup.create({ data: { name: "SQL test", slug: "candidate-sql", ageRange: "Test" } });
    await prisma.user.create({ data: { id: "linked-parent", name: "Synthetic parent", email: "linked-parent@example.test", familyId: family.id } });
    await prisma.student.create({ data: { firstName: "Niña", lastName: "Prueba", birthDate: new Date("2020-01-01"), familyId: family.id, groupId: group.id } });
    await prisma.familyAccountEntry.create({ data: { familyId: family.id, type: "MONTHLY_CHARGE", description: "Synthetic existing charge", amount: 100 } });
    const snapshot = async () => JSON.stringify(await prisma.family.findUniqueOrThrow({ where: { id: family.id }, include: { users: true, students: true, invitations: true, accountEntries: true } }), (key, value) => key === "kind" || key === "updatedAt" ? undefined : value);
    const before = await snapshot();
    assert.equal((await actions.convertCandidateFamilyAction(initial, form({ familyId: family.id }))).status, "success");
    assert.equal((await prisma.family.findUniqueOrThrow({ where: { id: family.id } })).kind, "FAMILY");
    assert.equal(await snapshot(), before);
    const count = await counters();
    assert.equal((await actions.convertCandidateFamilyAction(initial, form({ familyId: family.id }))).status, "success");
    assert.equal(await snapshot(), before); assert.deepEqual(await counters(), count);
    assert.ok(revalidated.includes(`/dashboard/families/${family.id}`));
  });
  console.log(`SQL acceptance: ${results.length}/${results.length} passed; real PostgreSQL + Prisma/services/actions, auth and network stubbed`);
} finally { await prisma.$disconnect(); await pool.end(); }
