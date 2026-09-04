ALTER TABLE "FamilyAccountEntry" ADD COLUMN "billingPeriod" DATE;
CREATE UNIQUE INDEX "FamilyAccountEntry_familyId_billingPeriod_key" ON "FamilyAccountEntry"("familyId", "billingPeriod");