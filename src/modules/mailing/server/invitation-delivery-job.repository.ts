import "server-only";

import { prisma } from "@/lib/prisma";

import {
  InvitationDeliveryJobStatus,
  type Prisma,
} from "@prisma/client";

const CLAIMABLE_STATUSES = [InvitationDeliveryJobStatus.PENDING];

type CreateInvitationDeliveryJobInput = {
  invitationId: string;
  tokenVersion: number;
  idempotencyKey: string;
  nextAttemptAt?: Date;
};

type TransactionClient = Prisma.TransactionClient;

type ClaimInvitationDeliveryJobsInput = {
  workerId: string;
  limit: number;
  now: Date;
};

const claimedJobSelect = {
  id: true,
  tokenVersion: true,
  idempotencyKey: true,
  invitation: {
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      tokenVersion: true,
      tokenCiphertext: true,
      family: { select: { name: true } },
    },
  },
} satisfies Prisma.InvitationDeliveryJobSelect;

/** Persists delivery work inside the caller's business transaction. */
export function createInvitationDeliveryJob(
  tx: TransactionClient,
  input: CreateInvitationDeliveryJobInput,
) {
  return tx.invitationDeliveryJob.create({
    data: {
      invitationId: input.invitationId,
      tokenVersion: input.tokenVersion,
      idempotencyKey: input.idempotencyKey,
      nextAttemptAt: input.nextAttemptAt,
    },
  });
}

/** Cancels delivery work associated with token versions replaced by a re-send. */
export function cancelStaleInvitationDeliveryJobs(
  tx: TransactionClient,
  invitationId: string,
  nextTokenVersion: number,
) {
  return tx.invitationDeliveryJob.updateMany({
    where: {
      invitationId,
      tokenVersion: { lt: nextTokenVersion },
      status: {
        in: [
          InvitationDeliveryJobStatus.PENDING,
          InvitationDeliveryJobStatus.PROCESSING,
          InvitationDeliveryJobStatus.RETRY_SCHEDULED,
        ],
      },
    },
    data: {
      status: InvitationDeliveryJobStatus.CANCELLED,
      cancelledAt: new Date(),
      lockedAt: null,
      lockedBy: null,
    },
  });
}

/** Releases jobs abandoned by an interrupted worker so a later invocation can reclaim them. */
export function recoverExpiredInvitationDeliveryJobs(now: Date, lockLeaseMs: number) {
  const expiredBefore = new Date(now.getTime() - lockLeaseMs);
  return prisma.invitationDeliveryJob.updateMany({
    where: {
      status: InvitationDeliveryJobStatus.PROCESSING,
      lockedAt: { lt: expiredBefore },
    },
    data: {
      status: InvitationDeliveryJobStatus.PENDING,
      lockedAt: null,
      lockedBy: null,
      nextAttemptAt: now,
    },
  });
}

/** Claims due jobs one by one with a conditional update, which is safe across concurrent workers. */
export async function claimInvitationDeliveryJobs({ workerId, limit, now }: ClaimInvitationDeliveryJobsInput) {
  const candidates = await prisma.invitationDeliveryJob.findMany({
    where: {
      status: { in: CLAIMABLE_STATUSES },
      nextAttemptAt: { lte: now },
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true },
  });

  const claimed = [];
  for (const candidate of candidates) {
    const result = await prisma.invitationDeliveryJob.updateMany({
      where: {
        id: candidate.id,
        status: { in: CLAIMABLE_STATUSES },
        nextAttemptAt: { lte: now },
      },
      data: {
        status: InvitationDeliveryJobStatus.PROCESSING,
        attemptCount: { increment: 1 },
        lockedAt: now,
        lockedBy: workerId,
      },
    });
    if (!result.count) continue;

    const job = await prisma.invitationDeliveryJob.findFirst({
      where: { id: candidate.id, status: InvitationDeliveryJobStatus.PROCESSING, lockedBy: workerId },
      select: claimedJobSelect,
    });
    if (job) claimed.push(job);
  }
  return claimed;
}

