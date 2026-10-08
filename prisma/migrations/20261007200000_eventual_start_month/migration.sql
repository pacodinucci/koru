ALTER TABLE "PlanEventualChargeItem" ADD COLUMN "startMonth" INTEGER NOT NULL DEFAULT 1;
UPDATE "PlanEventualChargeItem" AS item SET "startMonth" = plan."startMonth" FROM "Plan" AS plan WHERE item."planId" = plan."id";
ALTER TABLE "PlanEventualChargeItem" ADD CONSTRAINT "PlanEventualChargeItem_startMonth_check" CHECK ("startMonth" BETWEEN 1 AND 12);
