CREATE TABLE "StudentAdmissionQuestionnaire" (
  "studentId" TEXT NOT NULL,
  "answers" JSONB NOT NULL DEFAULT '{}',
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentAdmissionQuestionnaire_pkey" PRIMARY KEY ("studentId")
);

CREATE INDEX "StudentAdmissionQuestionnaire_submittedAt_idx" ON "StudentAdmissionQuestionnaire"("submittedAt");
ALTER TABLE "StudentAdmissionQuestionnaire" ADD CONSTRAINT "StudentAdmissionQuestionnaire_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
