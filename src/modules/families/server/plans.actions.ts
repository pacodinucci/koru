"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/server/auth-guards";

export type DeletePlanResult = { ok: true } | { ok: false; message: string };

export async function deletePlanAction(planId: string): Promise<DeletePlanResult> {
  await requirePermission("families.manage");
  if (!planId.trim()) return { ok: false, message: "No encontramos el plan." };

  const result = await prisma.plan.deleteMany({ where: {
    id: planId,
    students: { none: {} },
    families: { none: {} },
    eventualChargeItems: { none: { OR: [
      { accountEntries: { some: {} } },
      { schedules: { some: {} } },
    ] } },
  } });
  if (result.count === 0) {
    return { ok: false, message: "No se puede eliminar: el plan está asignado o alguno de sus rubros tiene cargos o cuotas programadas." };
  }

  revalidatePath("/dashboard/families/plans");
  revalidatePath("/dashboard/families");
  return { ok: true };
}
