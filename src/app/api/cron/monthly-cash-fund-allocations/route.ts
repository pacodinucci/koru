import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { generateMonthlyCashFundAllocations } from "@/modules/operations/server/monthly-cash-fund-allocation.service";

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const result = await generateMonthlyCashFundAllocations();
  return NextResponse.json({ ok: true, period: result.allocationPeriod.toISOString().slice(0, 10), eligible: result.eligible, frequency: result.frequency, created: result.created, skipped: result.skipped });
}