import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
function fixture() {
  let linked = true; let behavior = 'normal'; const calls = []; let saved = null; let tokenCalls = 0; let deniedTokenCall = Infinity;
  const account = { id: 'db-account', accountId: 'google-sub', userId: 'admin', providerId: 'google', scope: 'https://www.googleapis.com/auth/calendar.events.owned' };
  const row = { id: 'connection', userId: 'admin', accountId: account.id, calendarId: 'primary', status: 'ACTIVE', account };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync('src/modules/appointments/server/appointments.google.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, URL, Error, AbortSignal, Response,
    fetch: async (url, init) => {
      calls.push({ url, init });
      if (init.method === 'POST') {
        if (behavior === 'denied') return new Response('', { status: 403 });
        if (behavior === 'unknown') throw new Error('secret provider transport detail');
        if (behavior === 'duplicate') return new Response('', { status: 409 });
        saved = { ...JSON.parse(init.body), status: 'confirmed', htmlLink: 'https://calendar.google.com/calendar/event?eid=test' };
        return Response.json(saved);
      }
      if (init.method === 'DELETE') { if (behavior === 'delete-fails') return new Response('', { status: 503 }); saved = null; return new Response(null, { status: 204 }); }
      return saved ? Response.json(saved) : new Response('', { status: 404 });
    },
    require: name => {
      if (name === 'server-only') return {};
      if (name === 'node:crypto') return { createHash };
      if (name === '@/lib/prisma') return { prisma: { googleCalendarConnection: { findUnique: async () => linked ? row : null, updateMany: async () => ({ count: 1 }) } } };
      if (name === '@/lib/auth') return { auth: { api: { getAccessToken: async ({ body }) => { if (++tokenCalls === deniedTokenCall) throw new Error('token refresh unavailable'); assert.equal(body.userId, 'admin'); assert.equal(body.accountId, 'google-sub'); return { accessToken: 'secret-token' }; } } } };
      throw new Error(name);
    },
  });
  return { api: module.exports, calls, row, account, disconnect: () => { linked = false; }, behavior: value => { behavior = value; }, saved: value => { saved = value; }, denyDuplicateReadToken: () => { deniedTokenCall = tokenCalls + 2; } };
}
const input = { id: 'appointment-uuid', recipientName: 'Ana', recipientEmail: 'family@example.test', startsAt: '2099-01-10T16:00:00.000Z', endsAt: '2099-01-10T16:30:00.000Z', mode: 'IN_PERSON', location: 'Koru', message: 'Entrevista' };
test('native invitation uses organizer primary calendar, attendee needsAction, sendUpdates all and stable bound event ID', async () => {
  const f = fixture(); const connection = await f.api.getAppointmentGoogleConnection('admin');
  const event = await f.api.createAppointmentGoogleEvent(connection, input); const request = f.calls.find(row => row.init.method === 'POST');
  assert.match(request.url, /\/calendars\/primary\/events\?sendUpdates=all$/);
  const payload = JSON.parse(request.init.body);
  assert.deepEqual(payload.attendees, [{ email: input.recipientEmail, displayName: 'Ana', responseStatus: 'needsAction' }]);
  assert.equal(payload.start.dateTime, input.startsAt); assert.equal(payload.end.dateTime, input.endsAt);
  assert.equal(payload.extendedProperties.private.koruAppointmentId, input.id);
  assert.match(event.id, /^[a-v0-9]{5,1024}$/); assert.equal(event.id, f.api.appointmentGoogleEventId(input.id));
  assert.equal(event.responseStatus, 'needsAction');
  f.behavior('duplicate'); const recovered = await f.api.createAppointmentGoogleEvent(connection, input); assert.equal(recovered.id, event.id);
  assert.equal(f.calls.filter(row => row.init.method === 'POST').length, 2);
});
test('reads intended attendee RSVP, validates binding and cancels same event with guest notification', async () => {
  const f = fixture(); const connection = await f.api.getAppointmentGoogleConnection('admin');
  const event = await f.api.createAppointmentGoogleEvent(connection, input);
  const payload = JSON.parse(f.calls.find(row => row.init.method === 'POST').init.body);
  f.saved({ ...payload, status: 'confirmed', attendees: [{ email: 'other@example.test', responseStatus: 'declined' }, { email: input.recipientEmail, responseStatus: 'accepted' }] });
  assert.equal((await f.api.getAppointmentGoogleEvent(connection, input.id)).responseStatus, 'accepted');
  f.behavior('delete-fails'); await assert.rejects(f.api.cancelAppointmentGoogleEvent(connection, input.id), error => error.outcome === 'unknown');
  f.behavior('normal'); await f.api.cancelAppointmentGoogleEvent(connection, input.id);
  assert.ok(f.calls.some(row => row.init.method === 'DELETE' && row.url.endsWith(`/${event.id}?sendUpdates=all`)));
  await f.api.cancelAppointmentGoogleEvent(connection, input.id);
  f.saved({ ...payload, extendedProperties: { private: { koruAppointmentId: 'another' } } });
  await assert.rejects(f.api.getAppointmentGoogleEvent(connection, input.id), error => error.outcome === 'unknown');
});
test('missing/revoked/mismatched account stops before network, unknown create retains uncertainty and safe errors', async () => {
  const f = fixture(); f.disconnect();
  await assert.rejects(f.api.getAppointmentGoogleConnection('admin'), error => error.outcome === 'unavailable'); assert.equal(f.calls.length, 0);
  const g = fixture(); const connection = await g.api.getAppointmentGoogleConnection('admin');
  g.account.userId = 'different-user';
  await assert.rejects(g.api.createAppointmentGoogleEvent(connection, input), error => error.outcome === 'unavailable'); assert.equal(g.calls.length, 0);
  g.account.userId = 'admin'; g.behavior('unknown');
  await assert.rejects(g.api.createAppointmentGoogleEvent(connection, input), error => error.outcome === 'unknown' && !error.message.includes('secret'));
  assert.equal(g.calls.filter(row => row.init.method === 'POST').length, 1);
  g.behavior('denied'); await assert.rejects(g.api.createAppointmentGoogleEvent(connection, input), error => error.outcome === 'rejected');
});

test('duplicate event with unavailable recovery token remains uncertain, never definitive failure', async () => {
  const f = fixture(); const connection = await f.api.getAppointmentGoogleConnection('admin');
  await f.api.createAppointmentGoogleEvent(connection, input);
  f.behavior('duplicate'); f.denyDuplicateReadToken();
  await assert.rejects(f.api.createAppointmentGoogleEvent(connection, input), error => error.outcome === 'unknown');
  assert.equal(f.calls.filter(row => row.init.method === 'POST').length, 2, 'explicit second attempt uses same ID without automatic mutation retry');
});
