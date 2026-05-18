import { NextResponse } from "next/server";

import { submitContactMessageAction } from "@/modules/contact/server/contact.actions";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;

  const result = await submitContactMessageAction(body);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
