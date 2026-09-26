BEGIN;

CREATE TYPE "StudentReportType" AS ENUM ('TEXT', 'PDF');

CREATE TABLE "StudentReport" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "type" "StudentReportType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "cloudinaryPublicId" TEXT,
  "fileName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentReport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentReport_title_check" CHECK (char_length(btrim("title")) BETWEEN 2 AND 160),
  CONSTRAINT "StudentReport_content_check" CHECK (
    ("type" = 'TEXT' AND "body" IS NOT NULL AND char_length(btrim("body")) BETWEEN 1 AND 10000
      AND "cloudinaryPublicId" IS NULL AND "fileName" IS NULL) OR
    ("type" = 'PDF' AND "body" IS NULL AND "cloudinaryPublicId" IS NOT NULL
      AND char_length(btrim("cloudinaryPublicId")) > 0 AND "fileName" IS NOT NULL
      AND char_length(btrim("fileName")) BETWEEN 1 AND 255)
  )
);

CREATE INDEX "StudentReport_studentId_createdAt_idx" ON "StudentReport"("studentId", "createdAt");
CREATE INDEX "StudentReport_teacherId_idx" ON "StudentReport"("teacherId");

ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentReport" ADD CONSTRAINT "StudentReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
