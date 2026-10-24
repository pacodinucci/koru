BEGIN;

CREATE TYPE "PsychopedagogyAccompanimentKind" AS ENUM ('INDIVIDUAL', 'FAMILY');

CREATE TABLE "PsychopedagogyLearningProfile" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PsychopedagogyLearningProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PsychopedagogyLearningProfile_description_check" CHECK (char_length(btrim("description")) BETWEEN 1 AND 10000)
);

CREATE TABLE "PsychopedagogyAccompaniment" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "entryDate" DATE NOT NULL,
  "kind" "PsychopedagogyAccompanimentKind" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PsychopedagogyAccompaniment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PsychopedagogyAccompaniment_title_check" CHECK (char_length(btrim("title")) BETWEEN 1 AND 160),
  CONSTRAINT "PsychopedagogyAccompaniment_body_check" CHECK (char_length(btrim("body")) BETWEEN 1 AND 10000)
);

CREATE TABLE "PsychopedagogyIntervention" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "entryDate" DATE NOT NULL,
  "title" TEXT NOT NULL,
  "observationAnalysis" TEXT NOT NULL,
  "strategyFeedback" TEXT NOT NULL,
  "workPlan" TEXT NOT NULL,
  "implementation" TEXT NOT NULL,
  "evaluationResults" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PsychopedagogyIntervention_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PsychopedagogyIntervention_title_check" CHECK (char_length(btrim("title")) BETWEEN 1 AND 160),
  CONSTRAINT "PsychopedagogyIntervention_observationAnalysis_check" CHECK (char_length(btrim("observationAnalysis")) BETWEEN 1 AND 10000),
  CONSTRAINT "PsychopedagogyIntervention_strategyFeedback_check" CHECK (char_length(btrim("strategyFeedback")) BETWEEN 1 AND 10000),
  CONSTRAINT "PsychopedagogyIntervention_workPlan_check" CHECK (char_length(btrim("workPlan")) BETWEEN 1 AND 10000),
  CONSTRAINT "PsychopedagogyIntervention_implementation_check" CHECK (char_length(btrim("implementation")) BETWEEN 1 AND 10000),
  CONSTRAINT "PsychopedagogyIntervention_evaluationResults_check" CHECK (char_length(btrim("evaluationResults")) BETWEEN 1 AND 10000)
);

CREATE TABLE "PsychopedagogyInstrument" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "entryDate" DATE NOT NULL,
  "name" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PsychopedagogyInstrument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PsychopedagogyInstrument_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 160),
  CONSTRAINT "PsychopedagogyInstrument_body_check" CHECK (char_length(btrim("body")) BETWEEN 1 AND 10000)
);

CREATE UNIQUE INDEX "PsychopedagogyLearningProfile_studentId_key" ON "PsychopedagogyLearningProfile"("studentId");
CREATE INDEX "PsychopedagogyLearningProfile_updatedById_idx" ON "PsychopedagogyLearningProfile"("updatedById");
CREATE INDEX "PsychopedagogyAccompaniment_studentId_entryDate_idx" ON "PsychopedagogyAccompaniment"("studentId", "entryDate");
CREATE INDEX "PsychopedagogyAccompaniment_teacherId_idx" ON "PsychopedagogyAccompaniment"("teacherId");
CREATE INDEX "PsychopedagogyIntervention_studentId_entryDate_idx" ON "PsychopedagogyIntervention"("studentId", "entryDate");
CREATE INDEX "PsychopedagogyIntervention_teacherId_idx" ON "PsychopedagogyIntervention"("teacherId");
CREATE INDEX "PsychopedagogyInstrument_studentId_entryDate_idx" ON "PsychopedagogyInstrument"("studentId", "entryDate");
CREATE INDEX "PsychopedagogyInstrument_teacherId_idx" ON "PsychopedagogyInstrument"("teacherId");

ALTER TABLE "PsychopedagogyLearningProfile" ADD CONSTRAINT "PsychopedagogyLearningProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyLearningProfile" ADD CONSTRAINT "PsychopedagogyLearningProfile_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyAccompaniment" ADD CONSTRAINT "PsychopedagogyAccompaniment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyAccompaniment" ADD CONSTRAINT "PsychopedagogyAccompaniment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyIntervention" ADD CONSTRAINT "PsychopedagogyIntervention_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyIntervention" ADD CONSTRAINT "PsychopedagogyIntervention_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyInstrument" ADD CONSTRAINT "PsychopedagogyInstrument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyInstrument" ADD CONSTRAINT "PsychopedagogyInstrument_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
