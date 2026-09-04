CREATE TYPE "StudentRecordStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'NEEDS_CHANGES');

ALTER TABLE "Student"
ADD COLUMN "documentType" TEXT,
ADD COLUMN "documentNumber" TEXT,
ADD COLUMN "recordStatus" "StudentRecordStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "recordStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "recordCompletedAt" TIMESTAMP(3);

ALTER TABLE "StudentGuardian"
ADD COLUMN "fullName" TEXT,
ADD COLUMN "phone" TEXT;

CREATE TABLE "StudentAddress" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "streetAndNumber" TEXT NOT NULL,
  "neighborhood" TEXT NOT NULL,
  "cityAndState" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentAddress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentMedicalProfile" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "bloodType" TEXT,
  "knownAllergies" TEXT,
  "medicalConditions" TEXT,
  "regularMedications" TEXT,
  "hasHealthInsurance" BOOLEAN NOT NULL DEFAULT false,
  "insuranceProviderAndPolicy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentMedicalProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentEmergencyContact" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentEmergencyContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Student_documentType_documentNumber_key" ON "Student"("documentType", "documentNumber");
CREATE INDEX "Student_recordStatus_updatedAt_idx" ON "Student"("recordStatus", "updatedAt");
CREATE UNIQUE INDEX "StudentAddress_studentId_key" ON "StudentAddress"("studentId");
CREATE UNIQUE INDEX "StudentMedicalProfile_studentId_key" ON "StudentMedicalProfile"("studentId");
CREATE INDEX "StudentEmergencyContact_studentId_priority_idx" ON "StudentEmergencyContact"("studentId", "priority");

ALTER TABLE "StudentAddress" ADD CONSTRAINT "StudentAddress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentMedicalProfile" ADD CONSTRAINT "StudentMedicalProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentEmergencyContact" ADD CONSTRAINT "StudentEmergencyContact_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;