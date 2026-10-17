-- CreateTable
CREATE TABLE "InventoryPurchase" (
    "id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "invoiceNumber" TEXT,
    "fingerprint" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryPurchase_pkey" PRIMARY KEY ("id")
);

-- Existing movements remain unrelated; no historical total is inferred.
ALTER TABLE "InventoryMovement" ADD COLUMN "purchaseId" TEXT;

CREATE INDEX "InventoryPurchase_occurredAt_idx" ON "InventoryPurchase"("occurredAt");
CREATE INDEX "InventoryMovement_purchaseId_idx" ON "InventoryMovement"("purchaseId");

ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_purchaseId_fkey"
    FOREIGN KEY ("purchaseId") REFERENCES "InventoryPurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
