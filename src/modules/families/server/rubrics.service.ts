import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BillingRubricInputError, parseBillingRubric, parseRubricAssignment, parseRubricId, validateRubricInstallments } from "@/modules/families/lib/billing-rubrics";
import { splitInstallmentAmounts } from "@/modules/families/lib/eventual-installments";
import { calculatePlanDiscount } from "@/modules/families/lib/plan-discounts";
import { getBillingPeriod } from "@/modules/families/lib/monthly-billing";
import { createDueEventualInstallmentChargesInTransaction, lockFamilyBilling } from "@/modules/families/server/eventual-installments.core";

type AssignmentInput = { familyId: string; studentId: string; rubricId: string; installmentCount: number; startMonth: number; discountPercent?: string };
type AssignmentIdentity = { familyId: string; studentId: string; assignmentId: string };
const assignmentMessage = "No encontramos una asignación de rubro vigente para este alumno y familia.";
const protectedMessage = "No podés modificar ni eliminar un rubro con pagos asignados o movimientos que no sean cargos generados impagos.";

export async function createBillingRubric(input: { name: string; amount: string }) {
  const data = parseBillingRubric(input);
  return prisma.billingRubric.create({ data });
}

export async function updateBillingRubric(input: { rubricId: string; name: string; amount: string; isActive?: boolean }) {
  const rubricId = parseRubricId(input.rubricId);
  const data = parseBillingRubric(input);
  if (input.isActive !== undefined && typeof input.isActive !== "boolean") {
    throw new BillingRubricInputError("El estado del rubro no es válido.");
  }
  // Catalog edits never change the name or total already frozen in an assignment.
  return prisma.billingRubric.update({ where: { id: rubricId }, data: { ...data, ...(input.isActive === undefined ? {} : { isActive: input.isActive }) } });
}

async function assignmentTransaction<T>(familyId: string, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  try {
    return await prisma.$transaction(async tx => {
      await lockFamilyBilling(tx, familyId);
      return work(tx);
    }, { isolationLevel: "Serializable", timeout: 30000 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error.code === "P2034" || error.code === "P2003")) {
      throw new BillingRubricInputError("La cuenta cambió mientras guardabas. Actualizá la ficha, revisá los pendientes y volvé a intentar.");
    }
    throw error;
  }
}

async function requireStudent(tx: Prisma.TransactionClient, familyId: string, studentId: string) {
  const student = await tx.student.findUnique({ where: { id: studentId }, select: { familyId: true } });
  if (!student || student.familyId !== familyId) throw new BillingRubricInputError("El alumno no pertenece a esta familia.");
}

async function activeRubricSnapshot(tx: Prisma.TransactionClient, rubricId: string) {
  const rubric = await tx.billingRubric.findUnique({ where: { id: rubricId } });
  if (!rubric?.isActive) throw new BillingRubricInputError("Seleccioná un rubro activo.");
  return parseBillingRubric({ name: rubric.name, amount: rubric.amount.toString() });
}

function discountedSnapshot(grossAmount: string, discountPercent: string, count: number) {
  const discount = calculatePlanDiscount(grossAmount, discountPercent);
  validateRubricInstallments(discount.grossAmount, count);
  validateRubricInstallments(discount.netAmount, count);
  return { grossAmount: discount.grossAmount, discountAmount: discount.discountAmount, discountPercent, totalAmount: discount.netAmount };
}

export async function assignRubricToStudent(input: AssignmentInput, createdById: string) {
  const terms = parseRubricAssignment(input);
  const actorId = parseRubricId(createdById);
  const now = new Date();
  const currentPeriod = getBillingPeriod(now);
  return assignmentTransaction(terms.familyId, async tx => {
    await requireStudent(tx, terms.familyId, terms.studentId);
    const snapshot = await activeRubricSnapshot(tx, terms.rubricId);
    const assignment = await tx.eventualChargeSchedule.create({ data: {
      familyId: terms.familyId,
      studentId: terms.studentId,
      rubricId: terms.rubricId,
      itemName: snapshot.name,
      ...discountedSnapshot(snapshot.amount, terms.discountPercent, terms.installmentCount),
      installmentCount: terms.installmentCount,
      startPeriod: new Date(Date.UTC(currentPeriod.getUTCFullYear(), terms.startMonth - 1, 1)),
      createdById: actorId,
      isBase: false,
    } });
    await createDueEventualInstallmentChargesInTransaction(tx, now, currentPeriod, assignment.id);
    return assignment;
  });
}

