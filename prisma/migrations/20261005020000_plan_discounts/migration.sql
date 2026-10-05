BEGIN;

ALTER TABLE "Plan"
  ADD COLUMN "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

ALTER TABLE "PlanEventualChargeItem"
  ADD COLUMN "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

ALTER TABLE "EventualChargeSchedule"
  ADD COLUMN "grossAmount" DECIMAL(12,2),
  ADD COLUMN "discountAmount" DECIMAL(12,2),
  ADD COLUMN "discountPercent" DECIMAL(5,2);

ALTER TABLE "FamilyAccountEntry"
  ADD COLUMN "grossAmount" DECIMAL(12,2),
  ADD COLUMN "discountAmount" DECIMAL(12,2);

ALTER TABLE "Plan"
  ADD CONSTRAINT "Plan_discountPercent_check" CHECK ("discountPercent" BETWEEN 0 AND 100);
ALTER TABLE "PlanEventualChargeItem"
  ADD CONSTRAINT "PlanEventualChargeItem_discountPercent_check" CHECK ("discountPercent" BETWEEN 0 AND 100);
ALTER TABLE "EventualChargeSchedule"
  ADD CONSTRAINT "EventualChargeSchedule_discountPercent_check" CHECK ("discountPercent" IS NULL OR "discountPercent" BETWEEN 0 AND 100);

ALTER TABLE "EventualChargeSchedule"
  ADD CONSTRAINT "EventualChargeSchedule_discount_snapshot_check"
  CHECK (("grossAmount" IS NULL AND "discountAmount" IS NULL AND "discountPercent" IS NULL)
    OR ("grossAmount" IS NOT NULL AND "discountAmount" IS NOT NULL AND "discountPercent" IS NOT NULL
      AND "grossAmount" >= 0 AND "discountAmount" >= 0
      AND "totalAmount" = "grossAmount" - "discountAmount"));

ALTER TABLE "FamilyAccountEntry"
  ADD CONSTRAINT "FamilyAccountEntry_discount_snapshot_check"
  CHECK (("grossAmount" IS NULL AND "discountAmount" IS NULL)
    OR ("grossAmount" IS NOT NULL AND "discountAmount" IS NOT NULL
      AND "grossAmount" >= 0 AND "discountAmount" >= 0
      AND "amount" = "grossAmount" - "discountAmount"));

COMMIT;
