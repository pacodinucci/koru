CREATE TABLE "StudentTeacher" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentTeacher_pkey" PRIMARY KEY ("id")
);

INSERT INTO "StudentTeacher" ("id", "studentId", "teacherId", "createdAt")
SELECT concat('student_teacher_', "id", '_', "primaryTeacherId"), "id", "primaryTeacherId", CURRENT_TIMESTAMP
FROM "Student"
WHERE "primaryTeacherId" IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX "StudentTeacher_studentId_teacherId_key" ON "StudentTeacher"("studentId", "teacherId");
CREATE INDEX "StudentTeacher_studentId_idx" ON "StudentTeacher"("studentId");
CREATE INDEX "StudentTeacher_teacherId_idx" ON "StudentTeacher"("teacherId");

ALTER TABLE "StudentTeacher" ADD CONSTRAINT "StudentTeacher_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentTeacher" ADD CONSTRAINT "StudentTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Student" DROP CONSTRAINT IF EXISTS "Student_primaryTeacherId_fkey";
DROP INDEX IF EXISTS "Student_primaryTeacherId_idx";
ALTER TABLE "Student" DROP COLUMN IF EXISTS "primaryTeacherId";
