CREATE TABLE "BasecampConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "basecampIdentityId" TEXT NOT NULL,
    "accessTokenCiphertext" TEXT NOT NULL,
    "refreshTokenCiphertext" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BasecampConnection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BasecampConnection_userId_key" ON "BasecampConnection"("userId");
ALTER TABLE "BasecampConnection" ADD CONSTRAINT "BasecampConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
