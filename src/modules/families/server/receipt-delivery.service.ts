import { createElement } from "react";

import { EmailDeliveryStatus, ReceiptStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createReceiptDownloadUrl } from "@/modules/families/server/receipt-access.service";
import { sendMail } from "@/modules/mailing/server/mailing.service";
import { ReceiptEmail } from "@/modules/mailing/templates/receipt-email";

export async function deliverReceipt(receiptId: string) {
  const receipt = await prisma.paymentReceipt.findUniqueOrThrow({
    where: { id: receiptId },
    include: { payment: { select: { amount: true, paidAt: true } }, deliveries: { where: { status: EmailDeliveryStatus.PENDING } } },
  });

  if (receipt.status !== ReceiptStatus.ACTIVE || !receipt.pdfPublicId || receipt.deliveries.length === 0) {
    return;
  }

  const downloadUrl = createReceiptDownloadUrl(receipt.pdfPublicId);
  await Promise.all(receipt.deliveries.map(async (delivery) => {
    const result = await sendMail({
      type: "MANUAL",
      to: [{ email: delivery.email }],
      subject: `Koru · Recibo Nº ${receipt.number}`,
      react: createElement(ReceiptEmail, { receiptNumber: receipt.number, amount: receipt.payment.amount.toString(), paidAt: receipt.payment.paidAt, downloadUrl }),
      payload: { receiptId },
      idempotencyKey: `receipt-delivery-${delivery.id}`,
    });

    await prisma.receiptDelivery.update({
      where: { id: delivery.id },
      data: result.status === "sent" ? { status: EmailDeliveryStatus.SENT, sentAt: new Date(), error: null } : { status: EmailDeliveryStatus.FAILED, error: "receipt_email_failed" },
    });
  }));
}