import { createHash, randomBytes } from "crypto";

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export function createInvitationToken() { const token = randomBytes(32).toString("base64url"); return { token, tokenHash: hashInvitationToken(token), expiresAt: new Date(Date.now() + INVITATION_TTL_MS) }; }
export function hashInvitationToken(token: string) { return createHash("sha256").update(token).digest("hex"); }