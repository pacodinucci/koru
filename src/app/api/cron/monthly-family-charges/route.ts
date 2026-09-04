import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { generateMonthlyFamilyCharges } from "@/modules/families/server/monthly-family-charge.service";

export async function GET(request: Request) {
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateMonthlyFamilyCharges();
  return NextResponse.json({ ok: true, period: result.billingPeriod.toISOString().slice(0, 10), eligible: result.eligible, created: result.created, skipped: result.skipped });
}