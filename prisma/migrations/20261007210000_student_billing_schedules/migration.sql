ALTER TABLE "EventualChargeSchedule" ADD COLUMN "sourceKey" TEXT, ADD COLUMN "studentId" TEXT, ADD COLUMN "isBase" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "effectiveFrom" DATE, ADD COLUMN "cancelledFrom" DATE;
CREATE UNIQUE INDEX "EventualChargeSchedule_sourceKey_key" ON "EventualChargeSchedule"("sourceKey");
ALTER TABLE "EventualChargeSchedule" ADD CONSTRAINT "EventualChargeSchedule_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
