ALTER TABLE "PlanEventualChargeItem"
  ADD COLUMN "installmentCount" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "EventualChargeSchedule" (
  "id" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "eventualChargeItemId" TEXT,
  "itemName" TEXT NOT NULL,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "installmentCount" INTEGER NOT NULL,
  "startPeriod" DATE NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventualChargeSchedule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FamilyAccountEntry"
  ADD COLUMN "eventualChargeScheduleId" TEXT,
  ADD COLUMN "installmentNumber" INTEGER;

CREATE INDEX "EventualChargeSchedule_familyId_idx" ON "EventualChargeSchedule"("familyId");
CREATE INDEX "EventualChargeSchedule_startPeriod_idx" ON "EventualChargeSchedule"("startPeriod");
CREATE INDEX "EventualChargeSchedule_eventualChargeItemId_idx" ON "EventualChargeSchedule"("eventualChargeItemId");
CREATE UNIQUE INDEX "EventualChargeSchedule_installment_number_key"
  ON "FamilyAccountEntry"("eventualChargeScheduleId", "installmentNumber");

ALTER TABLE "EventualChargeSchedule"
  ADD CONSTRAINT "EventualChargeSchedule_familyId_fkey"
  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventualChargeSchedule"
  ADD CONSTRAINT "EventualChargeSchedule_eventualChargeItemId_fkey"
  FOREIGN KEY ("eventualChargeItemId") REFERENCES "PlanEventualChargeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FamilyAccountEntry"
  ADD CONSTRAINT "FamilyAccountEntry_eventualChargeScheduleId_fkey"
  FOREIGN KEY ("eventualChargeScheduleId") REFERENCES "EventualChargeSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlanEventualChargeItem"
  ADD CONSTRAINT "PlanEventualChargeItem_installmentCount_check"
  CHECK ("installmentCount" BETWEEN 1 AND 120);
ALTER TABLE "EventualChargeSchedule"
  ADD CONSTRAINT "EventualChargeSchedule_installmentCount_check"
  CHECK ("installmentCount" BETWEEN 1 AND 120);

ALTER TABLE "FamilyAccountEntry"
  ADD CONSTRAINT "FamilyAccountEntry_installment_identity_check"
  CHECK (("eventualChargeScheduleId" IS NULL AND "installmentNumber" IS NULL)
    OR ("eventualChargeScheduleId" IS NOT NULL AND "installmentNumber" > 0));
