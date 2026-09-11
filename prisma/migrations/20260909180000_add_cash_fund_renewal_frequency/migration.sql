CREATE TYPE "CashFundRenewalFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

ALTER TABLE "CashFundSettings"
ADD COLUMN "renewalFrequency" "CashFundRenewalFrequency" NOT NULL DEFAULT 'MONTHLY';
ALTER TYPE "CashFundEntryType" ADD VALUE 'PERIODIC_ALLOCATION';
