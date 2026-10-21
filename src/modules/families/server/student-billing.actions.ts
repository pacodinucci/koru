"use server";

import { requirePermission } from "@/modules/auth/server/auth-guards";

const retiredPlanMessage = "Los planes fueron reemplazados por rubros. Asigná los rubros por alumno con sus cuotas y mes de inicio.";

// Stale clients may still call these exports; never synchronize the retired plan catalog.
export async function previewFamilyBillingAction(_familyId: string) {
  await requirePermission("families.payments");
  return { charges: [] as { student: string; concept: string; period: string; amount: string }[], warnings: [retiredPlanMessage], token: "", schedules: 0 };
}

export async function regularizeFamilyBillingAction(_familyId: string, _token: string) {
  await requirePermission("families.payments");
  return { ok: false, message: retiredPlanMessage };
}
