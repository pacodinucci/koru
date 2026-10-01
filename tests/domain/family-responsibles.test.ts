import assert from "node:assert/strict";
import test from "node:test";

import { buildFamilyResponsibles } from "../../src/modules/families/lib/family-responsibles";

test("includes every family user once and consolidates linked guardian rows without losing flags", () => {
  const result = buildFamilyResponsibles(
    [
      { id: "sol", name: "Sol Di Nucci", email: "sol@example.com" },
      { id: "tamir", name: "Tamir Lotan", email: "tamir@example.com" },
    ],
    [
      {
        firstName: "Francesca",
        lastName: "Gerstein Di Nucci",
        guardians: [{
          id: "sol-francesca",
          userId: "sol",
          email: "sol@example.com",
          fullName: "Sol Di Nucci",
          phone: "123",
          relationship: "GUARDIAN",
          canPickup: true,
          emergencyContact: false,
          user: { id: "sol", name: "Sol Di Nucci" },
        }],
        responsibles: [],
      },
      {
        firstName: "Felicia",
        lastName: "Gahl Gerstein Di Nucci",
        guardians: [{
          id: "sol-felicia",
          userId: "sol",
          email: "sol@example.com",
          fullName: "Sol Di Nucci",
          phone: "123",
          relationship: "GUARDIAN",
          canPickup: false,
          emergencyContact: true,
          user: { id: "sol", name: "Sol Di Nucci" },
        }],
        responsibles: [],
      },
    ],
    "tamir",
  );

  assert.equal(result.filter((item) => item.fullName === "Sol Di Nucci").length, 1);
  assert.equal(result.filter((item) => item.fullName === "Tamir Lotan").length, 1);
  assert.deepEqual(result.find((item) => item.fullName === "Sol Di Nucci")?.studentNames, [
    "Francesca Gerstein Di Nucci",
    "Felicia Gahl Gerstein Di Nucci",
  ]);
  assert.equal(result.find((item) => item.fullName === "Sol Di Nucci")?.canPickup, true);
  assert.equal(result.find((item) => item.fullName === "Sol Di Nucci")?.emergencyContact, true);
  assert.equal(result.find((item) => item.fullName === "Tamir Lotan")?.isCurrentUser, true);
  assert.equal(result.find((item) => item.fullName === "Tamir Lotan")?.editable, false);
  assert.equal(result.find((item) => item.fullName === "Tamir Lotan")?.deletable, false);
  assert.equal(result.find((item) => item.fullName === "Sol Di Nucci")?.deletable, false);
});

test("matches an unlinked guardian to a family user by normalized email", () => {
  const result = buildFamilyResponsibles(
    [{ id: "tamir", name: "Tamir Lotan", email: "tamir@example.com" }],
    [{
      firstName: "Francesca",
      lastName: "Gerstein",
      guardians: [{
        id: "tamir-francesca",
        userId: null,
        email: " TAMIR@example.com ",
        fullName: "Tamir Gerstein",
        phone: null,
        relationship: "FATHER",
        canPickup: false,
        emergencyContact: false,
      }],
      responsibles: [],
    }],
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].fullName, "Tamir Lotan");
  assert.equal(result[0].hasUser, true);
  assert.equal(result[0].deletable, false);
});

test("marks contacts without an account as deletable and keeps their source IDs", () => {
  const result = buildFamilyResponsibles([], [{
    firstName: "Francesca",
    lastName: "Gerstein",
    guardians: [{
      id: "external-guardian",
      userId: null,
      email: "emergency@example.com",
      fullName: "Contacto externo",
      phone: "5551234567",
      relationship: "OTHER",
      canPickup: false,
      emergencyContact: true,
    }],
    responsibles: [{
      id: "manual-contact",
      fullName: "Tía",
      relationship: "OTHER",
      phone: "5557654321",
      canPickup: true,
      emergencyContact: false,
    }],
  }]);

  assert.deepEqual(result.map((item) => [item.deletable, item.deleteIds]), [
    [true, ["external-guardian"]],
    [true, ["manual-contact"]],
  ]);
});
