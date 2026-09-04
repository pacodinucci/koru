CREATE TYPE "AccountEntryType" AS ENUM ('MONTHLY_CHARGE', 'PAYMENT', 'PAYMENT_REVERSAL', 'BALANCE_WAIVER');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'OTHER');
CREATE TYPE "PaymentStatus" AS ENUM ('REGISTERED', 'VOIDED');

CREATE TABLE "FamilyPayment" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "reference" TEXT,
  "attachmentUrl" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'REGISTERED',
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FamilyPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyAccountEntry" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "type" "AccountEntryType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "description" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyAccountEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FamilyAccountEntry_paymentId_key" ON "FamilyAccountEntry"("paymentId");
CREATE INDEX "FamilyPayment_familyId_paidAt_idx" ON "FamilyPayment"("familyId", "paidAt");
CREATE INDEX "FamilyPayment_status_paidAt_idx" ON "FamilyPayment"("status", "paidAt");
CREATE INDEX "FamilyAccountEntry_familyId_occurredAt_idx" ON "FamilyAccountEntry"("familyId", "occurredAt");
ALTER TABLE "FamilyPayment" ADD CONSTRAINT "FamilyPayment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FamilyAccountEntry" ADD CONSTRAINT "FamilyAccountEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FamilyAccountEntry" ADD CONSTRAINT "FamilyAccountEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FamilyPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
