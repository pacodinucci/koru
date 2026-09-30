import assert from "node:assert/strict";
import test from "node:test";

import { InvitationStatus, UserRole } from "@prisma/client";

import { hasValidSignupInvitationToken, validateInvitationFamily } from "../../src/modules/users/lib/user-invitation-policy";

test("una invitación aceptada conserva el enlace para reintentar mientras esté vigente", () => {
  const invitation = { status: InvitationStatus.ACCEPTED, tokenHash: "hash", expiresAt: new Date(Date.now() + 60_000) };
  assert.equal(hasValidSignupInvitationToken(invitation, "hash"), true);
  assert.equal(hasValidSignupInvitationToken({ ...invitation, status: InvitationStatus.PENDING }, "hash"), true);
  assert.equal(hasValidSignupInvitationToken({ ...invitation, status: InvitationStatus.REVOKED }, "hash"), false);
  assert.equal(hasValidSignupInvitationToken({ ...invitation, tokenHash: null }, "hash"), false);
  assert.equal(hasValidSignupInvitationToken({ ...invitation, expiresAt: new Date(Date.now() - 1) }, "hash"), false);
  assert.equal(hasValidSignupInvitationToken(invitation, "other"), false);
});

test("una invitación PARENT exige familia", () => {
  assert.throws(() => validateInvitationFamily(UserRole.PARENT), /family_required_for_parent/);
  assert.doesNotThrow(() => validateInvitationFamily(UserRole.PARENT, "family-a"));
});

test("los demás roles no aceptan una familia asignada", () => {
  assert.throws(() => validateInvitationFamily(UserRole.TEACHER, "family-a"), /family_only_for_parent/);
  assert.doesNotThrow(() => validateInvitationFamily(UserRole.TEACHER));
});
