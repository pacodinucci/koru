import type { EmailDeliveryStatus, EmailMessageType } from "@prisma/client";
import type { ReactNode } from "react";

export type MailRecipient = {
  email: string;
  name?: string;
};

export type SendMailInput = {
  type: EmailMessageType;
  to: MailRecipient[];
  subject: string;
  react: ReactNode;
  payload?: Record<string, unknown>;
};

export type MailProviderSendInput = {
  from: string;
  to: string[];
  subject: string;
  react: ReactNode;
};

export type MailProviderSendResult = {
  providerMessageId: string;
};

export type MailingDashboardMessage = {
  id: string;
  type: EmailMessageType;
  subject: string;
  from: string;
  status: EmailDeliveryStatus;
  provider: string;
  providerMessageId: string | null;
  error: string | null;
  sentAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  recipients: Array<{
    id: string;
    email: string;
    name: string | null;
    status: EmailDeliveryStatus;
    error: string | null;
    sentAt: Date | null;
  }>;
};
