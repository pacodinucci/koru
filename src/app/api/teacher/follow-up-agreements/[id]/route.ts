import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { AgreementError, deleteAgreement, saveAgreementDraft } from "@/modules/follow-up-agreements/server/agreements.repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user || !["TEACHER", "ADMIN_TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const { id } = await params;
    await saveAgreementDraft(user.id, await request.formData(), id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AgreementError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[follow-up-agreements] No se pudo actualizar el borrador", error);
    return NextResponse.json({ error: "No pudimos actualizar el borrador." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user || !["TEACHER", "ADMIN_TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const { id } = await params;
    await deleteAgreement(user.id, id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AgreementError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[follow-up-agreements] No se pudo eliminar el acuerdo", error);
    return NextResponse.json({ error: "No pudimos eliminar el acuerdo." }, { status: 500 });
  }
}
