import assert from "node:assert/strict";
import test from "node:test";
import { InvitationStatus, UserRole } from "@prisma/client";
import { assertGoogleInvitationCanCreateUser, getGoogleInvitationToken } from "../../src/modules/auth/lib/google-invitation-flow";

const invitation = { email: "family@example.com", role: UserRole.PARENT, familyId: "family-1", status: InvitationStatus.PENDING, expiresAt: new Date(Date.now() + 60_000) };

test("Google acepta una invitación vigente y asigna familia y rol", () => {
  assert.deepEqual(assertGoogleInvitationCanCreateUser("FAMILY@example.com", invitation), { role: UserRole.PARENT, familyId: "family-1" });
});

test("Google rechaza email diferente, vencimiento y familia inválida", () => {
  assert.throws(() => assertGoogleInvitationCanCreateUser("other@example.com", invitation), /not_authorized/);
  assert.throws(() => assertGoogleInvitationCanCreateUser("family@example.com", { ...invitation, expiresAt: new Date(Date.now() - 1) }), /not_authorized/);
  assert.throws(() => assertGoogleInvitationCanCreateUser("family@example.com", { ...invitation, familyId: null }), /family_required_for_parent/);
});

test("recupera el token desde la cookie segura", () => {
  assert.equal(getGoogleInvitationToken("other=1; koru_google_invitation=token%2Fsafe"), "token/safe");
  assert.equal(getGoogleInvitationToken(null), null);
});