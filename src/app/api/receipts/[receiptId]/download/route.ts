import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { canAccessReceipt } from "@/modules/families/lib/receipt-access-policy";
import { createReceiptDownloadUrl } from "@/modules/families/server/receipt-access.service";

export async function GET(_request: Request, { params }: { params: Promise<{ receiptId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { receiptId } = await params;
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: receiptId },
    select: { status: true, pdfPublicId: true, payment: { select: { familyId: true } } },
  });

  if (!receipt || receipt.status !== "ACTIVE" || !receipt.pdfPublicId) {
    return NextResponse.json({ ok: false, error: "Recibo no disponible" }, { status: 404 });
  }

  if (!canAccessReceipt({ role: user.role, userFamilyId: user.familyId, receiptFamilyId: receipt.payment.familyId })) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.redirect(createReceiptDownloadUrl(receipt.pdfPublicId), { headers: { "Cache-Control": "private, no-store" } });
}