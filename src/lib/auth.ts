import { createAuthMiddleware } from "@better-auth/core/api";
import { APIError } from "@better-auth/core/error";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import {
  assertGoogleInvitationCanCreateUser,
  getGoogleInvitationToken,
} from "@/modules/auth/lib/google-invitation-flow";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  normalizeInvitationEmail,
  reconcileUserInvitationAfterSignup,
  requirePendingUserInvitationByEmail,
} from "@/modules/users/server/users.repository";

const googleCredentials = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
  ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, accessType: "offline" as const, prompt: "select_account consent" as const, disableImplicitSignUp: true } }
  : undefined;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: googleCredentials,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  account: { encryptOAuthTokens: true, accountLinking: { enabled: true, trustedProviders: ["google"] } },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const token = getGoogleInvitationToken(context?.headers?.get("cookie") ?? null);
          if (!token) return;
          if (typeof user.email !== "string") return false;
          try {
            const invitation = await requirePendingUserInvitationByEmail(normalizeInvitationEmail(user.email), token);
            return { data: assertGoogleInvitationCanCreateUser(user.email, invitation) };
          } catch {
            return false;
          }
        },
        after: async (user, context) => {
          const token = getGoogleInvitationToken(context?.headers?.get("cookie") ?? null);
          if (!token) return;
          if (typeof user.email !== "string") throw new Error("google_invitation_not_authorized");
          await reconcileUserInvitationAfterSignup(user.email, token);
        },
      },
    },
  },  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = ctx.body?.email;
      const token = ctx.body?.invitationToken;
      if (typeof email !== "string" || typeof token !== "string") {
        throw APIError.from("BAD_REQUEST", { code: "INVALID_EMAIL", message: "Invalid email" });
      }
      try {
        await requirePendingUserInvitationByEmail(normalizeInvitationEmail(email), token);
      } catch {
        throw APIError.from("FORBIDDEN", { code: "SIGN_UP_INVITATION_REQUIRED", message: "Email is not authorized to sign up" });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = ctx.context.newSession?.user.email ?? ctx.body?.email;
      const token = ctx.body?.invitationToken;
      if (typeof email !== "string" || typeof token !== "string") return;
      await reconcileUserInvitationAfterSignup(email, token);
    }),
  },
  plugins: [nextCookies()],
});