/**
 * Records provider acceptance and the invitation timestamp in one database transaction.
 * A worker crash before this transaction is safe: the next attempt reuses the same
 * provider idempotency key. A crash after it cannot leave `lastSentAt` stale.
 */
export async function markInvitationDeliveryJobSent(
  jobId: string,
  workerId: string,
  invitationId: string,
  tokenVersion: number,
  providerMessageId?: string,
) {
  const sentAt = new Date();
  return prisma.$transaction(async (tx) => {
    const job = await tx.invitationDeliveryJob.updateMany({
      where: { id: jobId, status: InvitationDeliveryJobStatus.PROCESSING, lockedBy: workerId },
      data: {
        status: InvitationDeliveryJobStatus.SENT,
        providerMessageId,
        sentAt,
        lockedAt: null,
        lockedBy: null,
        lastError: null,
        lastErrorCode: null,
      },
    });
    if (!job.count) return job;

    await tx.userInvitation.updateMany({
      where: { id: invitationId, tokenVersion },
      data: { lastSentAt: sentAt },
    });
    return job;
  });
}
/** Stage 04 will replace this immediate release with error classification and backoff. */
export function releaseInvitationDeliveryJob(jobId: string, workerId: string, error: string) {
  return prisma.invitationDeliveryJob.updateMany({
    where: { id: jobId, status: InvitationDeliveryJobStatus.PROCESSING, lockedBy: workerId },
    data: {
      status: InvitationDeliveryJobStatus.PENDING,
      lockedAt: null,
      lockedBy: null,
      lastError: error,
      nextAttemptAt: new Date(),
    },
  });
}

export function cancelClaimedInvitationDeliveryJob(jobId: string, workerId: string) {
  return prisma.invitationDeliveryJob.updateMany({
    where: { id: jobId, status: InvitationDeliveryJobStatus.PROCESSING, lockedBy: workerId },
    data: {
      status: InvitationDeliveryJobStatus.CANCELLED,
      cancelledAt: new Date(),
      lockedAt: null,
      lockedBy: null,
    },
  });
}
const invitationDeliveryDashboardSelect = {
  id: true,
  tokenVersion: true,
  status: true,
  attemptCount: true,
  nextAttemptAt: true,
  lockedAt: true,
  lockedBy: true,
  lastError: true,
  lastErrorCode: true,
  providerMessageId: true,
  sentAt: true,
  failedAt: true,
  createdAt: true,
  invitation: {
    select: {
      id: true,
      email: true,
      tokenVersion: true,
      status: true,
      family: { select: { name: true } },
    },
  },
} satisfies Prisma.InvitationDeliveryJobSelect;

/** Gives operators a bounded, auditable view of invitation delivery work. */
export function listInvitationDeliveryJobsForDashboard() {
  return prisma.invitationDeliveryJob.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: invitationDeliveryDashboardSelect,
  });
}

/** Requeues only a definitive failure and only while its invitation/token remains current. */
export async function requeueFailedInvitationDeliveryJob(jobId: string) {
  const job = await prisma.invitationDeliveryJob.findUnique({
    where: { id: jobId },
    select: { invitationId: true, tokenVersion: true, status: true },
  });
  if (!job || job.status !== InvitationDeliveryJobStatus.FAILED) {
    throw new Error("invitation_delivery_job_not_requeueable");
  }

  const result = await prisma.$transaction(async (tx) => {
    const invitation = await tx.userInvitation.findFirst({
      where: {
        id: job.invitationId,
        status: "PENDING",
        tokenVersion: job.tokenVersion,
      },
      select: { id: true },
    });
    if (!invitation) throw new Error("invitation_delivery_job_not_requeueable");

    return tx.invitationDeliveryJob.updateMany({
      where: { id: jobId, status: InvitationDeliveryJobStatus.FAILED },
      data: {
        status: InvitationDeliveryJobStatus.PENDING,
        nextAttemptAt: new Date(),
        lockedAt: null,
        lockedBy: null,
      },
    });
  });
  if (!result.count) throw new Error("invitation_delivery_job_not_requeueable");
}