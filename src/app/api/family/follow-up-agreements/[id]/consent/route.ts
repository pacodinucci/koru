import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getActualAuthenticatedUser } from "@/modules/auth/server/auth-guards";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Never use the development family preview as the signer of a real consent.
  const user = await getActualAuthenticatedUser();
  if (user?.role !== "PARENT" || !user.familyId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const agreement = await prisma.followUpAgreementFamily.findUnique({
    where: { agreementId_familyId: { agreementId: id, familyId: user.familyId } },
    select: { consentedAt: true, agreement: { select: { status: true } } },
  });
  if (!agreement || agreement.agreement.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Acuerdo no disponible." }, { status: 404 });
  }
  if (agreement.consentedAt) {
    return NextResponse.json({ error: "Tu familia ya dio su consentimiento." }, { status: 409 });
  }
  const result = await prisma.followUpAgreementFamily.updateMany({
    where: { agreementId: id, familyId: user.familyId, consentedAt: null, agreement: { status: "PUBLISHED" } },
    data: { consentedAt: new Date(), consentedById: user.id },
  });
  if (!result.count) return NextResponse.json({ error: "El consentimiento ya fue registrado." }, { status: 409 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
