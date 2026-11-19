-- Additive: existing ContactMessage data and student questionnaires are untouched.
CREATE TABLE "AdmissionInquiry" (
  "id" TEXT NOT NULL,
  "guardianNames" TEXT NOT NULL,
  "childName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "questionnaireVersion" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdmissionInquiry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdmissionInquiry_idempotencyKey_key" ON "AdmissionInquiry"("idempotencyKey");
CREATE INDEX "AdmissionInquiry_status_submittedAt_idx" ON "AdmissionInquiry"("status", "submittedAt");
CREATE INDEX "AdmissionInquiry_submittedAt_id_idx" ON "AdmissionInquiry"("submittedAt", "id");
