"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import {
  listInvitationDeliveryJobsForDashboard,
  requeueFailedInvitationDeliveryJob,
} from "@/modules/mailing/server/invitation-delivery-job.repository";
import { listEmailMessagesForDashboard } from "@/modules/mailing/server/mailing.repository";

export async function listEmailMessagesForAdmin() {
  await requirePermission("mailing.view");
  return listEmailMessagesForDashboard();
}

export async function listInvitationDeliveryJobsForAdmin() {
  await requirePermission("mailing.view");
  return listInvitationDeliveryJobsForDashboard();
}

export async function requeueFailedInvitationDeliveryJobAction(formData: FormData) {
  await requirePermission("mailing.send");
  const jobId = formData.get("jobId");
  if (typeof jobId !== "string" || !jobId) return;

  await requeueFailedInvitationDeliveryJob(jobId);
  revalidatePath("/dashboard/mailing");
}