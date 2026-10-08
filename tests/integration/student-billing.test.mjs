import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { previewStudentBilling, synchronizeStudentBilling } from "../../src/modules/families/server/student-billing.core.ts";
const now = new Date("2026-10-07T12:00:00Z");
const d = value => new Prisma.Decimal(value);
function setup({ legacy = 0, manual = false, future = false } = {}) {
 const plan = { id: "plan", name: "Anual", isActive: true, annualFee: d(1200), discountPercent: d(0), installmentCount: 12, startMonth: 3, eventualChargeItems: [{ id: "materials", name: "Materiales", suggestedAmount: d(250), discountPercent: d(0), installmentCount: 2, startMonth: future ? 11 : 3 }] };
 const family = { id: "family", status: "ACTIVE", students: ["Ana", "Beto"].map((name, i) => ({ id: "student" + i, firstName: name, lastName: "Familia", familyId: "family", plan })) };
 const schedules = manual ? [{ id: "manual", familyId: "family", studentId: null, eventualChargeItemId: "materials", startPeriod: new Date("2026-03-01T00:00:00Z"), isBase: false, accountEntries: [] }] : [];
 const entries = []; let counter = 0;
 const db = {
 family: { findUniqueOrThrow: async () => family },
 familyAccountEntry: { count: async args => args.where.type === "MONTHLY_CHARGE" ? legacy : 0, createMany: async ({ data }) => { let count = 0; for(const e of data) if(!entries.some(x => x.eventualChargeScheduleId === e.eventualChargeScheduleId && x.installmentNumber === e.installmentNumber)) { entries.push(e); count++; } return { count }; } },
 eventualChargeSchedule: {
 createMany: async ({ data }) => { for(const p of data) if(!schedules.some(s => s.sourceKey === p.sourceKey)) schedules.push({ ...p, id: "schedule" + counter++, accountEntries: [] }); },
 findMany: async ({ where }) => schedules.filter(s => (!where.id || s.id === where.id) && (!where.startPeriod || s.startPeriod <= where.startPeriod.lte)).map(s => ({ ...s, student: family.students.find(x => x.id === s.studentId), accountEntries: entries.filter(e => e.eventualChargeScheduleId === s.id).map(e => ({ installmentNumber: e.installmentNumber })) }))
 }
 };
 return { db, schedules, entries, family };
}
test("hermanos con el mismo plan generan cuota y rubros propios", async () => {
 const f = setup(); const p = await previewStudentBilling(f.db, "family", now);
 assert.equal(p.proposals.length, 4); assert.equal(p.charges.length, 20);
 assert.equal(p.charges.reduce((sum, c) => sum + Number(c.amount), 0), 2100);
 assert.equal(new Set(p.proposals.map(x => x.sourceKey)).size, 4);
 assert.equal((await synchronizeStudentBilling(f.db, "family", "admin", now, p.token)).ok, true);
 assert.equal(f.entries.length, 20);
 assert.equal(f.entries.filter(e => e.type === "MONTHLY_CHARGE").length, 16);
 await synchronizeStudentBilling(f.db, "family", "admin", now);
 assert.equal(f.entries.length, 20);
 assert.match(f.entries[0].description, /Ana/);
});
test("cargos base antiguos bloquean sin modificar ni duplicar", async () => {
 const f = setup({ legacy: 1 });
 assert.equal((await synchronizeStudentBilling(f.db, "family", "admin", now)).ok, false);
 assert.equal(f.schedules.length, 0); assert.equal(f.entries.length, 0);
});
test("rubro manual sin alumno requiere conciliación", async () => {
 const f = setup({ manual: true }); const p = await previewStudentBilling(f.db, "family", now);
 assert.ok(p.warnings.some(w => w.includes("cronograma manual")));
 assert.equal((await synchronizeStudentBilling(f.db, "family", "admin", now)).ok, false);
 assert.equal(f.schedules.length, 1);
});
test("vista previa queda inválida si cambió importe", async () => {
 const f = setup(); const p = await previewStudentBilling(f.db, "family", now);
 f.family.students[0].plan.annualFee = d(2400);
 assert.equal((await synchronizeStudentBilling(f.db, "family", "admin", now, p.token)).ok, false);
 assert.equal(f.entries.length, 0);
});
test("mes futuro crea cronograma pero no adelanta rubro", async () => {
 const f = setup({ future: true }); await synchronizeStudentBilling(f.db, "family", "admin", now);
 assert.equal(f.schedules.length, 4);
 assert.equal(f.entries.filter(e => e.type === "EVENTUAL_CHARGE").length, 0);
});
test("cambio de plan no reconstruye el pasado ni altera snapshots", async () => {
 const f = setup(); await synchronizeStudentBilling(f.db, "family", "admin", now);
 const oldFee = f.schedules[0].totalAmount;
 f.family.students[0].plan = { ...f.family.students[0].plan, id: "new-plan", annualFee: d(2400) };
 const p = await previewStudentBilling(f.db, "family", now);
 assert.equal(p.proposals[0].effectiveFrom.toISOString(), "2026-11-01T00:00:00.000Z");
 assert.equal(p.charges.length, 0); assert.equal(f.schedules[0].totalAmount, oldFee);
});

test("cronograma cancelado no emite nuevas cuotas desde el corte", async () => {
 const f = setup(); await synchronizeStudentBilling(f.db, "family", "admin", now);
 f.schedules.forEach(s => s.cancelledFrom = new Date("2026-11-01T00:00:00Z"));
 const november = new Date("2026-11-07T12:00:00Z");
 await synchronizeStudentBilling(f.db, "family", "admin", november);
 assert.equal(f.entries.length, 20);
});
test("traslado de alumno no agrega cargos nuevos a su familia anterior", async () => {
 const f = setup(); await synchronizeStudentBilling(f.db, "family", "admin", now);
 f.family.students[0].familyId = "other-family";
 const november = new Date("2026-11-07T12:00:00Z");
 await synchronizeStudentBilling(f.db, "family", "admin", november);
 assert.equal(f.entries.length, 21);
});
