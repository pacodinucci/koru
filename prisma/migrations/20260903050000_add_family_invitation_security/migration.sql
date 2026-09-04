ALTER TABLE "UserInvitation" ADD COLUMN "familyId" TEXT;
ALTER TABLE "UserInvitation" ADD COLUMN "tokenHash" TEXT;
ALTER TABLE "UserInvitation" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "UserInvitation" ADD COLUMN "lastSentAt" TIMESTAMP(3);
CREATE INDEX "UserInvitation_familyId_status_idx" ON "UserInvitation"("familyId", "status");
CREATE INDEX "UserInvitation_expiresAt_idx" ON "UserInvitation"("expiresAt");
ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;