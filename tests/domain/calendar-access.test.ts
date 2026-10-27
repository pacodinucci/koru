import assert from "node:assert/strict";
import test from "node:test";

import {
  canEditCalendarEvent,
  canReadCalendarEvent,
  isInternalCalendarRole,
  validateCalendarAreaSelection,
  type CalendarAccessEvent,
  type CalendarAccessViewer,
} from "../../src/modules/calendar/lib/calendar-access";

function viewer(overrides: Partial<CalendarAccessViewer> = {}): CalendarAccessViewer {
  return {
    id: "viewer",
    role: "TEACHER",
    canManageCalendar: false,
    areaGrants: [],
    ...overrides,
  };
}

function event(overrides: Partial<CalendarAccessEvent> = {}): CalendarAccessEvent {
  return {
    accessScope: "LEGACY",
    responsibleAreaId: null,
    audienceAreaIds: [],
    audienceUserIds: [],
    createdById: "creator",
    audienceType: "ALL",
    visibility: "MEMBERS",
    status: "PUBLISHED",
    ...overrides,
  };
}

const internalRoles = [
  "ADMIN", "ADMIN_OPERATOR", "ADMIN_TEACHER", "SUPERADMIN", "TEACHER",
  "PSYCHOPEDAGOGY_TEACHER",
];

test("internal roles use the exact existing staff allowlist", () => {
  for (const role of internalRoles) assert.equal(isInternalCalendarRole(role), true, role);
  for (const role of ["PARENT", "UNKNOWN", "teacher", "", "ADMIN "]) {
    assert.equal(isInternalCalendarRole(role), false, role);
  }
});

test("legacy anonymous reads require PUBLIC, ALL and PUBLISHED together", () => {
  for (const visibility of ["PUBLIC", "MEMBERS", "UNKNOWN"]) {
    for (const audienceType of ["ALL", "TEACHERS", "PARENTS", "PRIVATE", "UNKNOWN"]) {
      for (const status of ["PUBLISHED", "DRAFT", "ARCHIVED", "UNKNOWN"]) {
        assert.equal(
          canReadCalendarEvent(event({ visibility, audienceType, status }), null),
          visibility === "PUBLIC" && audienceType === "ALL" && status === "PUBLISHED",
          `${visibility}/${audienceType}/${status}`,
        );
      }
    }
  }
});

test("legacy authenticated audiences preserve existing query role behavior", () => {
  const roleAudiences: Record<string, string[]> = {
    ADMIN: ["ALL", "TEACHERS", "PARENTS"],
    ADMIN_OPERATOR: ["ALL", "TEACHERS", "PARENTS"],
    SUPERADMIN: ["ALL", "TEACHERS", "PARENTS"],
    ADMIN_TEACHER: ["ALL", "TEACHERS"],
    TEACHER: ["ALL", "TEACHERS"],
    PARENT: ["ALL", "PARENTS"],
    // Preserve getAudienceTypesForViewer's existing non-teacher fallback.
    PSYCHOPEDAGOGY_TEACHER: ["ALL", "PARENTS"],
    UNKNOWN: [],
  };
  for (const [role, allowed] of Object.entries(roleAudiences)) {
    for (const audienceType of ["ALL", "TEACHERS", "PARENTS", "PRIVATE", "UNKNOWN"]) {
      for (const visibility of ["PUBLIC", "MEMBERS"]) {
        assert.equal(
          canReadCalendarEvent(event({ audienceType, visibility }), viewer({ role })),
          allowed.includes(audienceType),
          `${role}/${audienceType}/${visibility}`,
        );
      }
    }
  }
});

test("legacy PRIVATE requires explicit user membership, including administrators and creators", () => {
  const privateEvent = event({ audienceType: "PRIVATE", createdById: "viewer" });
  for (const role of [...internalRoles, "PARENT"]) {
    const account = viewer({ role, canManageCalendar: true });
    assert.equal(canReadCalendarEvent(privateEvent, account), false, role);
    assert.equal(canReadCalendarEvent({ ...privateEvent, audienceUserIds: [account.id] }, account), true, role);
  }
  assert.equal(canReadCalendarEvent({ ...privateEvent, audienceUserIds: ["viewer"] }, viewer({ role: "UNKNOWN" })), false);
});

