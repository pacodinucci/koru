ALTER TYPE "MediaAssetPurpose" ADD VALUE 'CMS';

CREATE TABLE "CmsImageEntry" (
    "id" TEXT NOT NULL,
    "pageSlug" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "draftUrl" TEXT NOT NULL,
    "draftPublicId" TEXT NOT NULL,
    "publishedUrl" TEXT,
    "publishedPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsImageEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsImageEntry_pageSlug_key_key" ON "CmsImageEntry"("pageSlug", "key");
CREATE INDEX "CmsImageEntry_pageSlug_idx" ON "CmsImageEntry"("pageSlug");
CREATE INDEX "CmsImageEntry_draftPublicId_idx" ON "CmsImageEntry"("draftPublicId");
CREATE INDEX "CmsImageEntry_publishedPublicId_idx" ON "CmsImageEntry"("publishedPublicId");
