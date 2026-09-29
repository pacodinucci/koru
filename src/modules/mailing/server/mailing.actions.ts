"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import {
  getSendableInvitationIdForDeliveryJob,
  listInvitationDeliveryJobsForDashboard,
} from "@/modules/mailing/server/invitation-delivery-job.repository";
import { runInvitationDeliveryWorker } from "@/modules/mailing/server/invitation-delivery-worker.service";
import { listEmailMessagesForDashboard } from "@/modules/mailing/server/mailing.repository";
import { resendUserInvitation } from "@/modules/users/server/users.repository";

export async function listEmailMessagesForAdmin() {
  await requirePermission("mailing.view");
  return listEmailMessagesForDashboard();
}

export async function listInvitationDeliveryJobsForAdmin() {
  await requirePermission("mailing.view");
  return listInvitationDeliveryJobsForDashboard();
}

export async function sendInvitationDeliveryJobAction(formData: FormData) {
  const actor = await requirePermission("mailing.send");
  const jobId = formData.get("jobId");
  if (typeof jobId !== "string" || !jobId) return;

  try {
    const invitationId = await getSendableInvitationIdForDeliveryJob(jobId);
    await resendUserInvitation(invitationId, actor.id);
    await runInvitationDeliveryWorker(new Date(), 45 * 1000, invitationId);
  } finally {
    revalidatePath("/dashboard/mailing");
  }
}
