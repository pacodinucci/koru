-- Additive only: no historical assignments or ledger/payment changes.
CREATE TABLE "FamilyPaymentAllocation" (
    "id" TEXT NOT NULL,
    "creditEntryId" TEXT NOT NULL,
    "chargeEntryId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyPaymentAllocation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FamilyPaymentAllocation_positive_amount" CHECK ("amount" > 0),
    CONSTRAINT "FamilyPaymentAllocation_distinct_entries" CHECK ("creditEntryId" <> "chargeEntryId")
);

CREATE INDEX "FamilyPaymentAllocation_creditEntryId_idx" ON "FamilyPaymentAllocation"("creditEntryId");
CREATE INDEX "FamilyPaymentAllocation_chargeEntryId_idx" ON "FamilyPaymentAllocation"("chargeEntryId");

ALTER TABLE "FamilyPaymentAllocation" ADD CONSTRAINT "FamilyPaymentAllocation_creditEntryId_fkey"
    FOREIGN KEY ("creditEntryId") REFERENCES "FamilyAccountEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FamilyPaymentAllocation" ADD CONSTRAINT "FamilyPaymentAllocation_chargeEntryId_fkey"
    FOREIGN KEY ("chargeEntryId") REFERENCES "FamilyAccountEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
