BEGIN;

CREATE TYPE "FollowUpAgreementStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "FollowUpAgreement" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "FollowUpAgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "attachmentPublicId" TEXT,
    "attachmentFileName" TEXT,
    "attachmentMimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "FollowUpAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FollowUpAgreementFamily" (
    "agreementId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3),
    "consentedById" TEXT,
    CONSTRAINT "FollowUpAgreementFamily_pkey" PRIMARY KEY ("agreementId","familyId")
);

CREATE TABLE "FollowUpAgreementStudent" (
    "agreementId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "FollowUpAgreementStudent_pkey" PRIMARY KEY ("agreementId","studentId")
);

CREATE INDEX "FollowUpAgreement_teacherId_createdAt_idx" ON "FollowUpAgreement"("teacherId", "createdAt");
CREATE INDEX "FollowUpAgreement_status_publishedAt_idx" ON "FollowUpAgreement"("status", "publishedAt");
CREATE INDEX "FollowUpAgreementFamily_familyId_consentedAt_idx" ON "FollowUpAgreementFamily"("familyId", "consentedAt");
CREATE INDEX "FollowUpAgreementFamily_consentedById_idx" ON "FollowUpAgreementFamily"("consentedById");
CREATE INDEX "FollowUpAgreementStudent_studentId_idx" ON "FollowUpAgreementStudent"("studentId");

ALTER TABLE "FollowUpAgreement" ADD CONSTRAINT "FollowUpAgreement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollowUpAgreementFamily" ADD CONSTRAINT "FollowUpAgreementFamily_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "FollowUpAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUpAgreementFamily" ADD CONSTRAINT "FollowUpAgreementFamily_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollowUpAgreementFamily" ADD CONSTRAINT "FollowUpAgreementFamily_consentedById_fkey" FOREIGN KEY ("consentedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollowUpAgreementStudent" ADD CONSTRAINT "FollowUpAgreementStudent_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "FollowUpAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUpAgreementStudent" ADD CONSTRAINT "FollowUpAgreementStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
