ALTER TABLE "Plan" ADD COLUMN "installmentCount" INTEGER NOT NULL DEFAULT 12, ADD COLUMN "startMonth" INTEGER NOT NULL DEFAULT 1;
UPDATE "Plan" SET "monthlyFee" = "monthlyFee" * 12;
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_installmentCount_check" CHECK ("installmentCount" BETWEEN 1 AND 12), ADD CONSTRAINT "Plan_startMonth_check" CHECK ("startMonth" BETWEEN 1 AND 12);
