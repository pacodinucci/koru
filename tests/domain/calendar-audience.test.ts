import assert from "node:assert/strict";
import test from "node:test";

import { CalendarAudienceType, UserRole } from "@prisma/client";

import {
  getAudienceRoles,
  getAudienceTypesForViewer,
} from "../../src/modules/calendar/lib/calendar-audience";

test("la audiencia docente incluye docentes y administradores docentes", () => {
  assert.deepEqual(getAudienceRoles(CalendarAudienceType.TEACHERS), [
    UserRole.TEACHER,
    UserRole.ADMIN_TEACHER,
  ]);
});

test("la audiencia de familias sólo incluye familias", () => {
  assert.deepEqual(getAudienceRoles(CalendarAudienceType.PARENTS), [
    UserRole.PARENT,
  ]);
});

test("superadmin y admin pueden visualizar todas las audiencias por rol", () => {
  const expected = [
    CalendarAudienceType.ALL,
    CalendarAudienceType.TEACHERS,
    CalendarAudienceType.PARENTS,
  ];

  assert.deepEqual(getAudienceTypesForViewer(UserRole.ADMIN), expected);
  assert.deepEqual(getAudienceTypesForViewer(UserRole.SUPERADMIN), expected);
});

test("administrador docente conserva la audiencia docente", () => {
  assert.deepEqual(getAudienceTypesForViewer(UserRole.ADMIN_TEACHER), [
    CalendarAudienceType.ALL,
    CalendarAudienceType.TEACHERS,
  ]);
});