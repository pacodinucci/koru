"use server";

import { requirePermission } from "@/modules/auth/server/auth-guards";
import { listEmailMessagesForDashboard } from "@/modules/mailing/server/mailing.repository";

export async function listEmailMessagesForAdmin() {
  await requirePermission("mailing.send");
  return listEmailMessagesForDashboard();
}
