import "server-only";

import { EmailDeliveryStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { MailRecipient, SendMailInput } from "@/modules/mailing/types/mailing";

type CreatePendingEmailMessageInput = Pick<
  SendMailInput,
  "type" | "subject" | "payload"
> & {
  from: string;
  recipients: MailRecipient[];
};

export async function createPendingEmailMessage({
  type,
  subject,
  from,
  recipients,
  payload,
}: CreatePendingEmailMessageInput) {
  return prisma.emailMessage.create({
    data: {
      type,
      subject,
      from,
      payload: payload as Prisma.InputJsonValue,
      recipients: {
        create: recipients.map((recipient) => ({
          email: recipient.email,
          name: recipient.name,
        })),
      },
    },
    select: {
      id: true,
    },
  });
}

export async function markEmailMessageSent(
  id: string,
  providerMessageId: string,
) {
  const sentAt = new Date();

  await prisma.$transaction([
    prisma.emailMessage.update({
      where: { id },
      data: {
        status: EmailDeliveryStatus.SENT,
        providerMessageId,
        sentAt,
        failedAt: null,
        error: null,
      },
    }),
    prisma.emailRecipient.updateMany({
      where: { messageId: id },
      data: {
        status: EmailDeliveryStatus.SENT,
        sentAt,
        error: null,
      },
    }),
  ]);
}

export async function markEmailMessageFailed(id: string, error: string) {
  const failedAt = new Date();

  await prisma.$transaction([
    prisma.emailMessage.update({
      where: { id },
      data: {
        status: EmailDeliveryStatus.FAILED,
        failedAt,
        error,
      },
    }),
    prisma.emailRecipient.updateMany({
      where: { messageId: id },
      data: {
        status: EmailDeliveryStatus.FAILED,
        error,
      },
    }),
  ]);
}

export async function listEmailMessagesForDashboard() {
  return prisma.emailMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      subject: true,
      from: true,
      status: true,
      provider: true,
      providerMessageId: true,
      error: true,
      sentAt: true,
      failedAt: true,
      createdAt: true,
      recipients: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          error: true,
          sentAt: true,
        },
      },
    },
  });
}
