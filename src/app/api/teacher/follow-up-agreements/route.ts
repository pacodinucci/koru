import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { AgreementError, saveAgreementDraft } from "@/modules/follow-up-agreements/server/agreements.repository";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !["TEACHER", "ADMIN_TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const agreement = await saveAgreementDraft(user.id, await request.formData());
    return NextResponse.json({ ok: true, id: agreement.id }, { status: 201 });
  } catch (error) {
    if (error instanceof AgreementError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[follow-up-agreements] No se pudo crear el acuerdo", error);
    return NextResponse.json({ error: "No pudimos guardar el acuerdo." }, { status: 500 });
  }
}
