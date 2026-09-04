import assert from "node:assert/strict";
import test from "node:test";

import { createInvitationToken, hashInvitationToken, INVITATION_TTL_MS } from "../../src/modules/users/server/user-invitation-token";

test("genera un token opaco y guarda sólo su hash", () => {
  const invitation = createInvitationToken();

  assert.notEqual(invitation.token, invitation.tokenHash);
  assert.equal(invitation.tokenHash, hashInvitationToken(invitation.token));
});

test("la invitación vence en siete días", () => {
  const before = Date.now();
  const invitation = createInvitationToken();
  const after = Date.now();

  assert.ok(invitation.expiresAt.getTime() >= before + INVITATION_TTL_MS);
  assert.ok(invitation.expiresAt.getTime() <= after + INVITATION_TTL_MS);
});