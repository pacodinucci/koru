BEGIN;

CREATE TABLE "PsychopedagogyEntry" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "entryDate" DATE NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PsychopedagogyEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PsychopedagogyEntry_title_check" CHECK (char_length(btrim("title")) BETWEEN 1 AND 160),
  CONSTRAINT "PsychopedagogyEntry_body_check" CHECK (char_length(btrim("body")) BETWEEN 1 AND 10000)
);

CREATE INDEX "PsychopedagogyEntry_studentId_entryDate_idx" ON "PsychopedagogyEntry"("studentId", "entryDate");
CREATE INDEX "PsychopedagogyEntry_teacherId_idx" ON "PsychopedagogyEntry"("teacherId");
ALTER TABLE "PsychopedagogyEntry" ADD CONSTRAINT "PsychopedagogyEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychopedagogyEntry" ADD CONSTRAINT "PsychopedagogyEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
