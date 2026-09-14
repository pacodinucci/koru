import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { runInvitationDeliveryWorker } from "@/modules/mailing/server/invitation-delivery-worker.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runInvitationDeliveryWorker();
  return NextResponse.json({ ok: true, ...result });
}