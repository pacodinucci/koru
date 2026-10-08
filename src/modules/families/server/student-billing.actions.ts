"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { previewStudentBilling, synchronizeStudentBilling } from "./student-billing.core";
export async function previewFamilyBillingAction(familyId: string) {
 await requirePermission("families.payments");
 const preview = await previewStudentBilling(prisma, z.string().min(1).parse(familyId));
 return { charges: preview.charges, warnings: preview.warnings, token: preview.token, schedules: preview.proposals.length };
}
export async function regularizeFamilyBillingAction(familyId: string, token: string) {
 const user = await requirePermission("families.payments");
 const parsed = z.object({ familyId: z.string().min(1), token: z.string().length(64) }).parse({ familyId, token });
 const result = await prisma.$transaction(async tx => {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${parsed.familyId}))`;
  return synchronizeStudentBilling(tx, parsed.familyId, user.id, new Date(), parsed.token);
 }, { timeout: 30000 });
 revalidatePath("/dashboard/families"); revalidatePath("/dashboard/families/" + familyId);
 return result;
}
