CREATE TYPE "FamilyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

CREATE TABLE "Plan" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "monthlyFee" DECIMAL(12,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Family" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "FamilyStatus" NOT NULL DEFAULT 'ACTIVE',
  "streetAndNumber" TEXT,
  "neighborhood" TEXT,
  "cityAndState" TEXT,
  "postalCode" TEXT,
  "notes" TEXT,
  "planId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "user" ADD COLUMN "familyId" TEXT;
ALTER TABLE "Student" ADD COLUMN "familyId" TEXT;
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE INDEX "Plan_isActive_idx" ON "Plan"("isActive");
CREATE INDEX "Family_status_idx" ON "Family"("status");
CREATE INDEX "Family_planId_idx" ON "Family"("planId");
CREATE INDEX "Student_familyId_idx" ON "Student"("familyId");
ALTER TABLE "Family" ADD CONSTRAINT "Family_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user" ADD CONSTRAINT "user_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;