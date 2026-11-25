import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const migrationPath = "prisma/migrations/20261124120000_family_kind_and_admission_origin/migration.sql";

test("la migración es aditiva y preserva a las familias existentes como FAMILY", async () => {
  const sql = await read(migrationPath);

  assert.match(sql, /CREATE TYPE "FamilyKind" AS ENUM \('FAMILY', 'CANDIDATE'\);/);
  assert.match(sql, /ADD COLUMN "kind" "FamilyKind" NOT NULL DEFAULT 'FAMILY'/);
  assert.match(sql, /ADD COLUMN "admissionInquiryId" TEXT/);
  assert.match(sql, /CREATE UNIQUE INDEX "Family_admissionInquiryId_key" ON "Family"\("admissionInquiryId"\)/);
  assert.match(sql, /FOREIGN KEY \("admissionInquiryId"\) REFERENCES "AdmissionInquiry"\("id"\) ON DELETE SET NULL/);

  // Additive only: no destructive statements, no data rewrites of existing families.
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|TYPE|CONSTRAINT)\b/i);
  assert.doesNotMatch(sql, /\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(sql, /\bTRUNCATE\b/i);
  assert.doesNotMatch(sql, /UPDATE "Family"/);
});

test("el esquema declara el tipo de familia y el origen de admisión único y opcional", async () => {
  const schema = await read("prisma/schema.prisma");

  assert.match(schema, /enum FamilyKind \{\s*FAMILY\s*CANDIDATE\s*\}/);
  assert.match(schema, /kind\s+FamilyKind\s+@default\(FAMILY\)/);
  assert.match(schema, /admissionInquiryId\s+String\?\s+@unique/);
  assert.match(schema, /admissionInquiry\s+AdmissionInquiry\?\s+@relation\(fields: \[admissionInquiryId\], references: \[id\], onDelete: SetNull\)/);
  assert.match(schema, /model AdmissionInquiry \{[\s\S]*?family\s+Family\?/);
});

test("la creación guarda tipo y origen dentro de la misma transacción que las invitaciones", async () => {
  const service = await read("src/modules/families/server/family-import.service.ts");
  const transaction = service.slice(service.indexOf("prisma.$transaction(async (tx)"), service.indexOf("return { ok: true as const"));

  assert.match(transaction, /familyCreationRecord\(/);
  assert.match(transaction, /tx\.family\.create\(/);
  assert.match(transaction, /tx\.family\.findUnique\(\{ where: \{ admissionInquiryId/);
  assert.match(transaction, /createInvitationDeliveryJob\(/);
  // The origin must be validated before any invitation row is written for that family.
  assert.ok(transaction.indexOf("familyCreationRecord(") < transaction.indexOf("createInvitationDeliveryJob("));
});

test("la importación regular conserva invitaciones, transacción y ausencia de escrituras financieras", async () => {
  const service = await read("src/modules/families/server/family-import.service.ts");

  // Regular rows (no kind, no origin) keep the historical FAMILY default from the shared rule.
  assert.match(service, /resolveImportRowKind\(\{ kind: row\.kind, admissionInquiryId \}\)/);
  assert.doesNotMatch(service, /kind: "CANDIDATE"/);
  // One invitation per email, queued in the same serializable transaction that writes the family.
  assert.match(service, /prisma\.\$transaction\(async \(tx\)[\s\S]*isolationLevel: "Serializable"/);
  assert.match(service, /for \(const email of row\.emails\) \{[\s\S]*createInvitationDeliveryJob\(tx,/);
  assert.match(service, /deliveryJobIds\.push\(job\.id\)/);
  // Candidate kind never changes the operational status or the financial ledger.
  assert.doesNotMatch(service, /FamilyStatus/);
  assert.doesNotMatch(service, /data: \{[^}]*status/);
  assert.doesNotMatch(service, /familyPayment|familyAccountEntry|paymentReceipt/);
});

test("la acción de conversión sólo actualiza el tipo y está protegida por families.manage", async () => {
  const actions = await read("src/modules/families/server/families.actions.ts");
  const start = actions.indexOf("export async function convertCandidateFamilyAction");
  assert.notEqual(start, -1, "convertCandidateFamilyAction must be exported");
  const end = actions.indexOf("\nexport async function", start + 1);
  const action = actions.slice(start, end === -1 ? undefined : end);

  assert.match(
    action,
    /export async function convertCandidateFamilyAction\(\s*previousState: CreateFamilyState,\s*formData: FormData,?\s*\): Promise<CreateFamilyState>/,
  );
  assert.match(action, /requirePermission\("families\.manage"\)/);
  assert.match(action, /value\(formData, "familyId"\)/);
  assert.match(action, /prisma\.family\.updateMany\([\s\S]*?data: \{ kind: "FAMILY" \}/);
  assert.doesNotMatch(action, /data: \{[^}]*status/);
  assert.doesNotMatch(action, /prisma\.(familyPayment|familyAccountEntry|userInvitation|user)\./);
  assert.doesNotMatch(action, /role:/);
  // Idempotent and failure states are explicit; the guard runs before any read or write.
  assert.ok(action.indexOf('requirePermission("families.manage")') < action.indexOf("prisma.family.findUnique"));
  assert.match(action, /if \(candidateConversionOutcome\(family\.kind\) === "already-family"\)/);
  assert.match(action, /message: `\$\{family\.name\} ya es una familia\.`/);
  assert.match(action, /message: "La familia ya no existe\. Actualizá la página e intentá nuevamente\."/);
  assert.match(action, /message: "No pudimos convertir la familia candidata\. Intentá nuevamente\."/);
  assert.match(action, /revalidatePath\("\/dashboard\/families"\)/);
  // The conversion changes the candidate badge in the list and the detail header.
  assert.match(action, /revalidatePath\(`\/dashboard\/families\/\$\{family\.id\}`\)/);
});

test("la creación desde admisión carga el origen en el servidor y valida permisos de contactos", async () => {
  const actions = await read("src/modules/families/server/families.actions.ts");
  const start = actions.indexOf("export async function createFamilyAction");
  const end = actions.indexOf("\nexport async function", start + 1);
  const action = actions.slice(start, end === -1 ? undefined : end);

  assert.match(action, /requiredPermissionsForFamilyCreation\(admissionInquiryId\)/);
  assert.match(action, /requirePermission\(requiredPermissions\[0\]\)/);
  assert.match(action, /for \(const permission of requiredPermissions\.slice\(1\)\)/);
  assert.match(action, /loadAdmissionOrigin\(admissionInquiryId\)/);
  assert.match(action, /resolveFamilyCreationDraft\(/);
  assert.match(action, /admissionInquiryId: draft\.admissionInquiryId/);
  assert.match(action, /if \(lookup\.status === "already-linked"\)/);
  assert.doesNotMatch(action, /prisma\.family\.create/);
  // A duplicate origin is reported to the operator instead of creating a second family.
  assert.match(action, /if \(code === "family_admission_origin_conflict"\)/);
  assert.match(action, /message: "Ese contacto de admisión ya tiene una familia creada\."/);
  // Revalidate the real contacts route after creating from an admission.
  assert.match(action, /revalidatePath\("\/dashboard\/contactos"\)/);
  assert.doesNotMatch(action, /"\/dashboard\/contacts"/);

  const service = await read("src/modules/families/server/candidate-family.service.ts");
  assert.match(service, /prisma\.admissionInquiry\.findUnique\(/);
  assert.match(service, /select: \{ id: true, guardianNames: true, childName: true, email: true, family: \{ select: \{ id: true \} \} \}/);
  assert.match(service, /if \(admission\.family\) return \{ status: "already-linked" \}/);
});