test("INTERNAL admits staff only, independent of legacy visibility and audience", () => {
  const internalEvent = event({ accessScope: "INTERNAL", visibility: "PUBLIC", audienceType: "ALL" });
  for (const role of internalRoles) assert.equal(canReadCalendarEvent(internalEvent, viewer({ role })), true, role);
  for (const role of ["PARENT", "UNKNOWN"]) {
    assert.equal(canReadCalendarEvent(internalEvent, viewer({ role, canManageCalendar: true })), false);
  }
  assert.equal(canReadCalendarEvent(internalEvent, null), false);
});

test("AREAS requires an internal viewer's grant for a selected audience area", () => {
  const areaEvent = event({ accessScope: "AREAS", responsibleAreaId: "direction", audienceAreaIds: ["academic", "operations"] });
  const reader = viewer({ areaGrants: [{ areaId: "operations", canEdit: false }] });
  assert.equal(canReadCalendarEvent(areaEvent, reader), true);
  assert.equal(canEditCalendarEvent(areaEvent, reader), false);
  const responsibleEditorWithoutRead = viewer({ areaGrants: [{ areaId: "direction", canEdit: true }] });
  assert.equal(canReadCalendarEvent(areaEvent, responsibleEditorWithoutRead), false);
  assert.equal(canEditCalendarEvent(areaEvent, responsibleEditorWithoutRead), false);
  assert.equal(canReadCalendarEvent(areaEvent, viewer({ canManageCalendar: true })), false);
  assert.equal(canEditCalendarEvent(areaEvent, viewer({ canManageCalendar: true })), false);
  assert.equal(canReadCalendarEvent({ ...areaEvent, createdById: "viewer" }, viewer()), false);
  assert.equal(canReadCalendarEvent({ ...areaEvent, audienceAreaIds: [] }, reader), false);
  assert.equal(canReadCalendarEvent(areaEvent, null), false);
  for (const role of ["PARENT", "UNKNOWN"]) {
    assert.equal(canReadCalendarEvent(areaEvent, { ...reader, role }), false);
  }
});

test("PEOPLE admits selected known accounts only; area, creator and management do not bypass selection", () => {
  const privateEvent = event({ accessScope: "PEOPLE", responsibleAreaId: "academic", audienceAreaIds: ["academic"], audienceUserIds: ["selected"], createdById: "viewer" });
  for (const role of [...internalRoles, "PARENT"]) {
    const account = viewer({ role, canManageCalendar: true, areaGrants: [{ areaId: "academic", canEdit: true }] });
    assert.equal(canReadCalendarEvent(privateEvent, account), false, role);
    assert.equal(canEditCalendarEvent(privateEvent, account), false, role);
    assert.equal(canReadCalendarEvent(privateEvent, { ...account, id: "selected" }), true, role);
  }
  assert.equal(canReadCalendarEvent(privateEvent, null), false);
  assert.equal(canReadCalendarEvent(privateEvent, viewer({ id: "selected", role: "UNKNOWN" })), false);
  assert.equal(canReadCalendarEvent({ ...privateEvent, audienceUserIds: [] }, viewer({ id: "selected" })), false);
});

test("read excludes unpublished events even for editors; edit separately permits drafts", () => {
  for (const accessScope of ["LEGACY", "INTERNAL", "AREAS", "PEOPLE"] as const) {
    const manager = viewer({ canManageCalendar: true, areaGrants: [{ areaId: "academic", canEdit: false }] });
    const readable = event({ accessScope, responsibleAreaId: "academic", audienceAreaIds: ["academic"], audienceUserIds: ["viewer"] });
    assert.equal(canReadCalendarEvent(readable, manager), true);
    // An omitted status denotes a projection already filtered for publication.
    assert.equal(canReadCalendarEvent({ ...readable, status: undefined }, manager), true);
    for (const status of ["DRAFT", "ARCHIVED", "UNKNOWN", ""]) {
      assert.equal(canReadCalendarEvent({ ...readable, status }, manager), false, `${accessScope}/${status}`);
    }
    assert.equal(canEditCalendarEvent({ ...readable, status: "DRAFT" }, manager), true, accessScope);
  }
});

