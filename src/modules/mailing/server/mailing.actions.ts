"use server";

import { requireAdmin } from "@/modules/auth/server/auth-guards";
import { listEmailMessagesForDashboard } from "@/modules/mailing/server/mailing.repository";

export async function listEmailMessagesForAdmin() {
  await requireAdmin();
  return listEmailMessagesForDashboard();
}
