import "server-only";

import { EmailDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateAndUploadReceipt } from "@/modules/families/server/receipt-pdf.service";
import { deliverReceipt } from "@/modules/families/server/receipt-delivery.service";

export async function createReceiptForPayment(paymentId: string) {
  const context = await prisma.$transaction(async (tx) => {
    const payment = await tx.familyPayment.findUniqueOrThrow({
      where: { id: paymentId },
      include: { family: { include: { users: { where: { role: "PARENT" }, select: { email: true } } } } },
    });
    const existing = await tx.paymentReceipt.findUnique({ where: { paymentId } });
    if (existing) return { payment, receipt: existing };

    const latest = await tx.paymentReceipt.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    const receipt = await tx.paymentReceipt.create({ data: { paymentId, number: (latest?.number ?? 0) + 1 } });
    if (payment.family.users.length > 0) {
      await tx.receiptDelivery.createMany({ data: payment.family.users.map((user) => ({ receiptId: receipt.id, email: user.email, status: EmailDeliveryStatus.PENDING })) });
    }
    return { payment, receipt };
  });

  let receipt = context.receipt;
  if (!receipt.pdfUrl) {
    const uploaded = await generateAndUploadReceipt({ id: receipt.id, number: receipt.number, familyName: context.payment.family.name, amount: context.payment.amount.toString(), paidAt: context.payment.paidAt });
    receipt = await prisma.paymentReceipt.update({ where: { id: receipt.id }, data: { pdfUrl: uploaded.secureUrl, pdfPublicId: uploaded.publicId } });
  }

  await deliverReceipt(receipt.id);
  return receipt;
}