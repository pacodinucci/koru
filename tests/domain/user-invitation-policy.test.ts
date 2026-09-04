import assert from "node:assert/strict";
import test from "node:test";

import { UserRole } from "@prisma/client";

import { validateInvitationFamily } from "../../src/modules/users/lib/user-invitation-policy";

test("una invitación PARENT exige familia", () => {
  assert.throws(() => validateInvitationFamily(UserRole.PARENT), /family_required_for_parent/);
  assert.doesNotThrow(() => validateInvitationFamily(UserRole.PARENT, "family-a"));
});

test("los demás roles no aceptan una familia asignada", () => {
  assert.throws(() => validateInvitationFamily(UserRole.TEACHER, "family-a"), /family_only_for_parent/);
  assert.doesNotThrow(() => validateInvitationFamily(UserRole.TEACHER));
});