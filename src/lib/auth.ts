import { createAuthMiddleware } from "@better-auth/core/api";
import { APIError } from "@better-auth/core/error";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  normalizeInvitationEmail,
  reconcileUserInvitationAfterSignup,
  requirePendingUserInvitationByEmail,
} from "@/modules/users/server/users.repository";

const googleCredentials =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          accessType: "offline" as const,
          prompt: "select_account consent" as const,
        },
      }
    : undefined;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: googleCredentials,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = normalizeInvitationEmail(user.email);
          let invitation: Awaited<
            ReturnType<typeof requirePendingUserInvitationByEmail>
          >;

          try {
            invitation = await requirePendingUserInvitationByEmail(email);
          } catch {
            throw APIError.from("FORBIDDEN", {
              code: "SIGN_UP_INVITATION_REQUIRED",
              message: "unauthorized_email",
            });
          }

          return {
            data: {
              ...user,
              email,
              role: invitation.role,
            },
          };
        },
        after: async (user) => {
          await reconcileUserInvitationAfterSignup(user.email);
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const email = ctx.body?.email;

      if (typeof email !== "string") {
        throw APIError.from("BAD_REQUEST", {
          code: "INVALID_EMAIL",
          message: "Invalid email",
        });
      }

      try {
        await requirePendingUserInvitationByEmail(normalizeInvitationEmail(email));
      } catch {
        throw APIError.from("FORBIDDEN", {
          code: "SIGN_UP_INVITATION_REQUIRED",
          message: "Email is not authorized to sign up",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const email = ctx.context.newSession?.user.email ?? ctx.body?.email;

      if (typeof email !== "string") {
        return;
      }

      await reconcileUserInvitationAfterSignup(email);
    }),
  },
  plugins: [nextCookies()],
});
