import "server-only";

import { randomUUID } from "crypto";

import { InvitationStatus } from "@prisma/client";

import {
  cancelClaimedInvitationDeliveryJob,
  claimInvitationDeliveryJobs,
  markInvitationDeliveryJobSent,
  recoverExpiredInvitationDeliveryJobs,
  releaseInvitationDeliveryJob,
} from "@/modules/mailing/server/invitation-delivery-job.repository";
import { sendUserInvitationEmail } from "@/modules/mailing/server/mailing.service";
import { decryptInvitationToken } from "@/modules/users/server/invitation-token-cipher";

const BATCH_SIZE = 3;
const DEFAULT_MAX_RUN_DURATION_MS = 7 * 1000;
const LOCK_LEASE_MS = 5 * 60 * 1000;
const DELIVERY_INTERVAL_MS = 1000;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type InvitationDeliveryRunResult = {
  workerId: string;
  recovered: number;
  claimed: number;
  sent: number;
  failed: number;
  cancelled: number;
};

/** Processes a small, serial batch so a single invocation stays below one delivery per second. */
export async function runInvitationDeliveryWorker(
  now = new Date(),
  maxRunDurationMs = DEFAULT_MAX_RUN_DURATION_MS,
  onlyInvitationId?: string,
): Promise<InvitationDeliveryRunResult> {
  const workerId = randomUUID();
  const deadline = Date.now() + maxRunDurationMs;
  const recovered = await recoverExpiredInvitationDeliveryJobs(now, LOCK_LEASE_MS);
  const result: InvitationDeliveryRunResult = {
    workerId,
    recovered: recovered.count,
    claimed: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
  };
  const processedJobIds: string[] = [];

  while (Date.now() < deadline) {
    const jobs = await claimInvitationDeliveryJobs({
      workerId,
      limit: BATCH_SIZE,
      now,
      excludeJobIds: processedJobIds,
      onlyInvitationId,
    });
    if (!jobs.length) break;
    result.claimed += jobs.length;

    for (const [index, job] of jobs.entries()) {
      processedJobIds.push(job.id);
      const invitation = job.invitation;
      if (
        invitation.status !== InvitationStatus.PENDING
        || invitation.tokenVersion !== job.tokenVersion
        || !invitation.tokenCiphertext
      ) {
        await cancelClaimedInvitationDeliveryJob(job.id, workerId);
        result.cancelled += 1;
        continue;
      }

      try {
        const delivery = await sendUserInvitationEmail({
          email: invitation.email,
          role: invitation.role,
          invitationId: invitation.id,
          invitationToken: decryptInvitationToken(invitation.tokenCiphertext),
          familyName: invitation.family?.name,
          idempotencyKey: job.idempotencyKey,
        });
        if (delivery.status !== "sent") {
          await releaseInvitationDeliveryJob(job.id, workerId, "invitation_delivery_failed");
          result.failed += 1;
        } else {
          await markInvitationDeliveryJobSent(
            job.id,
            workerId,
            invitation.id,
            job.tokenVersion,
            delivery.providerMessageId,
          );
          result.sent += 1;
        }
      } catch (error) {
        await releaseInvitationDeliveryJob(
          job.id,
          workerId,
          error instanceof Error ? error.message : "invitation_delivery_failed",
        );
        result.failed += 1;
      }

      if (index < jobs.length - 1) await wait(DELIVERY_INTERVAL_MS);
    }

    if (jobs.length === BATCH_SIZE && Date.now() < deadline) await wait(DELIVERY_INTERVAL_MS);
  }

  return result;
}
