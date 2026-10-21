-- Add a separate report model; existing StudentReport data/APIs remain unchanged.
CREATE TABLE "TeacherReport" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "StudentReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "cloudinaryPublicId" TEXT,
    "fileName" TEXT,
    "visibleToTeacher" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherReport_teacherId_createdAt_idx" ON "TeacherReport"("teacherId", "createdAt");
CREATE INDEX "TeacherReport_authorId_idx" ON "TeacherReport"("authorId");

-- Restrict parent deletion so private files cannot be orphaned by a cascade.
ALTER TABLE "TeacherReport" ADD CONSTRAINT "TeacherReport_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherReport" ADD CONSTRAINT "TeacherReport_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
