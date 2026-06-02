import { createAuthMiddleware } from "@better-auth/core/api";
import { APIError } from "@better-auth/core/error";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  getPendingUserInvitationByEmail,
  normalizeInvitationEmail,
  reconcileUserInvitationAfterSignup,
} from "@/modules/users/server/users.repository";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
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

      const invitation = await getPendingUserInvitationByEmail(
        normalizeInvitationEmail(email),
      );

      if (!invitation) {
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
