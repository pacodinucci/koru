CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "StudentGroupTeacher" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentGroupTeacher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Exam" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subject" TEXT,
  "examDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamGrade" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "observations" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamGrade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentGroupTeacher_groupId_teacherId_key" ON "StudentGroupTeacher"("groupId", "teacherId");
CREATE INDEX "StudentGroupTeacher_groupId_idx" ON "StudentGroupTeacher"("groupId");
CREATE INDEX "StudentGroupTeacher_teacherId_idx" ON "StudentGroupTeacher"("teacherId");

CREATE INDEX "Exam_groupId_examDate_idx" ON "Exam"("groupId", "examDate");
CREATE INDEX "Exam_teacherId_examDate_idx" ON "Exam"("teacherId", "examDate");
CREATE INDEX "Exam_status_examDate_idx" ON "Exam"("status", "examDate");

CREATE UNIQUE INDEX "ExamGrade_examId_studentId_key" ON "ExamGrade"("examId", "studentId");
CREATE INDEX "ExamGrade_studentId_idx" ON "ExamGrade"("studentId");

ALTER TABLE "StudentGroupTeacher" ADD CONSTRAINT "StudentGroupTeacher_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentGroupTeacher" ADD CONSTRAINT "StudentGroupTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamGrade" ADD CONSTRAINT "ExamGrade_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamGrade" ADD CONSTRAINT "ExamGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;