-- CreateEnum
CREATE TYPE "InvitationDeliveryJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'RETRY_SCHEDULED', 'SENT', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "UserInvitation"
  ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "tokenCiphertext" TEXT,
  ADD COLUMN "tokenEncryptionKeyVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "InvitationDeliveryJob" (
  "id" TEXT NOT NULL,
  "invitationId" TEXT NOT NULL,
  "tokenVersion" INTEGER NOT NULL,
  "status" "InvitationDeliveryJobStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "lastError" TEXT,
  "lastErrorCode" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InvitationDeliveryJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitationDeliveryJob_idempotencyKey_key" ON "InvitationDeliveryJob"("idempotencyKey");
CREATE UNIQUE INDEX "InvitationDeliveryJob_invitationId_tokenVersion_key" ON "InvitationDeliveryJob"("invitationId", "tokenVersion");
CREATE INDEX "InvitationDeliveryJob_status_nextAttemptAt_createdAt_idx" ON "InvitationDeliveryJob"("status", "nextAttemptAt", "createdAt");
CREATE INDEX "InvitationDeliveryJob_status_lockedAt_idx" ON "InvitationDeliveryJob"("status", "lockedAt");

-- AddForeignKey
ALTER TABLE "InvitationDeliveryJob" ADD CONSTRAINT "InvitationDeliveryJob_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "UserInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
