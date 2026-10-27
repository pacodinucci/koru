import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function load(path, mocks, globals = {}) {
  const output = ts.transpileModule(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(output, { ...globals, module: loaded, exports: loaded.exports, require: id => { if (id === 'server-only') return {}; if (!(id in mocks)) throw new Error(`Unexpected dependency ${id}`); return mocks[id]; } });
  return loaded.exports;
}

test('invitation lookup rechecks institutional recipients but preserves legacy external invitations', async () => {
  const rows = [
    { id: 'allowed', userId: 'allowed', event: { accessScope: 'AREAS' } },
    { id: 'revoked', userId: 'revoked', event: { accessScope: 'AREAS' } },
    { id: 'external-institutional', userId: null, event: { accessScope: 'PEOPLE' } },
    { id: 'external-legacy', userId: null, event: { accessScope: 'LEGACY' } },
  ];
  const checks = [];
  const { listUnsentCalendarEventAttendances } = load('src/modules/calendar/server/calendar-attendance.repository.ts', {
    '@/lib/prisma': { prisma: { calendarEventAttendance: { findMany: async () => rows } } },
    '@prisma/client': { CalendarAttendanceStatus: { PENDING: 'PENDING' }, CalendarEventStatus: { PUBLISHED: 'PUBLISHED' } },
    '@/modules/calendar/server/calendar-access': { canUserReadCalendarEvent: async (eventId, userId) => { checks.push([eventId, userId]); return userId === 'allowed'; } },
  });
  const result = await listUnsentCalendarEventAttendances('event');
  assert.deepEqual(Array.from(result, r => r.id), ['allowed','external-legacy']);
  assert.deepEqual(checks, [['event','allowed'],['event','revoked']]);
});

test('revoked Google access removes an existing copy without reading or sending event content', async () => {
  const state = { eventReads: 0, upserts: 0, requests: [], updates: [] };
  const { syncConfirmedAttendanceToGoogle } = load('src/modules/calendar/server/google-calendar/google-calendar-sync.service.ts', {
    '@/modules/calendar/server/calendar-access': { canUserReadCalendarEvent: async () => false },
    '@prisma/client': { CalendarAttendanceStatus: { CONFIRMED: 'CONFIRMED' }, CalendarEventStatus: { PUBLISHED: 'PUBLISHED' }, GoogleCalendarConnectionStatus: { ACTIVE: 'ACTIVE' }, GoogleCalendarSyncStatus: { REMOVED: 'REMOVED' } },
    '@/lib/auth': { auth: { api: { getAccessToken: async () => ({ accessToken: 'isolated-token' }) } } },
    '@/lib/env': { env: { APP_URL: 'https://koru.example' } },
    '@/lib/prisma': { prisma: {
      googleCalendarConnection: { findFirst: async () => ({ id: 'connection', userId: 'revoked', accountId: 'account', calendarId: 'primary' }) },
      calendarEvent: { findFirst: async () => { state.eventReads++; return null; } },
      googleCalendarEventSync: { findUnique: async () => ({ id: 'sync', googleEventId: 'copy', status: 'SYNCED' }), update: async ({ data }) => { state.updates.push(data.status); }, upsert: async () => { state.upserts++; } },
    } },
    '@/modules/calendar/server/google-calendar/google-calendar-event': { buildGoogleCalendarEventPayload: () => { throw new Error('content_must_not_be_built'); } },
    '@/modules/calendar/server/google-calendar/google-calendar.repository': {},
  }, { fetch: async (url, init) => { state.requests.push({ url, method: init.method, body: init.body }); return { status: 204, ok: true }; } });
  await syncConfirmedAttendanceToGoogle('revoked','event');
  assert.equal(state.eventReads, 0);
  assert.equal(state.upserts, 0);
  assert.deepEqual(state.requests, [{ url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events/copy', method: 'DELETE', body: undefined }]);
  assert.deepEqual(state.updates, ['REMOVED']);
});

test('institutional area grants add calendar consultation but never global management or parent permissions', async () => {
  let record;
  const { getActualAuthenticatedUser } = load('src/modules/auth/server/auth-guards.ts', {
    'next/headers': { headers: async () => ({}) },
    'next/navigation': {},
    '@/lib/auth': { auth: { api: { getSession: async () => ({ user: { email: 'person@example.test' } }) } } },
    '@/lib/prisma': { prisma: { user: { findUnique: async () => record } } },
    '@prisma/client': { UserRole: {} },
    '@/modules/auth/permissions/permission-catalog': { legacyRolePermissions: { ADMIN_OPERATOR: ['dashboard.access'], PARENT: [] } },
    '@/modules/auth/roles': {},
    '@/modules/calendar/lib/calendar-access': { isInternalCalendarRole: role => role === 'ADMIN_OPERATOR' },
  });
  for (const [role, grants, expected] of [['ADMIN_OPERATOR', [{ areaId: 'operations' }], true], ['ADMIN_OPERATOR', [], false], ['PARENT', [{ areaId: 'operations' }], false]]) {
    record = { id: 'user', name: 'Person', email: 'person@example.test', role, familyId: null, accessRoleId: null, accessRole: null, calendarAreaGrants: grants };
    const user = await getActualAuthenticatedUser();
    assert.equal(user.permissionKeys.includes('calendar.view'), expected);
    assert.equal(user.permissionKeys.includes('calendar.manage'), false);
  }
});
