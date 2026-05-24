-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'PARENT', 'STUDENT');

-- CreateEnum
CREATE TYPE "CalendarEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CalendarAudienceType" AS ENUM ('ALL', 'STUDENTS', 'TEACHERS', 'PARENTS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "CalendarEventKind" AS ENUM ('EVENT', 'MEETING');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'PARENT';

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "status" "CalendarEventStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceType" "CalendarAudienceType" NOT NULL DEFAULT 'ALL',
    "kind" "CalendarEventKind" NOT NULL DEFAULT 'EVENT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventAudience" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEventAudience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_startsAt_endsAt_idx" ON "CalendarEvent"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_status_audienceType_idx" ON "CalendarEvent"("status", "audienceType");

-- CreateIndex
CREATE INDEX "CalendarEventAudience_eventId_idx" ON "CalendarEventAudience"("eventId");

-- CreateIndex
CREATE INDEX "CalendarEventAudience_userId_idx" ON "CalendarEventAudience"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventAudience_eventId_userId_key" ON "CalendarEventAudience"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAudience" ADD CONSTRAINT "CalendarEventAudience_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAudience" ADD CONSTRAINT "CalendarEventAudience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
