ALTER TABLE "CashFundEntry" ADD COLUMN "allocationPeriod" DATE;
CREATE UNIQUE INDEX "CashFundEntry_teacherId_allocationPeriod_key"
  ON "CashFundEntry"("teacherId", "allocationPeriod");