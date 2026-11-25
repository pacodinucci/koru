-- Additive: existing families are preserved as regular FAMILY rows with no admission origin.
CREATE TYPE "FamilyKind" AS ENUM ('FAMILY', 'CANDIDATE');

ALTER TABLE "Family" ADD COLUMN "kind" "FamilyKind" NOT NULL DEFAULT 'FAMILY';
ALTER TABLE "Family" ADD COLUMN "admissionInquiryId" TEXT;

CREATE UNIQUE INDEX "Family_admissionInquiryId_key" ON "Family"("admissionInquiryId");

ALTER TABLE "Family" ADD CONSTRAINT "Family_admissionInquiryId_fkey" FOREIGN KEY ("admissionInquiryId") REFERENCES "AdmissionInquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
