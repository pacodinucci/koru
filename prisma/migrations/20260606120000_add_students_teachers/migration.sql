CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED');
CREATE TYPE "StudentGuardianRelationship" AS ENUM ('MOTHER', 'FATHER', 'TUTOR', 'GUARDIAN', 'OTHER');

CREATE TABLE "StudentGroup" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "ageRange" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeacherProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "displayName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "bio" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Student" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "groupId" TEXT NOT NULL,
  "primaryTeacherId" TEXT,
  "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentGuardian" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "relationship" "StudentGuardianRelationship" NOT NULL DEFAULT 'GUARDIAN',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "canPickup" BOOLEAN NOT NULL DEFAULT false,
  "emergencyContact" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentGroup_slug_key" ON "StudentGroup"("slug");
CREATE INDEX "StudentGroup_isActive_sortOrder_idx" ON "StudentGroup"("isActive", "sortOrder");

CREATE UNIQUE INDEX "TeacherProfile_userId_key" ON "TeacherProfile"("userId");
CREATE INDEX "TeacherProfile_isActive_displayName_idx" ON "TeacherProfile"("isActive", "displayName");
CREATE INDEX "TeacherProfile_email_idx" ON "TeacherProfile"("email");

CREATE INDEX "Student_groupId_status_idx" ON "Student"("groupId", "status");
CREATE INDEX "Student_primaryTeacherId_idx" ON "Student"("primaryTeacherId");
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");

CREATE UNIQUE INDEX "StudentGuardian_studentId_email_key" ON "StudentGuardian"("studentId", "email");
CREATE INDEX "StudentGuardian_userId_idx" ON "StudentGuardian"("userId");
CREATE INDEX "StudentGuardian_email_idx" ON "StudentGuardian"("email");

ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_primaryTeacherId_fkey" FOREIGN KEY ("primaryTeacherId") REFERENCES "TeacherProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "StudentGroup" ("id", "name", "slug", "ageRange", "sortOrder", "updatedAt") VALUES
  ('grupo_esporas', 'Grupo Esporas', 'grupo-esporas', '3 a 6 años', 10, CURRENT_TIMESTAMP),
  ('grupo_koru', 'Grupo Koru', 'grupo-koru', '6/5 a 7/8 años', 20, CURRENT_TIMESTAMP),
  ('grupo_helechos_1', 'Grupo Helechos 1', 'grupo-helechos-1', '8 a 9/5 años', 30, CURRENT_TIMESTAMP),
  ('grupo_helechos_2', 'Grupo Helechos 2', 'grupo-helechos-2', '9/8 a 12 años', 40, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

