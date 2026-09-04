import assert from "node:assert/strict";
import test from "node:test";

import { invitationErrorState } from "../../src/modules/users/lib/user-invitation-feedback";

test("expone el error de un email que ya tiene usuario", () => {
  assert.deepEqual(invitationErrorState("user_already_exists"), {
    status: "error",
    message: "Ese email ya tiene un usuario creado.",
  });
});

test("expone el error de familia requerida", () => {
  assert.deepEqual(invitationErrorState("family_required_for_parent"), {
    status: "error",
    message: "Asigná una familia antes de enviar la invitación.",
  });
});

test("protege con un mensaje genérico los errores no esperados", () => {
  assert.deepEqual(invitationErrorState("unexpected_error"), {
    status: "error",
    message: "No pudimos crear la invitación. Intentá de nuevo.",
  });
});
