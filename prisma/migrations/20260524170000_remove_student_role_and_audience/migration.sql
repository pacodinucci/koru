-- Remove STUDENT from UserRole enum
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'TEACHER', 'PARENT');

ALTER TABLE "user"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "role"::text = 'STUDENT' THEN 'PARENT'
      ELSE "role"::text
    END
  )::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'PARENT';

-- Remove STUDENTS from CalendarAudienceType enum
CREATE TYPE "CalendarAudienceType_new" AS ENUM ('ALL', 'TEACHERS', 'PARENTS', 'PRIVATE');

ALTER TABLE "CalendarEvent"
  ALTER COLUMN "audienceType" DROP DEFAULT,
  ALTER COLUMN "audienceType" TYPE "CalendarAudienceType_new"
  USING (
    CASE
      WHEN "audienceType"::text = 'STUDENTS' THEN 'PARENTS'
      ELSE "audienceType"::text
    END
  )::"CalendarAudienceType_new";

DROP TYPE "CalendarAudienceType";
ALTER TYPE "CalendarAudienceType_new" RENAME TO "CalendarAudienceType";
ALTER TABLE "CalendarEvent" ALTER COLUMN "audienceType" SET DEFAULT 'ALL';
