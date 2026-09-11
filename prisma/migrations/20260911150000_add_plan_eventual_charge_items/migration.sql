CREATE TYPE "AccountEntryType_new" AS ENUM ('MONTHLY_CHARGE', 'EVENTUAL_CHARGE', 'PAYMENT', 'PAYMENT_REVERSAL', 'BALANCE_WAIVER');
ALTER TABLE "FamilyAccountEntry" ALTER COLUMN "type" TYPE "AccountEntryType_new" USING ("type"::text::"AccountEntryType_new");
ALTER TYPE "AccountEntryType" RENAME TO "AccountEntryType_old";
ALTER TYPE "AccountEntryType_new" RENAME TO "AccountEntryType";
DROP TYPE "AccountEntryType_old";

CREATE TABLE "PlanEventualChargeItem" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "suggestedAmount" DECIMAL(12,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanEventualChargeItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FamilyAccountEntry" ADD COLUMN "eventualChargeItemId" TEXT;
CREATE UNIQUE INDEX "PlanEventualChargeItem_planId_name_key" ON "PlanEventualChargeItem"("planId", "name");
CREATE INDEX "PlanEventualChargeItem_planId_isActive_idx" ON "PlanEventualChargeItem"("planId", "isActive");
CREATE INDEX "FamilyAccountEntry_eventualChargeItemId_idx" ON "FamilyAccountEntry"("eventualChargeItemId");
ALTER TABLE "PlanEventualChargeItem" ADD CONSTRAINT "PlanEventualChargeItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyAccountEntry" ADD CONSTRAINT "FamilyAccountEntry_eventualChargeItemId_fkey" FOREIGN KEY ("eventualChargeItemId") REFERENCES "PlanEventualChargeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
