import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { AgreementError, publishAgreement } from "@/modules/follow-up-agreements/server/agreements.repository";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user || !["TEACHER", "ADMIN_TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const { id } = await params;
    await publishAgreement(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AgreementError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[follow-up-agreements] No se pudo publicar el acuerdo", error);
    return NextResponse.json({ error: "No pudimos publicar el acuerdo." }, { status: 500 });
  }
}