test("new scope editing requires internal identity, readability and responsible-area edit or management", () => {
  for (const accessScope of ["INTERNAL", "AREAS", "PEOPLE"] as const) {
    const editable = event({ accessScope, responsibleAreaId: "direction", audienceAreaIds: ["academic"], audienceUserIds: ["viewer"] });
    const reader = viewer({ areaGrants: [{ areaId: "academic", canEdit: true }] });
    assert.equal(canEditCalendarEvent(editable, reader), false, accessScope);
    assert.equal(canEditCalendarEvent(editable, { ...reader, areaGrants: [...reader.areaGrants, { areaId: "direction", canEdit: false }] }), false);
    assert.equal(canEditCalendarEvent(editable, { ...reader, areaGrants: [...reader.areaGrants, { areaId: "direction", canEdit: true }] }), true);
    assert.equal(canEditCalendarEvent(editable, { ...reader, canManageCalendar: true }), true);
    assert.equal(canEditCalendarEvent({ ...editable, responsibleAreaId: null }, reader), false);
    assert.equal(canEditCalendarEvent(editable, null), false);
    for (const role of ["PARENT", "UNKNOWN"]) {
      assert.equal(canEditCalendarEvent(editable, { ...reader, role, canManageCalendar: true }), false);
    }
  }
});

test("legacy editing remains solely the calendar-management capability, not authorship or area grants", () => {
  const legacy = event({ audienceType: "PRIVATE", createdById: "viewer" });
  assert.equal(canEditCalendarEvent(legacy, viewer({ canManageCalendar: true })), true);
  assert.equal(canReadCalendarEvent(legacy, viewer({ canManageCalendar: true })), false);
  assert.equal(canEditCalendarEvent(legacy, viewer({ areaGrants: [{ areaId: "academic", canEdit: true }] })), false);
  assert.equal(canEditCalendarEvent(legacy, null), false);
});

test("unknown scope fails closed rather than taking the legacy branch", () => {
  const invalid = event({ accessScope: "UNKNOWN" as CalendarAccessEvent["accessScope"] });
  assert.equal(canReadCalendarEvent(invalid, viewer({ canManageCalendar: true })), false);
  assert.equal(canEditCalendarEvent(invalid, viewer({ canManageCalendar: true })), false);
});

test("participation and notification metadata cannot independently disclose restricted events", () => {
  const participant = {
    ...viewer({ canManageCalendar: true }),
    registrations: ["event"], attendances: ["event"], invitations: ["event"],
    notificationEventIds: ["event"], googleCalendarEventIds: ["event"],
  };
  for (const accessScope of ["LEGACY", "AREAS", "PEOPLE"] as const) {
    const restricted = event({ accessScope, audienceType: "PRIVATE" });
    const before = JSON.stringify({ participant, restricted });
    assert.equal(canReadCalendarEvent(restricted, participant), false);
    // Legacy management remains independent from content reads.
    assert.equal(canEditCalendarEvent(restricted, participant), accessScope === "LEGACY");
    assert.equal(JSON.stringify({ participant, restricted }), before);
  }
});

test("selection validation rejects missing/blank audience identifiers without mutating input", () => {
  for (const [accessScope, error] of [
    ["AREAS", "calendar_audience_areas_required"],
    ["PEOPLE", "calendar_audience_people_required"],
  ] as const) {
    for (const identifiers of [[], [""], [" "], ["valid", "\t"]]) {
      const input = { accessScope, audienceAreaIds: identifiers, audienceUserIds: identifiers };
      const before = JSON.stringify(input);
      assert.equal(validateCalendarAreaSelection(input), error);
      assert.equal(JSON.stringify(input), before);
    }
  }
  assert.equal(validateCalendarAreaSelection({ accessScope: "AREAS", audienceAreaIds: ["academic", "operations"], audienceUserIds: [] }), null);
  assert.equal(validateCalendarAreaSelection({ accessScope: "PEOPLE", audienceAreaIds: [], audienceUserIds: ["viewer"] }), null);
  for (const accessScope of ["LEGACY", "INTERNAL"] as const) {
    assert.equal(validateCalendarAreaSelection({ accessScope, audienceAreaIds: [], audienceUserIds: [] }), null);
  }
  assert.equal(validateCalendarAreaSelection({ accessScope: "UNKNOWN" as CalendarAccessEvent["accessScope"], audienceAreaIds: [], audienceUserIds: [] }), "calendar_access_scope_invalid");
});
