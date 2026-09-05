CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "cloudinaryUrl" TEXT NOT NULL,
  "cloudinaryPublicId" TEXT NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "uploadedById" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Document_slug_key" ON "Document"("slug");
CREATE UNIQUE INDEX "Document_cloudinaryUrl_key" ON "Document"("cloudinaryUrl");
CREATE UNIQUE INDEX "Document_cloudinaryPublicId_key" ON "Document"("cloudinaryPublicId");
CREATE INDEX "Document_status_publishedAt_idx" ON "Document"("status", "publishedAt");
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
