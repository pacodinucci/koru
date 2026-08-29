CREATE TYPE "MediaAssetPurpose" AS ENUM ('BLOG', 'CALENDAR');
ALTER TABLE "CalendarEvent" ADD COLUMN "imagePublicId" TEXT;
CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "purpose" "MediaAssetPurpose" NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "blogPostId" TEXT,
  "calendarEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attachedAt" TIMESTAMP(3),
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaAsset_url_key" ON "MediaAsset"("url");
CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");
CREATE INDEX "MediaAsset_purpose_uploadedById_attachedAt_idx" ON "MediaAsset"("purpose", "uploadedById", "attachedAt");
CREATE INDEX "MediaAsset_blogPostId_idx" ON "MediaAsset"("blogPostId");
CREATE INDEX "MediaAsset_calendarEventId_idx" ON "MediaAsset"("calendarEventId");
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;