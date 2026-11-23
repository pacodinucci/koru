import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function fixture({ role = 'TEACHER', manage = false, grants = [{ areaId: 'academic', canEdit: true }], editable = true } = {}) {
  const state = { writes: [], attendanceWrites: 0, transactions: 0 };
  const actor = { id: 'organizer', role, permissionKeys: manage ? ['calendar.manage'] : ['calendar.view'] };
  const users = [{ ...actor, name: 'Organizer', email: 'organizer@example.test' }, { id: 'teacher', role: 'TEACHER', name: 'Teacher', email: 'teacher@example.test' }, { id: 'parent', role: 'PARENT', name: 'Parent', email: 'parent@example.test' }];
  const prisma = {
    calendarArea: { count: async ({ where }) => where.id.in.filter(id => ['academic', 'operations'].includes(id)).length },
    calendarAreaGrant: { findMany: async () => grants },
    user: { count: async ({ where }) => users.filter(u => where.id.in.includes(u.id)).length, findMany: async ({ where }) => users.filter(u => where.id?.in ? where.id.in.includes(u.id) : u.role !== 'PARENT') },
    calendarEvent: { findUnique: async () => ({ id: 'event', attendanceConfirmationEnabled: false }), create: async ({ data }) => { state.writes.push(data); return { ...data, id: 'event' }; }, update: async ({ data }) => { state.writes.push(data); return { ...data, id: 'event' }; } },
    calendarEventAttendance: { createMany: async () => { state.attendanceWrites++; } },
  };
  prisma.$transaction = async work => { state.transactions++; return work(prisma); };
  const source = readFileSync(new URL('../../src/modules/dashboard/server/calendar.repository.ts', import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  const mocks = {
    '@/lib/prisma': { prisma },
    '@/modules/auth/server/auth-guards': { getAuthenticatedUser: async () => actor },
    '@/modules/calendar/server/calendar-access': { assertCalendarEventEditable: async () => { if (!editable) throw new Error('event_forbidden'); }, getCalendarReadWhere: async () => ({}), getCalendarEditWhere: async () => ({}) },
    '@/modules/calendar/lib/calendar-access': { isInternalCalendarRole: role => ['ADMIN','TEACHER'].includes(role) },
    '@/modules/calendar/lib/calendar-audience': { getAudienceRoles: () => undefined },
    '@/modules/dashboard/lib/calendar-range': {},
    '@prisma/client': { CalendarAudienceType: { PRIVATE: 'PRIVATE' }, CalendarEventStatus: {}, CalendarEventVisibility: { PUBLIC: 'PUBLIC' }, CalendarRegistrationAccess: { PUBLIC: 'PUBLIC', MEMBERS: 'MEMBERS' } },
  };
  vm.runInNewContext(output, { module: loaded, exports: loaded.exports, require: id => { if (!(id in mocks)) throw new Error(`Unexpected import ${id}`); return mocks[id]; } });
  const input = { title: 'Institutional meeting', startsAt: new Date('2026-10-01T15:00:00Z'), endsAt: new Date('2026-10-01T16:00:00Z'), timeZone: 'America/Mexico_City', allDay: false, status: 'PUBLISHED', visibility: 'MEMBERS', audienceType: 'PRIVATE', kind: 'MEETING', registrationsEnabled: false, attendanceConfirmationEnabled: false, createdById: actor.id, privateAudienceUserIds: [actor.id, 'teacher'], accessScope: 'AREAS', responsibleAreaId: 'academic', involvedAreaIds: ['academic', 'operations'], audienceAreaIds: ['academic'] };
  return { state, input, save: loaded.exports.saveCalendarEvent };
}

test('one event stores multiple areas without duplicate event writes and has a distinct area audience', async () => {
  const { save, input, state } = fixture();
  const event = await save(input);
  assert.equal(event.id, 'event');
  assert.equal(state.writes.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(state.writes[0].areaLinks.create)), [{ areaId: 'academic' }, { areaId: 'operations' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(state.writes[0].audienceAreas.create)), [{ areaId: 'academic' }]);
  assert.equal(state.writes[0].accessScope, 'AREAS');
  assert.equal(state.attendanceWrites, 0);
});

test('invalid areas, missing recipients, external publication and missing edit permission cause no writes', async () => {
  for (const [options, override, error] of [
    [{}, { responsibleAreaId: 'unknown' }, 'invalid_event_areas'],
    [{}, { involvedAreaIds: ['operations'] }, 'invalid_event_areas'],
    [{}, { audienceAreaIds: [] }, 'missing_audience_areas'],
    [{}, { involvedAreaIds: ['academic', 'unknown'] }, 'invalid_event_areas'],
    [{}, { visibility: 'PUBLIC' }, 'institutional_event_members_only'],
    [{ grants: [{ areaId: 'academic', canEdit: false }] }, {}, 'event_forbidden'],
    [{}, { accessScope: 'PEOPLE', privateAudienceUserIds: ['teacher'] }, 'organizer_must_be_authorized'],
    [{}, { accessScope: 'PEOPLE', privateAudienceUserIds: ['organizer','missing'] }, 'invalid_private_audience_user'],
    [{ editable: false }, { id: 'event' }, 'event_forbidden'],
    [{ role: 'PARENT', manage: true }, {}, 'invalid_event_areas'],
  ]) {
    const { save, input, state } = fixture(options);
    await assert.rejects(save({ ...input, ...override }), { message: error });
    assert.deepEqual(state, { writes: [], attendanceWrites: 0, transactions: 0 });
  }
});

test('legacy manager saves retain existing behavior and require no area assignment', async () => {
  const { save, input, state } = fixture({ role: 'ADMIN', manage: true });
  await save({ ...input, accessScope: 'LEGACY', responsibleAreaId: null, involvedAreaIds: [], audienceAreaIds: [], visibility: 'PUBLIC', audienceType: 'ALL', privateAudienceUserIds: [] });
  assert.equal(state.writes.length, 1);
  assert.equal(state.writes[0].visibility, 'PUBLIC');
  assert.equal(state.writes[0].accessScope, 'LEGACY');
  assert.equal(state.writes[0].responsibleAreaId, null);
  assert.equal(state.attendanceWrites, 0);
});
