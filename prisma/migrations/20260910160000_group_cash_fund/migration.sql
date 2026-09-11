CREATE TABLE "CashFundGroupBudget" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "amountPerPeriod" DECIMAL(12,2) NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CashFundGroupBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashFundGroupBudget_groupId_key" ON "CashFundGroupBudget"("groupId");
CREATE INDEX "CashFundGroupBudget_effectiveFrom_idx" ON "CashFundGroupBudget"("effectiveFrom");
ALTER TABLE "CashFundGroupBudget" ADD CONSTRAINT "CashFundGroupBudget_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CashExpenseReport" ADD COLUMN "groupId" TEXT;
CREATE INDEX "CashExpenseReport_groupId_status_submittedAt_idx" ON "CashExpenseReport"("groupId", "status", "submittedAt");
ALTER TABLE "CashExpenseReport" ADD CONSTRAINT "CashExpenseReport_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashFundEntry" ALTER COLUMN "teacherId" DROP NOT NULL;
ALTER TABLE "CashFundEntry" ADD COLUMN "groupId" TEXT;
CREATE INDEX "CashFundEntry_groupId_occurredAt_idx" ON "CashFundEntry"("groupId", "occurredAt");
ALTER TABLE "CashFundEntry" ADD CONSTRAINT "CashFundEntry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "CashFundEntry_teacherId_allocationPeriod_key";
CREATE UNIQUE INDEX "CashFundEntry_groupId_allocationPeriod_key" ON "CashFundEntry"("groupId", "allocationPeriod");

ALTER TABLE "CashFundSettings" ALTER COLUMN "defaultMonthlyAmount" SET DEFAULT 0;
