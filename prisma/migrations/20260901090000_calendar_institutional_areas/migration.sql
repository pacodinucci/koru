-- CreateEnum
CREATE TYPE "CalendarAccessScope" AS ENUM ('LEGACY', 'INTERNAL', 'AREAS', 'PEOPLE');

-- AlterTable: the default preserves existing event classification without a data rewrite.
ALTER TABLE "CalendarEvent"
    ADD COLUMN "accessScope" "CalendarAccessScope" NOT NULL DEFAULT 'LEGACY',
    ADD COLUMN "responsibleAreaId" TEXT;

-- CreateTable
CREATE TABLE "CalendarArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "CalendarArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarAreaGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CalendarAreaGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarEventArea" (
    "eventId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "CalendarEventArea_pkey" PRIMARY KEY ("eventId", "areaId")
);

CREATE TABLE "CalendarEventAudienceArea" (
    "eventId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "CalendarEventAudienceArea_pkey" PRIMARY KEY ("eventId", "areaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarArea_name_key" ON "CalendarArea"("name");
CREATE UNIQUE INDEX "CalendarAreaGrant_areaId_userId_key" ON "CalendarAreaGrant"("areaId", "userId");
CREATE INDEX "CalendarAreaGrant_userId_idx" ON "CalendarAreaGrant"("userId");
CREATE INDEX "CalendarEvent_responsibleAreaId_idx" ON "CalendarEvent"("responsibleAreaId");
CREATE INDEX "CalendarEventArea_areaId_idx" ON "CalendarEventArea"("areaId");
CREATE INDEX "CalendarEventAudienceArea_areaId_idx" ON "CalendarEventAudienceArea"("areaId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_responsibleAreaId_fkey" FOREIGN KEY ("responsibleAreaId") REFERENCES "CalendarArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarAreaGrant" ADD CONSTRAINT "CalendarAreaGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarAreaGrant" ADD CONSTRAINT "CalendarAreaGrant_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "CalendarArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventArea" ADD CONSTRAINT "CalendarEventArea_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventArea" ADD CONSTRAINT "CalendarEventArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "CalendarArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventAudienceArea" ADD CONSTRAINT "CalendarEventAudienceArea_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventAudienceArea" ADD CONSTRAINT "CalendarEventAudienceArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "CalendarArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the fixed institutional areas, without modifying events or assigning grants.
INSERT INTO "CalendarArea" ("id", "name", "color") VALUES
    ('calendar-area-direction', 'Dirección', '#7c3aed'),
    ('calendar-area-academic', 'Académico', '#2563eb'),
    ('calendar-area-psychopedagogy', 'Coordinación Psicopedagógica y Acompañamiento a Familias', '#059669'),
    ('calendar-area-operations', 'Operaciones y Mantenimiento', '#d97706');
