ALTER TABLE "UserInvitation" ADD COLUMN "teacherName" TEXT;
ALTER TABLE "UserInvitation" ADD COLUMN "teacherPosition" TEXT;
ALTER TABLE "UserInvitation" ADD COLUMN "teacherGroup" TEXT;
ALTER TABLE "UserInvitation" ADD COLUMN "teacherGroupMatched" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TeacherProfile" ADD COLUMN "position" TEXT;
ALTER TABLE "TeacherProfile" ADD COLUMN "organizationGroup" TEXT;
ALTER TABLE "TeacherProfile" ADD COLUMN "pendingOrganizationGroup" TEXT;
