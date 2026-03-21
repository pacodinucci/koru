-- CreateTable
CREATE TABLE "CmsTextEntry" (
    "key" TEXT NOT NULL,
    "draftValue" TEXT NOT NULL,
    "publishedValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsTextEntry_pkey" PRIMARY KEY ("key")
);
