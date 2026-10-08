import { Prisma, type PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { getBillingPeriod, formatBillingPeriod } from "../lib/monthly-billing.ts";
import { calculatePlanDiscount } from "../lib/plan-discounts.ts";
import { dueInstallmentIndexes, installmentPeriod, splitInstallmentAmounts } from "../lib/eventual-installments.ts";
import { createDueEventualInstallmentCharges } from "./eventual-installments.core.ts";

type BillingClient = Pick<PrismaClient, "family" | "eventualChargeSchedule" | "familyAccountEntry">;
export async function previewStudentBilling(db: BillingClient, familyId: string, now = new Date()) {
 const current = getBillingPeriod(now);
 const year = current.getUTCFullYear();
 const yearStart = new Date(Date.UTC(year, 0, 1));
 const nextYear = new Date(Date.UTC(year + 1, 0, 1));
 const family = await db.family.findUniqueOrThrow({ where: { id: familyId }, include: { students: { orderBy: { id: "asc" }, include: { plan: { include: { eventualChargeItems: { where: { isActive: true }, orderBy: { id: "asc" } } } } } } } });
 const existing = await db.eventualChargeSchedule.findMany({ where: { familyId }, orderBy: { id: "asc" }, include: { accountEntries: { orderBy: { installmentNumber: "asc" }, select: { installmentNumber: true } } } });
 const itemIds = family.students.flatMap(student => student.plan?.eventualChargeItems.map(item => item.id) ?? []);
 const legacyItems = await db.familyAccountEntry.count({ where: { familyId, type: "EVENTUAL_CHARGE", eventualChargeScheduleId: null, eventualChargeItemId: { in: itemIds } } });
 const legacy = await db.familyAccountEntry.count({ where: { familyId, type: "MONTHLY_CHARGE", eventualChargeScheduleId: null, OR: [{ billingPeriod: { gte: yearStart, lt: nextYear } }, { billingPeriod: null }] } });
 const warnings: string[] = [];
 if (family.status !== "ACTIVE") warnings.push("La familia no está activa.");
 if (legacyItems) warnings.push("Hay rubros anteriores sin cronograma ni alumno identificado. Deben conciliarse antes de regularizar.");
 if (legacy) warnings.push("Hay cargos base anteriores sin identificación por alumno. Deben conciliarse antes de regularizar para no duplicarlos.");
 const proposals: Prisma.EventualChargeScheduleCreateManyInput[] = [];
 const charges: { student: string; concept: string; period: string; amount: string }[] = [];
 for (const student of family.students) {
  const plan = student.plan;
  if (!plan?.isActive) continue;
  const studentName = student.firstName + " " + student.lastName;
  const prior = existing.some(s => s.studentId === student.id && s.startPeriod >= yearStart && s.startPeriod < nextYear && s.isBase && s.sourceKey !== "base:" + student.id + ":" + year + ":" + plan.id);
  const terms = [{ id: null, name: plan.name, amount: plan.annualFee, discountPercent: plan.discountPercent, installmentCount: plan.installmentCount, startMonth: plan.startMonth, isBase: true }, ...plan.eventualChargeItems.map(i => ({ id: i.id, name: i.name, amount: i.suggestedAmount, discountPercent: i.discountPercent, installmentCount: i.installmentCount, startMonth: i.startMonth, isBase: false }))];
  for (const term of terms) {
   const sourceKey = (term.isBase ? "base:" : "item:" + term.id + ":") + student.id + ":" + year + ":" + plan.id;
   if (existing.some(s => s.sourceKey === sourceKey)) continue;
   if (!term.isBase && existing.some(s => !s.studentId && s.eventualChargeItemId === term.id && s.startPeriod >= yearStart && s.startPeriod < nextYear)) {
    warnings.push("El rubro " + term.name + " tiene un cronograma manual sin alumno identificado. Revisarlo antes de aplicar a " + studentName + "."); continue;
   }
   const discounted = calculatePlanDiscount(term.amount.toString(), term.discountPercent.toString());
   const startPeriod = new Date(Date.UTC(year, term.startMonth - 1, 1));
   const effectiveFrom = prior ? new Date(Date.UTC(year, current.getUTCMonth() + 1, 1)) : yearStart;
   proposals.push({ sourceKey, familyId, studentId: student.id, eventualChargeItemId: term.id, isBase: term.isBase, itemName: term.name, startPeriod, effectiveFrom, installmentCount: term.installmentCount, totalAmount: discounted.netAmount, grossAmount: discounted.grossAmount, discountAmount: discounted.discountAmount, discountPercent: term.discountPercent, createdById: "" });
   const amounts = splitInstallmentAmounts(discounted.netAmount, term.installmentCount);
   for (const index of dueInstallmentIndexes(startPeriod, term.installmentCount, current, new Set())) {
    const period = installmentPeriod(startPeriod, index);
    if (period >= effectiveFrom) charges.push({ student: studentName, concept: term.name, period: formatBillingPeriod(period), amount: amounts[index] });
   }
  }
 }
 for (const schedule of existing.filter(s => s.studentId)) {
  const student = family.students.find(s => s.id === schedule.studentId);
  if (!student || student.familyId !== familyId) continue;
  const amounts = splitInstallmentAmounts(schedule.totalAmount.toString(), schedule.installmentCount);
  const emitted = new Set(schedule.accountEntries.flatMap(e => e.installmentNumber === null ? [] : [e.installmentNumber]));
  for (const index of dueInstallmentIndexes(schedule.startPeriod, schedule.installmentCount, current, emitted)) {
   const period = installmentPeriod(schedule.startPeriod, index);
   if (schedule.effectiveFrom && period < schedule.effectiveFrom || schedule.cancelledFrom && period >= schedule.cancelledFrom) continue;
   charges.push({ student: student ? student.firstName + " " + student.lastName : "Alumno", concept: schedule.itemName, period: formatBillingPeriod(period), amount: amounts[index] });
  }
 }
 const token = createHash("sha256").update(JSON.stringify({ proposals, charges, warnings, current, existing: existing.map(s => ({ id: s.id, cancelledFrom: s.cancelledFrom, effectiveFrom: s.effectiveFrom, startPeriod: s.startPeriod, count: s.installmentCount, total: s.totalAmount, entries: s.accountEntries })) })).digest("hex");
 return { proposals, charges, warnings: [...new Set(warnings)], token, current };
}

export async function synchronizeStudentBilling(db: BillingClient, familyId: string, actorId: string, now = new Date(), expectedToken?: string) {
 const preview = await previewStudentBilling(db, familyId, now);
 if (expectedToken && preview.token !== expectedToken) return { ok: false, message: "Los datos cambiaron. Revisá nuevamente la vista previa." };
 if (preview.warnings.length) return { ok: false, message: preview.warnings.join(" ") };
 await db.eventualChargeSchedule.createMany({ data: preview.proposals.map(p => ({ ...p, createdById: actorId })), skipDuplicates: true });
 const schedules = await db.eventualChargeSchedule.findMany({ where: { familyId, studentId: { not: null } } });
 let created = 0;
 for (const schedule of schedules) created += (await createDueEventualInstallmentCharges(db, now, preview.current, schedule.id)).created;
 return { ok: true, created, message: created + " cargos registrados. Las cuotas futuras quedan programadas." };
}
