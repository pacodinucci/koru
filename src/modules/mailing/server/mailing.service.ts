import "server-only";

import { EmailMessageType, type UserRole } from "@prisma/client";
import { createElement } from "react";

import { env } from "@/lib/env";
import {
  createPendingEmailMessage,
  markEmailMessageFailed,
  markEmailMessageSent,
} from "@/modules/mailing/server/mailing.repository";
import { sendWithResend } from "@/modules/mailing/server/resend-mail-provider";
import { UserInvitationEmail } from "@/modules/mailing/templates/user-invitation-email";
import type { SendMailInput } from "@/modules/mailing/types/mailing";

const defaultFrom = "Koru <onboarding@resend.dev>";

function getFromAddress() {
  return env.MAIL_FROM || defaultFrom;
}

function getAppUrl() {
  return env.APP_URL || env.BETTER_AUTH_URL;
}

export async function sendMail(input: SendMailInput) {
  const from = getFromAddress();
  const message = await createPendingEmailMessage({
    type: input.type,
    subject: input.subject,
    from,
    recipients: input.to,
    payload: input.payload,
  });

  try {
    const result = await sendWithResend({
      from,
      to: input.to.map((recipient) => recipient.email),
      subject: input.subject,
      react: input.react,
    });

    await markEmailMessageSent(message.id, result.providerMessageId);
    return { id: message.id, status: "sent" as const };
  } catch (error) {
    await markEmailMessageFailed(
      message.id,
      error instanceof Error ? error.message : "Unknown email error",
    );
    return { id: message.id, status: "failed" as const };
  }
}

type SendUserInvitationEmailInput = {
  email: string;
  role: UserRole;
  invitationId: string;
};

export async function sendUserInvitationEmail({
  email,
  role,
  invitationId,
}: SendUserInvitationEmailInput) {
  const invitationUrl = new URL("/sign-up", getAppUrl());
  invitationUrl.searchParams.set("email", email);

  return sendMail({
    type: EmailMessageType.USER_INVITATION,
    to: [{ email }],
    subject: "Te invitaron a crear tu usuario en Koru",
    react: createElement(UserInvitationEmail, {
      email,
      role,
      invitationUrl: invitationUrl.toString(),
    }),
    payload: {
      invitationId,
      email,
      role,
    },
  });
}
