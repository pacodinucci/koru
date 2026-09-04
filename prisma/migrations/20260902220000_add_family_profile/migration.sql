CREATE TABLE "FamilyProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "streetAndNumber" TEXT,
  "neighborhood" TEXT,
  "cityAndState" TEXT,
  "postalCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FamilyProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FamilyProfile_userId_key" ON "FamilyProfile"("userId");

ALTER TABLE "FamilyProfile" ADD CONSTRAINT "FamilyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
