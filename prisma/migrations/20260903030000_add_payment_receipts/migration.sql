CREATE TYPE "ReceiptStatus" AS ENUM ('ACTIVE', 'VOIDED');

CREATE TABLE "PaymentReceipt" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "status" "ReceiptStatus" NOT NULL DEFAULT 'ACTIVE',
  "pdfUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReceiptDelivery" (
  "id" TEXT NOT NULL,
  "receiptId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReceiptDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentReceipt_paymentId_key" ON "PaymentReceipt"("paymentId");
CREATE UNIQUE INDEX "PaymentReceipt_number_key" ON "PaymentReceipt"("number");
CREATE INDEX "ReceiptDelivery_receiptId_createdAt_idx" ON "ReceiptDelivery"("receiptId", "createdAt");
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FamilyPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReceiptDelivery" ADD CONSTRAINT "ReceiptDelivery_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PaymentReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
