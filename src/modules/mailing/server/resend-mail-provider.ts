import "server-only";

import { Resend } from "resend";

import { env } from "@/lib/env";
import type {
  MailProviderSendInput,
  MailProviderSendResult,
} from "@/modules/mailing/types/mailing";

export async function sendWithResend({
  from,
  to,
  subject,
  react,
}: MailProviderSendInput): Promise<MailProviderSendResult> {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    react,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Resend did not return an email id");
  }

  return { providerMessageId: data.id };
}
