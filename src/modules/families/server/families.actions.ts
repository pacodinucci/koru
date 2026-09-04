"use server";

import { FamilyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { prisma } from "@/lib/prisma";
import { getFamilyDetailForAdmin } from "@/modules/families/server/families.repository";

const familySchema = z.object({ name: z.string().trim().min(2).max(120) });
const planSchema = z.object({ name: z.string().trim().min(2).max(120), monthlyFee: z.coerce.number().positive() });
const updatePlanSchema = z.object({ planId: z.string().min(1), name: z.string().trim().min(2).max(120), monthlyFee: z.coerce.number().positive(), isActive: z.enum(["true", "false"]) });
const planAssignmentSchema = z.object({ familyId: z.string().min(1), planId: z.string().min(1) });
const statusSchema = z.object({ familyId: z.string().min(1), status: z.nativeEnum(FamilyStatus) });
const membershipSchema = z.object({ familyId: z.string().min(1), memberId: z.string().min(1) });
const familyIdSchema = z.string().min(1);

function value(formData: FormData, key: string) {
  const candidate = formData.get(key);
  return typeof candidate === "string" ? candidate : "";
}

export async function createFamilyAction(formData: FormData) {
  await requireAdmin();
  const parsed = familySchema.safeParse({ name: value(formData, "name") });
  if (!parsed.success) return;
  await prisma.family.create({ data: { name: parsed.data.name } });
  revalidatePath("/dashboard/families");
}

export async function createPlanAction(formData: FormData) {
  await requireAdmin();
  const parsed = planSchema.safeParse({ name: value(formData, "name"), monthlyFee: value(formData, "monthlyFee") });
  if (!parsed.success) return;
  await prisma.plan.create({ data: parsed.data });
  revalidatePath("/dashboard/families");
}

export async function updatePlanAction(formData: FormData) {
  await requireAdmin();
  const parsed = updatePlanSchema.safeParse({ planId: value(formData, "planId"), name: value(formData, "name"), monthlyFee: value(formData, "monthlyFee"), isActive: value(formData, "isActive") });
  if (!parsed.success) return;
  await prisma.plan.update({ where: { id: parsed.data.planId }, data: { name: parsed.data.name, monthlyFee: parsed.data.monthlyFee, isActive: parsed.data.isActive === "true" } });
  revalidatePath("/dashboard/families");
  revalidatePath("/dashboard/families/plans");
}

export async function assignPlanToFamilyAction(formData: FormData) {
  await requireAdmin();
  const parsed = planAssignmentSchema.safeParse({ familyId: value(formData, "familyId"), planId: value(formData, "planId") });
  if (!parsed.success) return;
  await prisma.family.update({ where: { id: parsed.data.familyId }, data: { planId: parsed.data.planId } });
  revalidatePath("/dashboard/families");
}

export async function changeFamilyStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = statusSchema.safeParse({ familyId: value(formData, "familyId"), status: value(formData, "status") });
  if (!parsed.success) return;
  await prisma.family.update({ where: { id: parsed.data.familyId }, data: { status: parsed.data.status } });
  revalidatePath("/dashboard/families");
}

export async function assignFamilyUserAction(formData: FormData) {
  await requireAdmin();
  const parsed = membershipSchema.safeParse({ familyId: value(formData, "familyId"), memberId: value(formData, "userId") });
  if (!parsed.success) return;
  await prisma.user.update({ where: { id: parsed.data.memberId }, data: { familyId: parsed.data.familyId } });
  revalidatePath("/dashboard/families");
}

export async function assignFamilyStudentAction(formData: FormData) {
  await requireAdmin();
  const parsed = membershipSchema.safeParse({ familyId: value(formData, "familyId"), memberId: value(formData, "studentId") });
  if (!parsed.success) return;
  await prisma.student.update({ where: { id: parsed.data.memberId }, data: { familyId: parsed.data.familyId } });
  revalidatePath("/dashboard/families");
}

export async function getFamilyDetailAction(familyId: string) {
  await requireAdmin();
  const parsed = familyIdSchema.safeParse(familyId);
  if (!parsed.success) return null;

  const family = await getFamilyDetailForAdmin(parsed.data);
  if (!family) return null;

  const balance = family.accountEntries.reduce(
    (total, entry) => total + Number(entry.amount),
    0,
  );

  return {
    id: family.id,
    name: family.name,
    balance: balance.toFixed(2),
    entries: family.accountEntries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: entry.amount.toString(),
      description: entry.description,
      occurredAt: entry.occurredAt.toISOString(),
      payment: entry.payment
        ? {
            id: entry.payment.id,
            method: entry.payment.method,
            reference: entry.payment.reference,
            status: entry.payment.status,
            receipt: entry.payment.receipt
              ? {
                  id: entry.payment.receipt.id,
                  status: entry.payment.receipt.status,
                  pdfUrl: entry.payment.receipt.pdfUrl,
                  number: entry.payment.receipt.number,
                }
              : null,
          }
        : null,
    })),
  };
}