function parseIdentity(input: AssignmentIdentity) {
  return { familyId: parseRubricId(input.familyId), studentId: parseRubricId(input.studentId), assignmentId: parseRubricId(input.assignmentId) };
}

async function editableAssignment(tx: Prisma.TransactionClient, identity: AssignmentIdentity) {
  await requireStudent(tx, identity.familyId, identity.studentId);
  const schedule = await tx.eventualChargeSchedule.findUnique({ where: { id: identity.assignmentId } });
  if (!schedule || schedule.familyId !== identity.familyId || schedule.studentId !== identity.studentId || !schedule.rubricId || schedule.cancelledFrom || schedule.isBase || schedule.eventualChargeItemId) {
    throw new BillingRubricInputError(assignmentMessage);
  }
  const entries = await tx.familyAccountEntry.findMany({
    where: { eventualChargeScheduleId: schedule.id },
    include: { allocationsAsCharge: true, allocationsAsCredit: true },
  });
  // A schedule link alone is insufficient proof that a row can be removed. Check
  // its generated terms and all allocation history, even allocations of voided payments.
  const amounts = splitInstallmentAmounts(schedule.totalAmount.toString(), schedule.installmentCount);
  const gross = schedule.grossAmount === null ? null : splitInstallmentAmounts(schedule.grossAmount.toString(), schedule.installmentCount);
  const unsafe = entries.some(entry => {
    const number = entry.installmentNumber;
    if (entry.allocationsAsCharge.length || entry.allocationsAsCredit.length || entry.type !== "EVENTUAL_CHARGE"
      || entry.familyId !== schedule.familyId || entry.paymentId !== null || entry.billingPeriod !== null
      || entry.eventualChargeItemId !== null || number === null || !Number.isInteger(number) || number < 1 || number > schedule.installmentCount) return true;
    const index = number - 1;
    if (!new Prisma.Decimal(entry.amount).equals(amounts[index])) return true;
    if (gross) {
      return entry.grossAmount === null || entry.discountAmount === null
        || !new Prisma.Decimal(entry.grossAmount).equals(gross[index])
        || !new Prisma.Decimal(entry.discountAmount).equals(new Prisma.Decimal(gross[index]).minus(amounts[index]));
    }
    return entry.grossAmount !== null || entry.discountAmount !== null;
  });
  if (unsafe) throw new BillingRubricInputError(protectedMessage);
  return { schedule, entryIds: entries.map(entry => entry.id) };
}

export async function updateStudentRubricAssignment(input: AssignmentInput & { assignmentId: string; discountPercent: string }, createdById: string) {
  const terms = parseRubricAssignment(input);
  const identity = parseIdentity(input);
  parseRubricId(createdById);
  const now = new Date();
  const currentPeriod = getBillingPeriod(now);
  return assignmentTransaction(identity.familyId, async tx => {
    const { schedule, entryIds } = await editableAssignment(tx, identity);
    // Reusing a rubric keeps its original gross/name, even if the catalog is now inactive.
    const snapshot = schedule.rubricId === terms.rubricId
      ? { name: schedule.itemName, amount: (schedule.grossAmount ?? schedule.totalAmount).toString() }
      : await activeRubricSnapshot(tx, terms.rubricId);
    const discount = discountedSnapshot(snapshot.amount, terms.discountPercent, terms.installmentCount);
    await tx.familyAccountEntry.deleteMany({ where: { id: { in: entryIds } } });
    const assignment = await tx.eventualChargeSchedule.update({ where: { id: schedule.id }, data: {
      rubricId: terms.rubricId,
      itemName: snapshot.name,
      ...discount,
      installmentCount: terms.installmentCount,
      startPeriod: new Date(Date.UTC(schedule.startPeriod.getUTCFullYear(), terms.startMonth - 1, 1)),
    } });
    await createDueEventualInstallmentChargesInTransaction(tx, now, currentPeriod, assignment.id);
    return assignment;
  });
}

export async function deleteStudentRubricAssignment(input: AssignmentIdentity, createdById: string) {
  const identity = parseIdentity(input);
  parseRubricId(createdById);
  return assignmentTransaction(identity.familyId, async tx => {
    const { schedule, entryIds } = await editableAssignment(tx, identity);
    await tx.familyAccountEntry.deleteMany({ where: { id: { in: entryIds } } });
    return tx.eventualChargeSchedule.delete({ where: { id: schedule.id } });
  });
}
