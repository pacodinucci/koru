-- Fail closed: the previous accounting reset is a prerequisite, not an operation here.
-- Lock the asserted tables until commit so concurrent writes cannot invalidate it.
BEGIN;

LOCK TABLE "FamilyAccountEntry", "FamilyPaymentAllocation", "FamilyPayment",
  "PaymentReceipt", "ReceiptDelivery", "EventualChargeSchedule", "Family", "Student",
  "PlanEventualChargeItem", "Plan" IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "FamilyAccountEntry")
    OR EXISTS (SELECT 1 FROM "FamilyPaymentAllocation")
    OR EXISTS (SELECT 1 FROM "FamilyPayment")
    OR EXISTS (SELECT 1 FROM "PaymentReceipt")
    OR EXISTS (SELECT 1 FROM "ReceiptDelivery")
    OR EXISTS (SELECT 1 FROM "EventualChargeSchedule")
    OR EXISTS (SELECT 1 FROM "Family" WHERE "planId" IS NOT NULL)
    OR EXISTS (SELECT 1 FROM "Student" WHERE "planId" IS NOT NULL)
  THEN
    RAISE EXCEPTION 'Rubric migration requires empty accounting tables and no family/student plan assignments. No data was changed.';
  END IF;

  -- Reject unexpected inbound references, including any additional cascading tables.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE contype = 'f'
      AND confrelid IN ('"Plan"'::regclass, '"PlanEventualChargeItem"'::regclass)
      AND NOT (
        (confrelid = '"Plan"'::regclass AND (
          (conrelid IN ('"Family"'::regclass, '"Student"'::regclass) AND confdeltype = 'n')
          OR (conrelid = '"PlanEventualChargeItem"'::regclass AND confdeltype = 'c')
        ))
        OR (confrelid = '"PlanEventualChargeItem"'::regclass
          AND conrelid IN ('"FamilyAccountEntry"'::regclass, '"EventualChargeSchedule"'::regclass)
          AND confdeltype = 'n')
      )
  ) THEN
    RAISE EXCEPTION 'Unexpected legacy catalog references. Review migration safety before retrying.';
  END IF;
END;
$$;

-- Only the obsolete catalog is removed. No accounting or non-accounting rows are reset.
DELETE FROM "PlanEventualChargeItem";
DELETE FROM "Plan";

CREATE TABLE "BillingRubric" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingRubric_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BillingRubric_name_key" ON "BillingRubric"("name");
ALTER TABLE "EventualChargeSchedule" ADD COLUMN "rubricId" TEXT;
CREATE INDEX "EventualChargeSchedule_rubricId_idx" ON "EventualChargeSchedule"("rubricId");
ALTER TABLE "EventualChargeSchedule" ADD CONSTRAINT "EventualChargeSchedule_rubricId_fkey"
  FOREIGN KEY ("rubricId") REFERENCES "BillingRubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
